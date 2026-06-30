# Eval Scripts

Đánh giá chất lượng AI tutor agent — chạy offline không cần backend.

## Quick start

```bash
cd backend

# Chạy eval trên dataset multiplication (mặc định offline)
python eval/scripts/run_eval.py --dataset eval/datasets/multiplication.json --verbose

# Lưu kết quả ra file
python eval/scripts/run_eval.py --dataset eval/datasets/multiplication.json --output results.json
```

## Modes

### Offline (mặc định)

Gọi thẳng LLM qua `TutorAgent.chat_stream()`, không cần backend, MongoDB, hay API.

```bash
python eval/scripts/run_eval.py --dataset eval/datasets/multiplication.json --verbose
```

### Online

Gọi HTTP tới backend API đang chạy:

```bash
# Terminal 1: start backend
uvicorn src.main:app --reload

# Terminal 2: run eval
python eval/scripts/run_eval.py --mode online --dataset eval/datasets/multiplication.json --verbose
```

## Arguments

| Argument | Default | Mô tả |
|----------|---------|-------|
| `--dataset` | (required) | Path đến dataset JSON |
| `--mode` | `offline` | `offline` hoặc `online` |
| `--base-url` | `http://localhost:8000` | Backend URL (online mode) |
| `--concurrency` | `1` | Số request đồng thời (1–5) |
| `--verbose` | `false` | In kết quả từng problem |
| `--output` | `stdout` | File output JSON |
| `--prompt-version` | từ `.env` | Prompt version để ghi vào kết quả |
| `--prompt-id` | từ `.env` | Prompt ID để ghi vào kết quả |

## Datasets

```
eval/datasets/
├── multiplication.json   (10 câu nhân)
└── fraction_basic.json   (10 câu phân số)
```

Mỗi dataset có format:

```json
{
  "topic": "multiplication",
  "description": "Phép nhân lớp 2-3",
  "problems": [
    {
      "id": "mul_001",
      "grade": 2,
      "question": "Có 3 đĩa, mỗi đĩa 4 cái kẹo. Hỏi có tất cả bao nhiêu cái kẹo?",
      "expected_answer_keywords": ["12"],
      "expected_tool": "candy_multiplication",
      "level": "L2"
    }
  ]
}
```

## Output format

Kết quả là JSON gồm:

```json
{
  "model": "deepseek/deepseek-v4-flash",
  "dataset": "multiplication",
  "timestamp": "2026-07-01T...",
  "total": 10,
  "prompt_id": "tutor_system",
  "prompt_version": "v2",
  "mode": "offline",
  "metrics": {
    "accuracy": 0.8,
    "tool_accuracy": 0.9,
    "ttft_ms": { "avg": 0.45, "p50": 0.42, "p95": 0.67 },
    "latency_ms": { "avg": 3120, "p50": 2890, "p95": 4500 },
    "cost_usd": { "total": 0.00042, "avg_per_request": 0.000042 },
    "total_tokens": 3000
  },
  "details": [
    {
      "problem_id": "mul_001",
      "answer_text": "Có tất cả 12 cái kẹo...",
      "tool_used": "candy_multiplication",
      "keyword_match": true,
      "tool_match": true,
      "latency_ms": 2890,
      "ttft_ms": 0.42
    }
  ]
}
```

## Prompt versioning

Kết quả eval ghi `prompt_version` để biết số liệu ứng với prompt nào. Khi thay đổi prompt, so sánh kết quả giữa các phiên bản:

```bash
# Chạy với v1
python eval/scripts/run_eval.py --dataset eval/datasets/multiplication.json --output v1.json

# Sửa prompt → tạo v2 → chạy lại
python eval/scripts/run_eval.py --dataset eval/datasets/multiplication.json --output v2.json

# So sánh
python -c "
import json
v1 = json.load(open('v1.json'))
v2 = json.load(open('v2.json'))
print(f'v1 accuracy: {v1[\"metrics\"][\"accuracy\"]}')
print(f'v2 accuracy: {v2[\"metrics\"][\"accuracy\"]}')
"
```

## Thêm dataset mới

1. Tạo file JSON theo format trên, đặt trong `eval/datasets/`
2. Mỗi problem cần có `expected_answer_keywords` và `expected_tool`
3. Chạy eval để kiểm tra:
   ```bash
   python eval/scripts/run_eval.py --dataset eval/datasets/division.json --verbose
   ```
