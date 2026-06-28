from fastapi import APIRouter
from pydantic import BaseModel

from src.core.metrics import get_metrics

router = APIRouter(prefix="/metrics", tags=["metrics"])


class MetricsResponse(BaseModel):
    llm: dict
    tools: dict
    requests: dict
    guardrails: dict
    cost: dict
    baseline: dict
    streaming: dict
    rates: dict


def _delta_pct(current: float, baseline: float) -> float:
    if baseline == 0:
        return 0.0
    return round((current - baseline) / baseline * 100, 2)


@router.get("", response_model=MetricsResponse)
async def metrics() -> MetricsResponse:
    """Return all in-memory metrics (public endpoint)."""
    data = get_metrics()
    return MetricsResponse(**data)


@router.get("/compare")
async def metrics_compare() -> dict:
    """Compare current live metrics against the hardcoded baseline."""
    data = get_metrics()
    baseline = data["baseline"]
    streaming = data["streaming"]
    rates = data["rates"]
    cost_per_req = data["cost"].get("per_request", {})

    current_ttft_p50 = streaming["ttft_ms"]["p50"]
    current_ttft_p95 = streaming["ttft_ms"]["p95"]
    current_pipeline_p50 = streaming["pipeline_ms"]["p50"]
    current_pipeline_p95 = streaming["pipeline_ms"]["p95"]
    current_cost_avg = cost_per_req.get("avg_usd", 0.0)
    current_tool_rate = rates["tool_call_rate"]
    current_guardrail_rate = rates["guardrail_block_rate"]

    return {
        "ttft_ms_p50": {
            "current": current_ttft_p50,
            "baseline": baseline["ttft_ms_p50"],
            "delta_pct": _delta_pct(current_ttft_p50, baseline["ttft_ms_p50"]),
        },
        "ttft_ms_p95": {
            "current": current_ttft_p95,
            "baseline": baseline["ttft_ms_p95"],
            "delta_pct": _delta_pct(current_ttft_p95, baseline["ttft_ms_p95"]),
        },
        "pipeline_ms_p50": {
            "current": current_pipeline_p50,
            "baseline": baseline["pipeline_ms_p50"],
            "delta_pct": _delta_pct(current_pipeline_p50, baseline["pipeline_ms_p50"]),
        },
        "pipeline_ms_p95": {
            "current": current_pipeline_p95,
            "baseline": baseline["pipeline_ms_p95"],
            "delta_pct": _delta_pct(current_pipeline_p95, baseline["pipeline_ms_p95"]),
        },
        "cost_per_request_avg_usd": {
            "current": current_cost_avg,
            "baseline": baseline["cost_per_request_avg_usd"],
            "delta_pct": _delta_pct(current_cost_avg, baseline["cost_per_request_avg_usd"]),
        },
        "tool_call_rate": {
            "current": current_tool_rate,
            "baseline": baseline["tool_call_rate"],
            "delta_pct": _delta_pct(current_tool_rate, baseline["tool_call_rate"]),
        },
        "guardrail_block_rate": {
            "current": current_guardrail_rate,
            "baseline": baseline["guardrail_block_rate"],
            "delta_pct": _delta_pct(current_guardrail_rate, baseline["guardrail_block_rate"]),
        },
    }
