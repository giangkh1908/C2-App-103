#!/usr/bin/env python3
"""Evaluation runner for AI agent."""

import argparse
import json
import time
from typing import Any


def load_dataset(path: str) -> dict[str, Any]:
    """Load evaluation dataset from JSON file."""
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def run_evaluation(
    dataset: dict[str, Any],
    model: str = "gpt-4o-mini",
    verbose: bool = False,
) -> dict[str, Any]:
    """Run evaluation on dataset."""
    results = {
        "model": model,
        "dataset": dataset.get("topic", "unknown"),
        "total": len(dataset.get("problems", [])),
        "correct": 0,
        "details": [],
    }

    for problem in dataset.get("problems", []):
        start_time = time.time()

        # TODO: Call AI agent with problem
        # response = call_agent(problem["question"], model=model)
        response = None  # Placeholder

        elapsed_ms = int((time.time() - start_time) * 1000)

        is_correct = response == problem.get("expected_answer") if response else False

        detail = {
            "problem_id": problem["id"],
            "expected": problem.get("expected_answer"),
            "actual": response,
            "correct": is_correct,
            "response_time_ms": elapsed_ms,
        }

        results["details"].append(detail)
        if is_correct:
            results["correct"] += 1

        if verbose:
            status = "✓" if is_correct else "✗"
            print(
                f"  {status} {problem['id']}: expected={detail['expected']}, actual={detail['actual']}"
            )

    results["accuracy"] = results["correct"] / results["total"] if results["total"] > 0 else 0
    avg_time = (
        sum(d["response_time_ms"] for d in results["details"]) / len(results["details"])
        if results["details"]
        else 0
    )
    results["avg_response_time_ms"] = int(avg_time)

    return results


def main():
    parser = argparse.ArgumentParser(description="Run AI agent evaluation")
    parser.add_argument("--dataset", required=True, help="Path to dataset JSON file")
    parser.add_argument("--model", default="gpt-4o-mini", help="LLM model to use")
    parser.add_argument("--verbose", action="store_true", help="Print detailed output")
    parser.add_argument("--output", help="Output file for results")

    args = parser.parse_args()

    dataset = load_dataset(args.dataset)

    if args.verbose:
        print(f"Running evaluation on {args.dataset}")
        print(f"Model: {args.model}")
        print(f"Problems: {len(dataset.get('problems', []))}")
        print()

    results = run_evaluation(dataset, model=args.model, verbose=args.verbose)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        print(f"Results saved to {args.output}")
    else:
        print(json.dumps(results, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
