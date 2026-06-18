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

Backend learning core hien tai chi dung OpenRouter cho lane AI chinh. Google OAuth van dung `google-auth`, nhung backend khong cai hoac goi Google GenAI SDK.

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
| `LLM_PROVIDER` | LLM provider | `openrouter` |
| `OPENROUTER_API_KEY` | OpenRouter API key | *(bắt buộc)* |
| `OPENROUTER_MODEL` | Model sử dụng | `openai/gpt-4o-mini` |
| `OPENROUTER_TEMPERATURE` | Độ sáng tạo (0.0 - 2.0) | `0.7` |
| `OPENROUTER_MAX_TOKENS` | Số token tối đa | `2048` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017` |
| `MONGODB_DB_NAME` | Tên database MongoDB | `toan_truc_quan` |

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

## Practice integration test

`/practice` integration test da chuyen sang Mongo that de khoa contract truoc khi harden UI.

Bien moi truong test mac dinh:

```env
PRACTICE_TEST_MONGODB_URI=mongodb://127.0.0.1:27018
PRACTICE_TEST_MONGODB_DB_NAME=toan_truc_quan_practice_test
```

Chay nhanh bang script:

```bash
python scripts/run_practice_integration.py
```

Script se:

- `docker compose up -d mongo-practice-test`
- doi Mongo san sang
- chay `pytest tests/integration/test_practice_api.py -q`
- `docker compose down` khi xong, trừ khi dung `--keep-up`

Neu muon tu chay thu cong:

```bash
docker compose up -d mongo-practice-test
pytest tests/integration/test_practice_api.py -q
docker compose down
```

## Practice dataset pipeline

`/practice` runtime doc du lieu tu MongoDB collection `practice_exam_sets`. De setup:

### Import practice data vao MongoDB

```bash
# Import voi manifest co san
python scripts/import_practice_dataset.py --replace

# Neu manifest chua co, script se auto-generate
python scripts/import_practice_dataset.py --replace --manifest-path data/practice/vi_grade_school_math_mcq_curated_manifest.json
```

Script se:
- Parse dataset tu `data/practice/vi_grade_school_math_mcq_full.json`
- Curate 10 exams/grade theo manifest
- Upsert vao collection `practice_exam_sets` trong MongoDB
- Tao indexes can thiet (exam_id, grade, is_active)

Sau khi import, restart backend de runtime nap catalog trong bo nho.

Rule clean quan trong:

- chi nhan cau `MCQ` co `choices` hop le
- phai suy ra duoc dap an dung tu `explanation`
- loai cau phu thuoc hinh nhu `hinh ben`, `quan sat hinh`, `phan to mau`, `so do`
- khong expose `source_url` ra contract frontend

Lenh huu ich:

```bash
python scripts/validate_practice_pipeline.py
python scripts/generate_practice_manifest.py --output-path data/practice/vi_grade_school_math_mcq_curated_manifest.draft.json
```

Neu sua tay du lieu:

- sua `backend/data/practice/vi_grade_school_math_mcq_full.json`
- chay lai import: `python scripts/import_practice_dataset.py --replace`
- restart backend de runtime nap lai catalog trong bo nho

## Practice acceptance on a dedicated dev DB

Neu muon ra soat `/practice` tren UI that ma khong dung DB dev chung:

1. Bootstrap DB acceptance rieng:

```bash
python scripts/bootstrap_practice_acceptance.py
```

Mac dinh script se:

- reset sach `practice_attempts` trong DB acceptance
- copy `users` tu DB source sang DB acceptance de login/test
- khong dung den collection trong DB dev chung

Neu muon giu lai history de debug compatibility, can opt-in ro rang:

```bash
python scripts/bootstrap_practice_acceptance.py --copy-attempts
```

Co the scope theo user test:

```bash
python scripts/bootstrap_practice_acceptance.py --user-email student@example.com
```

2. Chay backend voi DB acceptance:

```bash
python scripts/run_practice_acceptance_backend.py --reload --port 8000
```

3. Smoke check API `/practice` bang user that:

```bash
python scripts/smoke_practice_acceptance_api.py --email student@example.com --password your-password
```

Smoke script se:

- dang nhap bang user test trong DB acceptance
- xac nhan lich su `practice_attempts` ban dau dang rong
- check du 5 khoi lop va moi lop co dung 10 de active
- mo exam detail mau va dam bao khong lo `source_url`
- fail neu curated set con sot noi dung phu thuoc hinh

- login that qua `/auth/login`
- check `/practice/grades` co du 5 lop
- check moi lop co dung 10 de
- check exam detail khong con `source_url`
- check curated set khong lo cau phu thuoc hinh
