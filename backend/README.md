# C2-App-103 — Backend

Backend API cho dự án AI Agent, xây dựng bằng **FastAPI** và **LangGraph**.

## Cấu trúc thư mục

```
backend/
├── src/
│   ├── agent/           # LangGraph Agent logic (graph, state, nodes, tools)
│   ├── api/             # FastAPI endpoints (routes, middleware, dependency injection)
│   ├── core/            # Cấu hình & tiện ích dùng chung (config, logging)
│   └── models/          # Pydantic models (request/response schemas)
├── tests/
│   ├── unit/            # Unit tests
│   ├── integration/     # Integration tests
│   └── eval/            # Agent evaluation tests
├── docs/                # Tài liệu kiến trúc, API, ADR
├── eval/                # Evaluation datasets & scripts
├── .env.example         # Mẫu biến môi trường
├── pyproject.toml       # Project metadata & dependencies
├── Makefile             # Lệnh shortcut
├── Dockerfile           # Container definition
└── docker-compose.yml   # Multi-container orchestration
```

## Yêu cầu hệ thống

- Python 3.11+
- pip (phiên bản mới nhất)
- Git 2.30+
- (Tùy chọn) Docker Desktop

## Cài đặt

```bash
# 1. Clone repository
git clone https://github.com/AI20K-Build-Cohort-2/C2-App-103.git
cd C2-App-103/backend

# 2. Tạo virtual environment
python3.11 -m venv .venv

# Kích hoạt venv (macOS/Linux)
source .venv/bin/activate

# Kích hoạt venv (Windows)
.venv\Scripts\activate

# 3. Cài dependencies
pip install -e ".[dev]"

# 4. Cấu hình biến môi trường
cp .env.example .env
# Mở file .env và điền giá trị thực (đặc biệt là OPENAI_API_KEY)
```

## Chạy server

```bash
# Chạy với uvicorn (development, auto-reload)
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

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
# Chạy tất cả tests
pytest tests/ -v

# Chạy chỉ unit tests
pytest tests/unit/ -v

# Chạy với coverage
pytest tests/ -v --cov=src
```

## Docker

```bash
# Build và chạy với docker-compose
docker-compose up --build

# Chạy trong background
docker-compose up -d
```

## Phát triển

### Branching strategy

- `main` — Branch chính, luôn ổn định, không push trực tiếp.
- `develop` — Branch tích hợp, merge feature branches vào đây.
- `feature/TÊN-FEATURE` — Branch cho từng tính năng.

### Commit message format

```
type(scope): mô tả ngắn gọn

type: feat | fix | docs | test | refactor | chore
scope: agent | api | config | models | tests
```

Ví dụ:
```
feat(agent): thêm tool tìm kiếm web
fix(api): sửa lỗi timeout ở endpoint /chat
```
