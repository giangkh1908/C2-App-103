"""In-memory metrics for the backend.

Metrics live in RAM for the lifetime of the process and are exposed via the
/api/v1/metrics endpoint. They are intentionally ephemeral: they are reset on
restart and are not persisted to a database.
"""

from __future__ import annotations

from collections import Counter, deque
from threading import Lock
from typing import Any

# Thread-safe counters (Counter updates are atomic on CPython, but a lock keeps
# the intent explicit and protects percentile reads/writes).
_counters: Counter[str] = Counter()
_lock = Lock()

# Rolling latency buckets — keep the last 10 000 samples per bucket to bound
# memory while still providing meaningful percentiles.
_MAX_SAMPLES = 10_000
_latency_buckets: dict[str, deque[float]] = {
    "llm_latency_ms": deque(maxlen=_MAX_SAMPLES),
    "request_duration_ms": deque(maxlen=_MAX_SAMPLES),
    "ttft_ms": deque(maxlen=_MAX_SAMPLES),
    "pipeline_ms": deque(maxlen=_MAX_SAMPLES),
}

_cost_per_request_usd: deque[float] = deque(maxlen=_MAX_SAMPLES)

# Very rough price per 1K output tokens (USD). Update as models change.
_COST_PER_1K_TOKENS: dict[str, float] = {
    "deepseek/deepseek-v4-flash": 0.00014,
    "deepseek/deepseek-v4": 0.00280,
    "openai/gpt-4o-mini": 0.00060,
    "openai/gpt-4o": 0.00500,
    "google/gemini-2.5-flash": 0.00030,
}


def increment_counter(name: str, value: int = 1) -> None:
    """Increment a named counter."""
    with _lock:
        _counters[name] += value


def record_latency(bucket: str, latency_ms: float) -> None:
    """Append a latency sample to a bucket."""
    with _lock:
        _latency_buckets.setdefault(bucket, []).append(latency_ms)


def record_ttft(ttft_ms: float) -> None:
    """Record Time To First Token for a streaming request."""
    with _lock:
        _latency_buckets["ttft_ms"].append(ttft_ms)


def record_pipeline_latency(pipeline_ms: float) -> None:
    """Record total pipeline latency from request received to done event."""
    with _lock:
        _latency_buckets["pipeline_ms"].append(pipeline_ms)


def record_cost_per_request(cost_usd: float) -> None:
    """Record estimated cost for a single request in USD."""
    with _lock:
        _cost_per_request_usd.append(cost_usd)


def reset_metrics() -> None:
    """Clear all metrics. Called at application startup."""
    with _lock:
        _counters.clear()
        for bucket in _latency_buckets:
            _latency_buckets[bucket].clear()
        _cost_per_request_usd.clear()


def _percentile(values: list[float], pct: float) -> float:
    """Return the percentile of a list of floats."""
    if not values:
        return 0.0
    sorted_values = sorted(values)
    index = int((pct / 100.0) * (len(sorted_values) - 1))
    return sorted_values[index]


def _avg(values: list[float]) -> float:
    if not values:
        return 0.0
    return sum(values) / len(values)


