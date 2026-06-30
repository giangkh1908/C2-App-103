# Prompts — Version Management

Thư mục chứa các prompt version dạng JSON cho AI tutor agent.

## Cấu trúc

```
prompts/
└── <prompt_id>/
    └── <version>.json
```

Ví dụ:

```
prompts/
└── tutor_system/
    ├── v1.json
    └── v2.json   ← bản sao của v1, sửa segment cần thay đổi
```

## Format file JSON

```json
{
  "prompt_id": "tutor_system",
  "version": "v2",
  "description": "Mô tả ngắn về bản prompt này",
  "created_at": "2026-07-01T00:00:00Z",
  "segments": {
    "base": "Vai trò gia sư, nguyên tắc xử lý, phạm vi hỗ trợ...",
    "tool_use": "Hướng dẫn dùng công cụ trực quan...",
    "clarification": "Cách hỏi lại khi câu hỏi mơ hồ...",
    "levels": {
      "L1": "Hướng dẫn cho level L1...",
      "L2": "Hướng dẫn cho level L2...",
      "L3": "Hướng dẫn cho level L3...",
      "L4": "Hướng dẫn cho level L4...",
      "L5": "Hướng dẫn cho level L5..."
    }
  }
}
```

## Cách tạo version mới

1. Copy version cũ làm bản mới:

```bash
cp prompts/tutor_system/v1.json prompts/tutor_system/v2.json
```

2. Sửa nội dung trong `v2.json` — version, description, created_at, và segment cần thay đổi.

3. Chạy eval để so sánh kết quả:

```bash
python eval/scripts/run_eval.py --dataset eval/datasets/multiplication.json --verbose
```

## Cách đổi version đang dùng

Sửa default trong `backend/src/core/config.py`:

```python
prompt_version: str = Field(default="v2", alias="PROMPT_VERSION")
```

Hoặc set biến môi trường:

```bash
PROMPT_VERSION=v2
```

## CLI tool

Xem danh sách prompt versions:

```bash
python scripts/prompt_cli.py list
```

Xem nội dung một version:

```bash
python scripts/prompt_cli.py show tutor_system
python scripts/prompt_cli.py show tutor_system --version v2
```

So sánh hai versions:

```bash
python scripts/prompt_cli.py diff tutor_system v1 v2
```

## Nguyên tắc

- Không sửa file JSON đã có — tạo version mới (v2, v3, ...).
- Ghi rõ `description` để biết version này khác gì so với cũ.
- Kết quả eval có ghi `prompt_version` để biết số liệu ứng với prompt nào.
