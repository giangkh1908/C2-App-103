#!/usr/bin/env python3
"""Evaluation runner for AI tutor agent.

Calls the live /api/v1/chat/stream endpoint and measures accuracy,
tool selection, latency (TTFT + total), and cost.
"""

import argparse
import asyncio
import json
import statistics
import time
import uuid
from datetime import UTC, datetime
from typing import Any

import httpx


def _percentile(values: list[float], pct: float) -> float:
    if not values:
        return 0.0
    sorted_values = sorted(values)
    index = int((pct / 100.0) * (len(sorted_values) - 1))
    return sorted_values[index]


async def call_agent(
    problem: dict[str, Any],
    base_url: str,
    token: str | None,
) -> dict[str, Any]:
    """Call the streaming chat endpoint for one problem.

    Returns: answer_text, detected_topic, tool_used, latency_ms, ttft_ms, tokens_used.
    """
    url = f"{base_url.rstrip('/')}/api/v1/chat/stream"
    headers: dict[str, str] = {"Accept": "text/event-stream"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    payload = {
        "message": problem["question"],
        "grade": problem.get("grade", 3),
        "session_id": uuid.uuid4().hex,
        "selected_topic": None,
        "user_id": "eval_runner",
    }

    answer_parts: list[str] = []
    detected_topic: str | None = None
    tool_used: str | None = None
    tokens_used: int = 0
    ttft_ms: float = 0.0
    first_token_time: float | None = None

    request_start = time.perf_counter()

    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream("POST", url, headers=headers, json=payload) as response:
            response.raise_for_status()
            async for raw_line in response.aiter_lines():
                if not raw_line.startswith("data:"):
                    continue
                data_str = raw_line[5:].strip()
                if not data_str or data_str == "[DONE]":
                    continue

                try:
                    event = json.loads(data_str)
                except json.JSONDecodeError:
                    continue

                event_type = event.get("type")

                if event_type == "chunk":
                    chunk = event.get("content") or event.get("data") or ""
                    if chunk and first_token_time is None:
                        first_token_time = time.perf_counter()
                        ttft_ms = round((first_token_time - request_start) * 1000, 2)
                    answer_parts.append(str(chunk))

                elif event_type == "done":
                    done_data = event.get("data") or {}
                    detected_topic = done_data.get("topic") or done_data.get("detected_topic")
                    visual_card = done_data.get("visual_card") or {}
                    agent_meta = done_data.get("agent_metadata") or {}
                    tool_used = agent_meta.get("tool_used")
                    tokens_used = agent_meta.get("tokens_used", 0)

                    # Fallback: infer tool from visual type
                    if not tool_used:
                        visual_spec = done_data.get("visual_spec") or {}
                        tool_used = visual_spec.get("visual_type") or visual_card.get("type")

    latency_ms = round((time.perf_counter() - request_start) * 1000, 2)
    answer_text = "".join(answer_parts).strip()

    return {
        "answer_text": answer_text,
        "detected_topic": detected_topic,
        "tool_used": tool_used,
        "latency_ms": latency_ms,
        "ttft_ms": ttft_ms,
        "tokens_used": tokens_used,
    }


async def _run_single(
    problem: dict[str, Any],
    base_url: str,
    token: str | None,
    verbose: bool,
) -> dict[str, Any]:
    """Run one problem and return the detail dict."""
    try:
        result = await call_agent(problem, base_url, token)
    except Exception as exc:
        if verbose:
            print(f"  ERROR {problem['id']}: {exc}")
        return {
            "problem_id": problem["id"],
            "expected_keywords": problem.get("expected_answer_keywords", []),
            "expected_tool": problem.get("expected_tool"),
            "answer_text": "",
            "detected_topic": None,
            "tool_used": None,
            "latency_ms": 0.0,
            "ttft_ms": 0.0,
            "tokens_used": 0,
            "keyword_match": False,
            "tool_match": False,
            "error": str(exc),
        }

    keywords = problem.get("expected_answer_keywords", [])
    answer_lower = result["answer_text"].lower()
    keyword_match = any(kw.lower() in answer_lower for kw in keywords)

    expected_tool = problem.get("expected_tool")
    tool_match = (result["tool_used"] == expected_tool) if expected_tool else True

    if verbose:
        kw_sym = "✓" if keyword_match else "✗"
        tool_sym = "✓" if tool_match else "✗"
        print(
            f"  [{kw_sym}kw {tool_sym}tool] {problem['id']} "
            f"ttft={result['ttft_ms']}ms latency={result['latency_ms']}ms "
            f"tool={result['tool_used']!r}"
        )

    return {
        "problem_id": problem["id"],
        "expected_keywords": keywords,
        "expected_tool": expected_tool,
        **result,
        "keyword_match": keyword_match,
        "tool_match": tool_match,
    }


async def run_evaluation(
    dataset: dict[str, Any],
    base_url: str = "http://localhost:8000",
    token: str | None = None,
    verbose: bool = False,
    concurrency: int = 1,
) -> dict[str, Any]:
    """Run evaluation on all problems in the dataset."""
    problems = dataset.get("problems", [])
    semaphore = asyncio.Semaphore(min(concurrency, 5))

    async def _bounded(problem: dict[str, Any]) -> dict[str, Any]:
        async with semaphore:
            return await _run_single(problem, base_url, token, verbose)

    details = await asyncio.gather(*[_bounded(p) for p in problems])

    total = len(details)
    keyword_correct = sum(1 for d in details if d.get("keyword_match"))
    tool_correct = sum(1 for d in details if d.get("tool_match") and d.get("expected_tool"))
    tool_total = sum(1 for d in details if d.get("expected_tool"))

    latencies = [d["latency_ms"] for d in details if d["latency_ms"] > 0]
    ttfts = [d["ttft_ms"] for d in details if d["ttft_ms"] > 0]
    total_tokens = sum(d.get("tokens_used", 0) for d in details)

    # Rough cost using deepseek-v4-flash pricing as default
    _cost_per_1k = 0.00014
    total_cost_usd = (total_tokens / 1000.0) * _cost_per_1k

    return {
        "model": dataset.get("model", "unknown"),
        "dataset": dataset.get("topic", "unknown"),
        "timestamp": datetime.now(tz=UTC).isoformat(),
        "total": total,
        "metrics": {
            "accuracy": round(keyword_correct / total, 4) if total else 0.0,
            "tool_accuracy": round(tool_correct / tool_total, 4) if tool_total else None,
            "ttft_ms": {
                "avg": round(statistics.mean(ttfts), 2) if ttfts else 0.0,
                "p50": round(_percentile(ttfts, 50), 2),
                "p95": round(_percentile(ttfts, 95), 2),
            },
            "latency_ms": {
                "avg": round(statistics.mean(latencies), 2) if latencies else 0.0,
                "p50": round(_percentile(latencies, 50), 2),
                "p95": round(_percentile(latencies, 95), 2),
            },
            "cost_usd": {
                "total": round(total_cost_usd, 8),
                "avg_per_request": round(total_cost_usd / total, 8) if total else 0.0,
            },
            "total_tokens": total_tokens,
        },
        "details": list(details),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Run AI tutor agent evaluation")
    parser.add_argument("--dataset", required=True, help="Path to dataset JSON file")
    parser.add_argument("--model", default="deepseek/deepseek-v4-flash", help="LLM model name (informational)")
    parser.add_argument("--base-url", default="http://localhost:8000", help="Base URL of the backend API")
    parser.add_argument("--token", default=None, help="Bearer token for authentication")
    parser.add_argument("--concurrency", type=int, default=1, help="Max concurrent requests (1–5)")
    parser.add_argument("--verbose", action="store_true", help="Print per-problem results")
    parser.add_argument("--output", help="Output file path for JSON results")
    args = parser.parse_args()

    with open(args.dataset, encoding="utf-8") as f:
        dataset = json.load(f)

    dataset.setdefault("model", args.model)

    if args.verbose:
        print(f"Dataset : {args.dataset}")
        print(f"Topic   : {dataset.get('topic', 'unknown')}")
        print(f"Problems: {len(dataset.get('problems', []))}")
        print(f"Base URL: {args.base_url}")
        print(f"Concurrency: {args.concurrency}")
        print()

    results = asyncio.run(
        run_evaluation(
            dataset,
            base_url=args.base_url,
            token=args.token,
            verbose=args.verbose,
            concurrency=args.concurrency,
        )
    )

    output_json = json.dumps(results, indent=2, ensure_ascii=False)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(output_json)
        print(f"Results saved to {args.output}")
    else:
        print(output_json)


if __name__ == "__main__":
    main()
