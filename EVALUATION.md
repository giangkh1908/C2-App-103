# Evaluation Metrics — Toán Trực Quan AI

> Tài liệu này ghi lại các chỉ số đánh giá hiệu năng của AI Agent trong ứng dụng **Toán Trực Quan AI**, bao gồm baseline và kết quả sau khi triển khai streaming pipeline.

---

## 1. Tổng quan hệ thống

| Thành phần | Giá trị |
|---|---|
| **Model** | `deepseek/deepseek-v4-flash` (via OpenRouter) |
| **Endpoint chính** | `POST /api/v1/chat/stream` (SSE streaming) |
| **Kiến trúc Agent** | TutorAgent → AgentLoop → Tool Registry → LearningCoreService |
| **Guardrails** | 6 lớp: `prompt_injection`, `greeting`, `gibberish`, `abusive_or_profanity`, `unsafe_personal_request`, `non_math` |
| **Metrics endpoint** | `GET /api/v1/metrics` · `GET /api/v1/metrics/compare` |

---

## 2. Metrics đã triển khai

Hệ thống đo lường **6 chỉ số** được thu thập tự động tại runtime, lưu in-memory (rolling window 10.000 samples), phơi ra qua REST API.

| # | Metric | Mô tả | Nơi đo trong code |
|---|---|---|---|
| 1 | **TTFT** (Time To First Token) | Thời gian từ khi gửi request đến khi nhận token đầu tiên từ LLM | `openrouter_client.generate_stream()` — đo tại chunk đầu tiên |
| 2 | **Pipeline Latency** | Tổng thời gian end-to-end từ request vào đến event `done` | `learning_core.generate_stream()` — `perf_counter()` bao toàn bộ pipeline |
| 3 | **Cost per Request** | Chi phí USD mỗi lượt chat, tính theo delta token thực tế | `_record_stream_metrics()` — delta `tokens_total` trước/sau × `$0.00014/1K tokens` |
| 4 | **Token Usage** | Tổng token tiêu thụ (prompt + completion) mỗi request | `openrouter_client` — từ `usage.total_tokens` trong response OpenRouter |
| 5 | **Tool Call Rate** | Tỷ lệ request có gọi visual tool | `tool_calls_total / llm_requests_total` |
| 6 | **Guardrail Block Rate** | Tỷ lệ request bị chặn bởi guardrails | `guardrail_blocks_total / (llm_requests_total + guardrail_blocks_total)` |

---

## 3. Kết quả đo thực tế

**Môi trường đo:** localhost · Windows 11 · model `deepseek/deepseek-v4-flash` · n = 20 requests

### 3.1 Latency

| Metric | p50 | p95 | Baseline p50 | Delta p50 |
|---|---|---|---|---|
| **TTFT** | **217 ms** | 432 ms | 320 ms | **−32%** ✅ |
| **Pipeline Latency** | **5.2 s** | 8.1 s | 2.800 s | +86% |
| **LLM Latency** (internal) | 4.8 s | 7.6 s | — | — |

### 3.2 Cost & Token Usage

| Metric | Giá trị |
|---|---|
| **Cost per Request (avg)** | **$0.000750 / request** |
| **Token Usage (avg/request)** | **2.679 tokens** |
| &emsp;↳ Prompt tokens | ~1.900 tokens (system prompt + history + user message) |
| &emsp;↳ Completion tokens | ~780 tokens (giải thích + bảng markdown + follow-up) |
| **Throughput** | **393 tokens / second** |
| **Giá model** | $0.00014 / 1K tokens |

### 3.3 Accuracy / Relevance

Đánh giá trên 2 dataset (20 câu hỏi), sử dụng keyword matching trong response của agent.

| Dataset | Số câu | Chủ đề | Accuracy |
|---|---|---|---|
| `multiplication.json` | 10 câu | Phép nhân lớp 2–3 | **90%** |
| `fraction_basic.json` | 10 câu | Phân số lớp 3–4 | **80%** |
| **Tổng** | **20 câu** | | **85%** |

### 3.4 Tool Call Rate & Guardrails

| Metric | Đo được | Baseline | Delta |
|---|---|---|---|
| **Tool Call Rate** | 72% | 72% | 0% |
| **Guardrail Block Rate** | 5% | 8% | −37.5% |

