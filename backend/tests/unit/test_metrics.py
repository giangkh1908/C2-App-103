from src.core.metrics import (
    get_metrics,
    increment_counter,
    record_guardrail_block,
    record_llm_failure,
    record_llm_request,
    record_request_duration,
    record_tool_call,
    reset_metrics,
)


class TestInMemoryMetrics:
    def setup_method(self):
        reset_metrics()

    def test_counter_increments(self):
        increment_counter("custom_counter")
        increment_counter("custom_counter", 2)
        metrics = get_metrics()
        assert metrics["llm"]["requests_total"] == 0

    def test_record_llm_request_tracks_success_and_total(self):
        record_llm_request(model="deepseek/deepseek-v4-flash", tokens=150, latency_ms=120.0)
        record_llm_request(model="deepseek/deepseek-v4-flash", tokens=250, latency_ms=80.0)

        metrics = get_metrics()
        assert metrics["llm"]["requests_total"] == 2
        assert metrics["llm"]["requests_success"] == 2
        assert metrics["llm"]["requests_failure"] == 0
        assert metrics["llm"]["tokens_total"] == 400
        assert metrics["llm"]["latency_ms"]["count"] == 2
        assert metrics["llm"]["latency_ms"]["avg"] == 100.0
        assert metrics["cost"]["total_usd"] > 0

    def test_record_llm_failure_tracks_failures(self):
        record_llm_failure(error_type="TimeoutError")
        record_llm_failure(error_type="TimeoutError")
        record_llm_failure(error_type="HTTPStatusError")

        metrics = get_metrics()
        assert metrics["llm"]["requests_total"] == 3
        assert metrics["llm"]["requests_success"] == 0
        assert metrics["llm"]["requests_failure"] == 3
        assert metrics["llm"]["failures_by_type"]["TimeoutError"] == 2
        assert metrics["llm"]["failures_by_type"]["HTTPStatusError"] == 1

    def test_record_tool_call_tracks_success_and_failure(self):
        record_tool_call(success=True)
        record_tool_call(success=True)
        record_tool_call(success=False)

        metrics = get_metrics()
        assert metrics["tools"]["calls_total"] == 3
        assert metrics["tools"]["success"] == 2
        assert metrics["tools"]["failure"] == 1

    def test_record_request_duration_tracks_latencies(self):
        record_request_duration(10.0)
        record_request_duration(20.0)
        record_request_duration(30.0)

        metrics = get_metrics()
        assert metrics["requests"]["duration_ms"]["count"] == 3
        assert metrics["requests"]["duration_ms"]["avg"] == 20.0
        assert metrics["requests"]["duration_ms"]["p50"] == 20.0

    def test_record_guardrail_block(self):
        record_guardrail_block()
        record_guardrail_block()

        metrics = get_metrics()
        assert metrics["guardrails"]["blocks_total"] == 2

    def test_reset_metrics_clears_state(self):
        record_llm_request(model="test", tokens=100, latency_ms=50.0)
        record_tool_call(success=True)
        reset_metrics()

        metrics = get_metrics()
        assert metrics["llm"]["requests_total"] == 0
        assert metrics["llm"]["tokens_total"] == 0
        assert metrics["tools"]["calls_total"] == 0

    def test_unknown_model_cost_defaults_to_zero(self):
        record_llm_request(model="unknown-model", tokens=1000, latency_ms=10.0)
        metrics = get_metrics()
        assert metrics["cost"]["total_usd"] == 0.0
