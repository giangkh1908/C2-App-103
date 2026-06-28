# MVP Demo

Video demo MVP: https://youtu.be/v_MkTLE1-Lw

## Chạy Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -e ".[dev]"
copy .env.example .env
```

Sửa `backend/.env`, điền các biến bắt buộc: `OPENROUTER_API_KEY`, `MONGODB_URI`, `MONGODB_DB_NAME`.

```bash
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

Swagger UI: http://localhost:8000/docs

## Chạy Frontend

```bash
cd frontend
npm install
npm run dev
```

Mở http://localhost:3000. Frontend mặc định gọi backend tại `http://localhost:8000/api/v1`.

## Chạy Bằng Docker

Docker setup này dùng để đóng gói và chạy cả project trên mọi máy có Docker.
MongoDB mặc định dùng Atlas qua `MONGODB_URI`, không chạy Mongo container local.

```bash
copy .env.docker.example .env.docker
```

Sửa `.env.docker` và điền các biến thật, tối thiểu:

- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `JWT_SECRET_KEY` dài ít nhất 32 ký tự
- `OPENROUTER_API_KEY`

Tạo nhanh `JWT_SECRET_KEY` bằng PowerShell:

```powershell
$bytes = New-Object byte[] 48
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
[Convert]::ToBase64String($bytes)
```

Copy kết quả vào `.env.docker`:

```env
JWT_SECRET_KEY=<chuoi-vua-generate>
```

Sau đó chạy từ root repo:

```bash
docker compose --env-file .env.docker up --build -d
```


### Chạy Docker nhanh sau lần build đầu

Không cần dùng `--build` mỗi lần mở app. `--build` sẽ chạy lại build pipeline, frontend phải `next build` nên có thể rất lâu.

Những lần sau, nếu chỉ muốn chạy lại container với image đã build:

```bash
docker compose --env-file .env.docker up -d
```

Nếu container đang chạy và chỉ muốn restart:

```bash
docker compose --env-file .env.docker restart
```

Chỉ build lại khi sửa code, `Dockerfile`, `package.json` / `package-lock.json`, `pyproject.toml`, hoặc các biến `NEXT_PUBLIC_*` trong `.env.docker`.

Build lại từng service khi cần:

```bash
docker compose --env-file .env.docker build backend
docker compose --env-file .env.docker up -d --no-deps backend

docker compose --env-file .env.docker build frontend
docker compose --env-file .env.docker up -d --no-deps frontend
```

Nếu chỉ đổi biến runtime backend như `OPENROUTER_API_KEY`, `MONGODB_URI`, `JWT_SECRET_KEY`, thường không cần build lại; chạy lại:

```bash
docker compose --env-file .env.docker up -d
```

Kiểm tra:

- Frontend: http://localhost:3000
- Backend health: http://localhost:8000/health
- Swagger UI: http://localhost:8000/docs

Không commit `.env.docker`; file này chứa secret thật. Chỉ commit `.env.docker.example`.

## Guardrails

Agent sử dụng module `backend/src/agents/guardrails.py` để đảm bảo an toàn và đúng chủ đề. Các lớp bảo vệ:

| Guardrail | Mô tả | Response |
|---|---|---|
| **Prompt Injection** | Chặn hơn 40 mẫu tấn công (EN + VI): "ignore instructions", "show system prompt", "jailbreak", … | Trả lời từ chối lịch sự |
| **Greeting** | Phát hiện lời chào ngắn (≤4 từ) | Chào lại và gợi ý học toán |
| **Gibberish** | Phát hiện input vô nghĩa (keyboard mash, ký tự lặp, dấu câu liên tiếp) | Yêu cầu nhập câu hỏi cụ thể |
| **Topic Constraint** | Chặn yêu cầu ngoài toán học (viết văn, nấu ăn, dịch thuật, code, …) | Từ chối và gợi ý hỏi về toán |

`guard_message()` được gọi đầu pipeline trong `LearningCoreService` trước khi chạy LLM, đảm bảo không tốn token cho input độc hại.

---

# Starter Code Template — Cohort 2

Empty starter template for AI20K Build Cohort 2 team repositories. Includes pre-configured AI usage logging hooks for Claude Code, Cursor, Codex, Gemini CLI, Antigravity, and GitHub Copilot.

## Structure

```
├── scripts/
│   ├── _pyrun.sh             # Cross-platform Python launcher (bash)
│   ├── _pyrun.cmd            # Cross-platform Python launcher (Windows)
│   ├── setup_hooks.sh        # One-time pre-push hook installer (POSIX)
│   ├── setup_hooks.ps1       # One-time pre-push hook installer (Windows)
│   ├── log_hook.py           # AI tool hook handler (Claude / Cursor / Codex / Gemini / Copilot)
│   ├── log_antigravity.py    # Auto-log hook for Antigravity
│   ├── log_manual.py         # Manual log for ChatGPT / web tools
│   └── submit_log.py         # Submits logs on git push
├── .agents/                  # Antigravity rules + workflows
├── .claude/  .codex/  .cursor/  .gemini/  .github/hooks/   # Per-tool hook configs
├── .env.example
├── JOURNAL.md                # Weekly journal — product journey & learnings
└── WORKLOG.md                # Technical decisions, task assignments, brainstorming
```

## Getting Started

### 1. Clone and install pre-push hook

**Linux / macOS / Git Bash:**
```bash
git clone <repo-url>
cd <repo>
bash scripts/setup_hooks.sh
```

**Windows PowerShell:**
```powershell
git clone <repo-url>
cd <repo>
powershell -ExecutionPolicy Bypass -File scripts\setup_hooks.ps1
```

### 2. Configure environment

```bash
cp .env.example .env       # macOS / Linux / Git Bash
# copy .env.example .env   # Windows cmd
```

Fill in `AI_LOG_SERVER` and `AI_LOG_API_KEY` (provided by the course).

### 3. Build your project

This is an empty starter — pick any language/framework. The hooks are language-agnostic; they only need Python on the host (any of `python3`, `python`, or `py` works).

## Weekly Journal

Update **[JOURNAL.md](./JOURNAL.md)** at the end of every week:

- Features shipped
- AI tools used and how they helped
- Hardest problem of the week and how you solved it
- What you'd do differently
- Plan for next week

> JOURNAL.md **must be updated** before each PR — it is your learning record for the course.

## Worklog

Update **[WORKLOG.md](./WORKLOG.md)** whenever your team makes a technical decision or changes direction:

- **Technical decisions** — why this approach over alternatives?
- **Task assignments** — who does what, by when
- **Brainstorming** — options considered, pros / cons, conclusion
- **Important bugs** — root cause and fix

## AI Logging

Prompts and tool calls are **automatically logged** when you use any supported AI tool (Claude Code, Cursor, Codex, Gemini, Antigravity, Copilot). No manual steps needed after running `setup_hooks`.

For ChatGPT or other web tools, log manually:

```bash
# POSIX
bash scripts/_pyrun.sh scripts/log_manual.py --tool chatgpt --prompt "<what you did>"

# Windows
scripts\_pyrun.cmd scripts\log_manual.py --tool chatgpt --prompt "<what you did>"
```

### Python requirements

The hook system needs **one** of: `python3`, `python`, or `py` on PATH.

| OS | Recommended install |
|---|---|
| Windows | Python 3 from [python.org](https://www.python.org/downloads/) — installer adds both `python` and `py` to PATH |
| Ubuntu / Debian | `sudo apt install python3` (already preinstalled on most distros) |
| macOS | `brew install python3` or use system Python 3 |

The `scripts/_pyrun.*` wrappers detect whichever is available — students do not need to alias `python3` → `python`.