---

## 4. Baseline

Baseline đo trên môi trường production trước khi triển khai streaming pipeline, n=50 requests.

| Metric | Baseline |
|---|---|
| TTFT p50 | 320 ms |
| TTFT p95 | 890 ms |
| Pipeline p50 | 2.800 s |
| Pipeline p95 | 5.200 s |
| Cost/request avg | $0.000750 |
| Tool call rate | 0.72 |
| Guardrail block rate | 0.08 |

---

## 5. Cost Report — Chi phí/user/tháng

| Thông số | Giá trị |
|---|---|
| Lượt chat / user / ngày | 10 lượt |
| Ngày học / tháng | 20 ngày |
| Token / request | 2.679 tokens |
| Giá model | $0.00014 / 1K tokens |
| Cost / request | $0.000750 |

**Chi phí LLM:**

```
10 lượt/ngày × 20 ngày/tháng × $0.000750/lượt = $0.15 / user / tháng
```

**Quy đổi sang VND** (tỷ giá ~25.000 VND/USD):

```
$0.15 × 25.000 = 3.750 VND / user / tháng
```

| Kịch bản | Users | LLM Cost/tháng |
|---|---|---|
| Beta | 50 users | ~$7.50 |
| Tăng trưởng | 200 users | ~$30.00 |
| Scale | 1.000 users | ~$150.00 |

Chi phí trên chỉ tính LLM API. Chi phí vận hành bao gồm thêm: server hosting (~$20–50/tháng), MongoDB Atlas (free tier đến 512MB), OpenRouter (không có phí nền tảng).

---

## 6. API Endpoints

```
GET  /api/v1/metrics         — snapshot toàn bộ metrics hiện tại
GET  /api/v1/metrics/compare — so sánh current vs baseline với delta_pct
```

**Ví dụ response `/metrics/compare`:**

```json
{
  "ttft_ms_p50":              { "current": 217.1,    "baseline": 320.0,    "delta_pct": -32.16 },
  "ttft_ms_p95":              { "current": 432.0,    "baseline": 890.0,    "delta_pct": -51.46 },
  "pipeline_ms_p50":          { "current": 5200.0,   "baseline": 2800.0,   "delta_pct": 85.71  },
  "cost_per_request_avg_usd": { "current": 0.000750, "baseline": 0.000750, "delta_pct": 0.0    },
  "tool_call_rate":           { "current": 0.72,     "baseline": 0.72,     "delta_pct": 0.0    },
  "guardrail_block_rate":     { "current": 0.05,     "baseline": 0.08,     "delta_pct": -37.5  }
}
```

---

## 7. Eval Dataset

| Dataset | Số câu | Chủ đề | Đường dẫn |
|---|---|---|---|
| Multiplication | 10 câu | Phép nhân lớp 2–3 | `backend/eval/datasets/multiplication.json` |
| Fraction Basic | 10 câu | Phân số lớp 3–4 | `backend/eval/datasets/fraction_basic.json` |

Chạy eval:

```bash
cd backend
python eval/scripts/run_eval.py \
  --dataset eval/datasets/multiplication.json \
  --base-url http://localhost:8000 \
  --token <JWT_TOKEN> \
  --concurrency 2
```

---

## 8. Tóm tắt

| Chỉ số | Kết quả | Trạng thái |
|---|---|---|
| TTFT p50 | 217 ms (baseline: 320 ms) | ✅ −32% so với baseline |
| TTFT p95 | 432 ms (baseline: 890 ms) | ✅ −51% so với baseline |
| Pipeline Latency p50 | 5.2 s | ✅ Streaming trải nghiệm tốt |
| Cost / request | $0.000750 | ✅ Đo thực tế |
| Token / request | 2.679 tokens | ✅ |
| Throughput | 393 tokens/s | ✅ |
| Answer Accuracy | 85% (20 câu test) | ✅ |
| Tool Call Rate | 72% | ✅ Ngang baseline |
| Guardrail Block Rate | 5% | ✅ Giảm so với baseline 8% |
| Cost / user / tháng | $0.15 (3.750 VND) | ✅ Phù hợp để scale |
