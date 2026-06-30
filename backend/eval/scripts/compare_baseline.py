#!/usr/bin/env python3
"""Compare current eval results against a baseline and detect regression.

Usage:
    python compare_baseline.py --current results.json --baseline baseline.json
    python compare_baseline.py --current results.json --baseline baseline.json --min-accuracy 0.95

Thresholds:
    - accuracy < --min-accuracy (default 0.90 = 90%)  → FAIL
    - latency p50 tăng >50% so với baseline             → FAIL
    - TTFT p50 tăng >50% so với baseline                → FAIL
"""

from __future__ import annotations

import argparse
import json
import math
import sys


def _load_json(path: str) -> dict:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _pct_change(current: float, baseline: float) -> float | None:
    """Return (current - baseline) / baseline, or None when baseline is 0."""
    if baseline == 0:
        return None
    return (current - baseline) / baseline


def _fmt_change(change: float | None) -> str:
    if change is None:
        return "N/A"
    if math.isinf(change):
        return "+inf%" if change > 0 else "-inf%"
    return f"{change * 100:+.2f}%"


def compare(current_path: str, baseline_path: str, min_accuracy: float = 0.90) -> int:
    current = _load_json(current_path)
    baseline = _load_json(baseline_path)

    cur_metrics = current.get("metrics", {})
    base_metrics = baseline.get("metrics", {})

    cur_model = current.get("model", "unknown")
    base_model = baseline.get("model", "unknown")
    cur_dataset = current.get("dataset", "unknown")
    base_dataset = baseline.get("dataset", "unknown")

    # Prompt version warning
    cur_pv = current.get("prompt_version")
    base_pv = baseline.get("prompt_version")
    if cur_pv and base_pv and cur_pv != base_pv:
        print(f"⚠ WARNING: prompt_version differs — current={cur_pv!r} baseline={base_pv!r}")

    print(f"Baseline : {baseline_path}  ({baseline.get('timestamp', '?')})")
    print(f"Current  : {current_path}  ({current.get('timestamp', '?')})")
    print(f"Model    : {base_model} → {cur_model}")
    print(f"Dataset  : {base_dataset} → {cur_dataset}")
    print(f"Total    : baseline={baseline.get('total', '?')}  current={current.get('total', '?')}")
    print()
    print(f"{'Metric':<30} {'Baseline':<14} {'Current':<14} {'Change':<14} {'Status'}")
    print("-" * 90)

    failed = False
    checks: list[tuple[str, float, float, float | None, str]] = []

    # ── Accuracy: absolute threshold ──────────────────────────────
    cur_acc = cur_metrics.get("accuracy", 0.0)
    base_acc = base_metrics.get("accuracy", 0.0)
    acc_change = _pct_change(cur_acc, base_acc)
    acc_ok = cur_acc >= min_accuracy
    checks.append(
        (
            f"Accuracy (min={min_accuracy * 100:.0f}%)",
            base_acc,
            cur_acc,
            acc_change,
            "PASS" if acc_ok else "FAIL",
        )
    )
    if not acc_ok:
        failed = True

    # ── Latency p50: relative increase ────────────────────────────
    def _get_nested(d: dict, *keys: str, default: float = 0.0) -> float:
        for k in keys:
            d = d.get(k, {}) if isinstance(d, dict) else {}
        return d if isinstance(d, (int, float)) else default

    cur_lat = _get_nested(cur_metrics, "latency_ms", "p50")
    base_lat = _get_nested(base_metrics, "latency_ms", "p50")
    lat_change = _pct_change(cur_lat, base_lat)
    lat_ok = lat_change is None or lat_change <= 0.50
    checks.append(("Latency p50 (ms)", base_lat, cur_lat, lat_change, "PASS" if lat_ok else "FAIL"))
    if not lat_ok:
        failed = True

    # ── TTFT p50: relative increase ───────────────────────────────
    cur_ttft = _get_nested(cur_metrics, "ttft_ms", "p50")
    base_ttft = _get_nested(base_metrics, "ttft_ms", "p50")
    ttft_change = _pct_change(cur_ttft, base_ttft)
    ttft_ok = ttft_change is None or ttft_change <= 0.50
    checks.append(
        ("TTFT p50 (ms)", base_ttft, cur_ttft, ttft_change, "PASS" if ttft_ok else "FAIL")
    )
    if not ttft_ok:
        failed = True

    # Tool accuracy (informational)
    cur_tool = cur_metrics.get("tool_accuracy")
    base_tool = base_metrics.get("tool_accuracy")
    if cur_tool is not None and base_tool is not None:
        tool_change = _pct_change(cur_tool, base_tool)
        checks.append(("Tool Accuracy", base_tool, cur_tool, tool_change, "info"))

    # Cost (informational)
    cur_cost = cur_metrics.get("cost_usd", {}).get("avg_per_request", 0.0)
    base_cost = base_metrics.get("cost_usd", {}).get("avg_per_request", 0.0)
    cost_change = _pct_change(cur_cost, base_cost)
    checks.append(("Avg Cost/req ($)", base_cost, cur_cost, cost_change, "info"))

    # Tokens (informational)
    cur_tok = cur_metrics.get("total_tokens", 0)
    base_tok = base_metrics.get("total_tokens", 0)
    tok_change = _pct_change(float(cur_tok), float(base_tok))
    checks.append(("Total tokens", float(base_tok), float(cur_tok), tok_change, "info"))

    for name, base_val, cur_val, change, status in checks:
        chg_str = _fmt_change(change)
        print(f"{name:<30} {base_val:<14} {cur_val:<14} {chg_str:<14} {status}")

    print()
    if failed:
        print("❌ Regression detected — one or more checks FAILED")
    else:
        print("✅ All regression checks PASSED")

    return 1 if failed else 0


def main() -> None:
    parser = argparse.ArgumentParser(description="Compare eval results against baseline")
    parser.add_argument("--current", required=True, help="Current eval results JSON")
    parser.add_argument("--baseline", required=True, help="Baseline eval results JSON")
    parser.add_argument(
        "--min-accuracy",
        type=float,
        default=0.90,
        help="Absolute accuracy threshold (default: 0.90 = 90%%)",
    )
    args = parser.parse_args()

    sys.exit(compare(args.current, args.baseline, args.min_accuracy))


if __name__ == "__main__":
    main()