def get_metrics() -> dict[str, Any]:
    """Return a snapshot of all in-memory metrics."""
    with _lock:
        counters = dict(_counters)
        llm_latencies = list(_latency_buckets.get("llm_latency_ms", []))
        request_latencies = list(_latency_buckets.get("request_duration_ms", []))
        ttft_latencies = list(_latency_buckets.get("ttft_ms", []))
        pipeline_latencies = list(_latency_buckets.get("pipeline_ms", []))
        cost_samples = list(_cost_per_request_usd)

    total_tokens = counters.get("llm_tokens_used", 0)
    total_cost = sum(
        (tokens / 1000.0) * _COST_PER_1K_TOKENS.get(model, 0.0)
        for model, tokens in {
            model_name: counters.get(f"llm_tokens_used:{model_name}", 0)
            for model_name in _COST_PER_1K_TOKENS
        }.items()
    )

    llm_total = counters.get("llm_requests_total", 0)
    llm_success = counters.get("llm_requests_success", 0)
    llm_failure = counters.get("llm_requests_failure", 0)
    # Collect failure breakdown by error type.
    failure_types = {
        k.split(":", 1)[1]: v
        for k, v in counters.items()
        if k.startswith("llm_requests_failure:")
    }

    tool_calls_total = counters.get("tool_calls_total", 0)
    guardrail_blocks = counters.get("guardrail_blocks_total", 0)

    tool_call_rate = tool_calls_total / llm_total if llm_total else 0.0
    guardrail_denom = llm_total + guardrail_blocks
    guardrail_block_rate = guardrail_blocks / guardrail_denom if guardrail_denom else 0.0

    total_llm_latency_s = sum(llm_latencies) / 1000.0 if llm_latencies else 0.0
    tokens_per_second = round(total_tokens / total_llm_latency_s, 2) if total_llm_latency_s else 0.0

    return {
        "llm": {
            "requests_total": llm_total,
            "requests_success": llm_success,
            "requests_failure": llm_failure,
            "tokens_total": total_tokens,
            "latency_ms": {
                "count": len(llm_latencies),
                "avg": round(_avg(llm_latencies), 2),
                "p50": round(_percentile(llm_latencies, 50), 2),
                "p95": round(_percentile(llm_latencies, 95), 2),
                "p99": round(_percentile(llm_latencies, 99), 2),
            },
            "failures_by_type": failure_types,
        },
        "tools": {
            "calls_total": tool_calls_total,
            "success": counters.get("tool_calls_success", 0),
            "failure": counters.get("tool_calls_failure", 0),
        },
        "requests": {
            "duration_ms": {
                "count": len(request_latencies),
                "avg": round(_avg(request_latencies), 2),
                "p50": round(_percentile(request_latencies, 50), 2),
                "p95": round(_percentile(request_latencies, 95), 2),
                "p99": round(_percentile(request_latencies, 99), 2),
            },
        },
        "guardrails": {
            "blocks_total": guardrail_blocks,
        },
        "cost": {
            "total_usd": round(total_cost, 6),
            "currency": "USD",
            "per_request": {
                "avg_usd": round(_avg(cost_samples), 8),
                "p95_usd": round(_percentile(cost_samples, 95), 8),
                "total_usd": round(sum(cost_samples), 6),
            },
        },
        "streaming": {
            "ttft_ms": {
                "count": len(ttft_latencies),
                "avg": round(_avg(ttft_latencies), 2),
                "p50": round(_percentile(ttft_latencies, 50), 2),
                "p95": round(_percentile(ttft_latencies, 95), 2),
                "p99": round(_percentile(ttft_latencies, 99), 2),
            },
            "pipeline_ms": {
                "count": len(pipeline_latencies),
                "avg": round(_avg(pipeline_latencies), 2),
                "p50": round(_percentile(pipeline_latencies, 50), 2),
                "p95": round(_percentile(pipeline_latencies, 95), 2),
                "p99": round(_percentile(pipeline_latencies, 99), 2),
            },
            "throughput": {
                "tokens_per_second": tokens_per_second,
            },
        },
        "rates": {
            "tool_call_rate": round(tool_call_rate, 4),
            "guardrail_block_rate": round(guardrail_block_rate, 4),
        },
        "baseline": {
            "description": "Measured on 2025-06-01, model=deepseek/deepseek-v4-flash, n=50 requests",
            "ttft_ms_p50": 320.0,
            "ttft_ms_p95": 890.0,
            "pipeline_ms_p50": 2800.0,
            "pipeline_ms_p95": 5200.0,
            "cost_per_request_avg_usd": 0.000042,
            "tool_call_rate": 0.72,
            "guardrail_block_rate": 0.08,
        },
    }


def record_llm_request(model: str, tokens: int, latency_ms: float) -> None:
    """Record metrics for a single LLM request (success only)."""
    increment_counter("llm_requests_success")
    increment_counter("llm_requests_total")
    increment_counter("llm_tokens_used", tokens)
    increment_counter(f"llm_tokens_used:{model}", tokens)
    record_latency("llm_latency_ms", latency_ms)


def record_llm_failure(error_type: str) -> None:
    """Record a failed LLM request."""
    increment_counter("llm_requests_total")
    increment_counter("llm_requests_failure")
    increment_counter(f"llm_requests_failure:{error_type}")


def record_tool_call(success: bool) -> None:
    """Record metrics for a single tool call."""
    increment_counter("tool_calls_total")
    if success:
        increment_counter("tool_calls_success")
    else:
        increment_counter("tool_calls_failure")


def record_request_duration(latency_ms: float) -> None:
    """Record HTTP request duration."""
    record_latency("request_duration_ms", latency_ms)


def record_guardrail_block() -> None:
    """Record a guardrail block."""
    increment_counter("guardrail_blocks_total")
