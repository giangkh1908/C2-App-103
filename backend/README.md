# C2-App-103 Backend

Backend API cho prototype Gia su AI Chat + Visual, xay dung bang FastAPI.

## Cai dat

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -e ".[dev]"
copy .env.example .env
```

Mo `backend/.env` va dien cac bien can thiet, dac biet:

```env
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=your_key_here
OPENROUTER_MODEL=openai/gpt-4o-mini
MONGODB_URI=your_mongodb_uri
MONGODB_DB_NAME=toan_truc_quan
FRONTEND_URL=http://localhost:3000
```

## Chay server

```bash
uvicorn src.main:app --reload --reload-dir src --host 0.0.0.0 --port 8000
```

Sau khi chay:

- Swagger UI: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/v1/health`

## Learning API

- `GET /api/v1/health`
- `GET /api/v1/topics`
- `POST /api/v1/chat/turn`
- `POST /api/v1/lessons/generate`

## LLM provider

Backend learning core hien tai chi dung OpenRouter cho lane AI chinh.

- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`
- `OPENROUTER_TEMPERATURE`
- `OPENROUTER_MAX_TOKENS`
- `OPENROUTER_BASE_URL`
- `OPENROUTER_SITE_URL`
- `OPENROUTER_APP_NAME`

## Test
Sau khi chạy, mở trình duyệt tại:
- **Swagger UI (API docs):** http://localhost:8000/docs
- **Health check:** http://localhost:8000/api/v1/health

## Biến môi trường

| Biến | Mô tả | Giá trị mặc định |
|------|--------|-----------------|
| `APP_NAME` | Tên ứng dụng | `ai-agent` |
| `APP_ENV` | Môi trường (`development` / `staging` / `production`) | `development` |
| `DEBUG` | Bật debug mode | `true` |
| `LOG_LEVEL` | Mức log (`DEBUG` / `INFO` / `WARNING` / `ERROR`) | `DEBUG` |
| `API_HOST` | Host lắng nghe | `0.0.0.0` |
| `API_PORT` | Port lắng nghe | `8000` |
| `API_PREFIX` | URL prefix cho API | `/api/v1` |
| `LLM_PROVIDER` | LLM provider (`openai` / `anthropic` / `google`) | `openai` |
| `OPENAI_API_KEY` | OpenAI API key | *(bắt buộc)* |
| `OPENAI_MODEL` | Model sử dụng | `gpt-4o-mini` |
| `OPENAI_TEMPERATURE` | Độ sáng tạo (0.0 - 2.0) | `0.7` |
| `OPENAI_MAX_TOKENS` | Số token tối đa | `2048` |
| `DATABASE_URL` | Connection string database | `sqlite:///./data/app.db` |
| `VECTOR_STORE_TYPE` | Loại vector store | `chroma` |

## Logging

Backend ghi log dạng JSON line ra stdout/stderr để phù hợp container và nền tảng deploy.
`LOG_LEVEL` điều khiển mức log (`DEBUG`, `INFO`, `WARNING`, `ERROR`).

Mỗi request có `X-Request-ID`; backend sẽ giữ giá trị client gửi lên hoặc tự sinh mới,
trả lại header này trong response và gắn vào request log. Không log request body,
`Authorization`, cookies, password hoặc token.

## Lệnh thường dùng (Makefile)

Chạy `make` hoặc `make help` để xem danh sách lệnh.

### Install

| Lệnh | Mô tả |
|------|--------|
| `make install` | Cài dependencies (production) |
| `make dev` | Cài dependencies (development) |

### Run

| Lệnh | Mô tả |
|------|--------|
| `make run` | Chạy FastAPI server (auto-reload, port 8000) |

### Code quality

| Lệnh | Mô tả |
|------|--------|
| `make lint` | Chạy linter (ruff check) |
| `make format` | Format code (ruff format) |
| `make typecheck` | Chạy type checker (mypy) |

### Test

| Lệnh | Mô tả |
|------|--------|
| `make test` | Chạy tất cả tests |
| `make test-unit` | Chạy unit tests |
| `make test-integration` | Chạy integration tests |
| `make test-cov` | Chạy tests với coverage report |

### Check

| Lệnh | Mô tả |
|------|--------|
| `make check` | Chạy tất cả (lint + format + typecheck + test) |

### Docker

| Lệnh | Mô tả |
|------|--------|
| `make docker-build` | Build Docker image |
| `make docker-up` | Chạy với docker-compose |
| `make docker-down` | Dừng docker-compose |

### Utility

| Lệnh | Mô tả |
|------|--------|
| `make clean` | Xóa cache (__pycache__, .pytest_cache, .mypy_cache) |

## Testing

```bash
pytest tests/integration/test_chat_flow.py tests/integration/test_learning_contracts.py -q
```
