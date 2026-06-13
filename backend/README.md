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
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
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

```bash
pytest tests/integration/test_chat_flow.py tests/integration/test_learning_contracts.py -q
```
