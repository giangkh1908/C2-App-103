# Toan Truc Quan AI — Gia sư Toán trực quan bằng AI

Ứng dụng AI gia sư toán trực quan dành cho học sinh tiểu học Việt Nam (lớp 1–5). AI **không** làm bài tập giúp học sinh — AI giúp các em **hiểu bản chất** khái niệm toán học thông qua **Visual Card** (thẻ trực quan) và **Mini Simulation** (mô phỏng tương tác).

[**Xem Demo**](https://youtu.be/K1zjK2pRCkA)

![Kiến trúc hệ thống](./docs/Architecture%20diagram.jpg)

---

## Tính năng

### Hành trình học tập

Đăng ký → Chọn khối lớp → Chọn chủ đề → Hỏi AI → Nhận Visual Card → Tương tác Mini Simulation → Làm bài luyện tập → Nhận phản hồi → Theo dõi tiến độ

### 4 Lĩnh vực học tập

| Lĩnh vực | Topic Key | Loại trực quan |
|---|---|---|
| Phép nhân | `equal_groups` | Nhóm chấm tròn, mảng (array) |
| Phép chia | `sharing` | Chia đều (fair-share) |
| Phân số | `fraction_pizza` | Chia bánh pizza |
| Chu vi & Diện tích | `perimeter_path`, `area_grid` | Vẽ đường viền, đếm ô lưới |

### Tính năng ngoài MVP

- Tích hợp thanh toán **SePay**
- Trang quản trị (Admin Dashboard)
- Đăng nhập Google OAuth + xác minh email
- Landing page
- Chat streaming + lịch sử chat
- Bộ đếm lượt sử dụng

Xem chi tiết tại [Đặc tả tính năng](./spec/features.md) và [Lĩnh vực học tập](./spec/domains.md).

---

## Tech Stack

| Tầng | Công nghệ |
|---|---|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS v4, next-intl (i18n), Zod, Motion (Framer Motion), Recharts, Lucide React |
| **Backend** | Python 3.11+, FastAPI, Motor (async MongoDB), Pydantic v2, JWT (python-jose), edge-tts, httpx, structlog, APScheduler |
| **Database** | MongoDB (Atlas) |
| **AI / LLM** | OpenRouter (deepseek-v4-flash), adapter pattern không phụ thuộc provider, JSON output có schema, guardrail 3 lớp |
| **Deployment** | Docker Compose, Railway |
| **Observability** | Langfuse (tuỳ chọn), structlog |
| **Testing** | Pytest (backend), Vitest (frontend), Ruff (linter) |

---

## Kiến trúc

Kiến trúc web app tách biệt — **Next.js frontend ↔ FastAPI backend ↔ MongoDB + AI provider**. Backend là tầng điều phối duy nhất giữa frontend, cơ sở dữ liệu và LLM.

**Guardrail AI 3 lớp:**

1. **Chống prompt injection** — chặn hơn 40 mẫu tấn công (EN + VI)
2. **Giới hạn lĩnh vực** — chỉ trả lời câu hỏi toán học; từ chối chủ đề ngoài toán
3. **Kiểm tra schema** — đảm bảo output đúng cấu trúc Pydantic

**Đọc thêm:**

- [Tổng quan kiến trúc Backend](./backend/docs/architecture/overview.md)
- [Tổng quan kiến trúc Frontend](./frontend/docs/architecture/overview.md)
- [Architecture Decision Records](./adrs/README.md)
- [Tầm nhìn sản phẩm](./spec/product_vision.md)

---

## Cài đặt nhanh

### Yêu cầu hệ thống

- Python 3.11+
- Node.js 18+
- MongoDB (Atlas URI hoặc instance local)

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Linux / macOS
pip install -e .
cp .env.example .env
# Sửa .env với API keys (OPENROUTER_API_KEY, MONGODB_URI, MONGODB_DB_NAME)
python src/main.py
# Chạy tại http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
# Chạy tại http://localhost:3000
```

Xem hướng dẫn chi tiết tại [README Backend](./backend/README.md) và [README Frontend](./frontend/README.md).

---

## Docker

```bash
cp .env.docker.example .env.docker
# Sửa .env.docker với thông tin thật
docker compose up --build
```

- **Backend:** http://localhost:8000
- **Frontend:** http://localhost:3000

Xem [.env.docker.example](./.env.docker.example) để biết tất cả biến cấu hình.

> **Mẹo:** Sau lần build đầu, chạy `docker compose up` (bỏ `--build`) để khởi động nhanh hơn. Chỉ build lại khi sửa code, `Dockerfile`, `package.json`, `pyproject.toml`, hoặc biến `NEXT_PUBLIC_*`.

---

## API

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/health` | Kiểm tra trạng thái |
| `POST` | `/api/auth/register` | Đăng ký tài khoản |
| `POST` | `/api/auth/login` | Đăng nhập |
| `GET` | `/api/auth/me` | Thông tin người dùng hiện tại |
| `POST` | `/api/chat/turn` | Chat với AI gia sư |
| `POST` | `/api/lessons/generate` | Tạo bài học |
| `GET` | `/api/topics` | Danh sách chủ đề |

Swagger UI: **http://localhost:8000/docs**

Xem [API Reference](./backend/docs/api/auth.md) và [API Contracts](./spec/api_contracts.md) để có tài liệu đầy đủ.

---

## Đánh giá & Hiệu năng

| Chỉ số | Giá trị |
|---|---|
| **Model** | deepseek-v4-flash qua OpenRouter |
| **Độ chính xác** | 85% trên 20 câu hỏi kiểm tra |
| **Chi phí** | ~$0.15 / người dùng / tháng |

- [Báo cáo đánh giá](./EVALUATION.md)
- [Đánh giá chứng cứ](./docs/eval_evidence_assessment.md)
- [Phân tích chi phí](./docs/cost_report.md)

---

## Kiểm thử

```bash
cd backend
pytest
# Với coverage:
pytest --cov=src --cov-report=term-missing
```

28+ file test gồm unit, integration, agent và tool tests.

Chạy eval pipeline:

```bash
python eval/scripts/run_eval.py
```

---

## Trạng thái dự án

| Sprint | Trạng thái |
|---|---|
| Sprint 1 — Nền tảng | ✅ Hoàn thành |
| Sprint 2 — Luồng học chính | ✅ Hoàn thành |
| Sprint 3 — Hoàn thiện & Deploy | ✅ Hoàn thành |

- [Kế hoạch Sprint](./planning/sprint_plan.md)
- [Kế hoạch Release](./planning/release_plan.md)
- [Product Backlog](./planning/product_backlog.md)

---

## Chỉ mục tài liệu

| Tài liệu | Mô tả |
|---|---|
| [Tầm nhìn sản phẩm](./spec/product_vision.md) | Vấn đề, insight, người dùng mục tiêu, phạm vi MVP |
| [Đặc tả tính năng](./spec/features.md) | Toàn bộ hành trình người dùng và danh sách tính năng |
| [Lĩnh vực học tập](./spec/domains.md) | 4 lĩnh vực toán với loại trực quan và guardrail độ khó |
| [Vai trò người dùng](./spec/user_roles.md) | Persona và data model |
| [API Contracts](./spec/api_contracts.md) | Enum dùng chung, request/response, quy tắc validation |
| [Architecture Decision Records](./adrs/README.md) | 7 ADR: kiến trúc, stack, AI, dữ liệu, deployment |
| [ADR #1 — Kiến trúc](./adrs/0001-architecture-style.md) | Lựa chọn kiến trúc hệ thống |
| [ADR #2 — Frontend Stack](./adrs/0002-frontend-stack-and-ui-rendering.md) | Lựa chọn frontend stack và UI rendering |
| [ADR #3 — Backend API](./adrs/0003-backend-api-boundary.md) | Ranh giới API backend |
| [ADR #4 — AI Output](./adrs/0004-ai-structured-output-and-guardrails.md) | Structured output và guardrail cho AI |
| [ADR #5 — Data Store](./adrs/0005-data-store-and-progress-model.md) | Cơ sở dữ liệu và mô hình tiến độ |
| [ADR #6 — Folder Structure](./adrs/0006-monorepo-folder-structure.md) | Cấu trúc thư mục monorepo |
| [ADR #7 — Deployment](./adrs/0007-deployment-portability.md) | Khả năng di chuyển khi deploy |
| [Kiến trúc Backend](./backend/docs/architecture/overview.md) | Sơ đồ hệ thống, luồng auth, chiến lược token |
| [Kiến trúc Frontend](./frontend/docs/architecture/overview.md) | Tech stack, cấu trúc thư mục, bảo vệ route |
| [ADR Index — Backend](./backend/docs/adr/index.md) | Chỉ mục ADR phía backend |
| [ADR Index — Frontend](./frontend/docs/adr/index.md) | Chỉ mục ADR phía frontend |
| [API Reference](./backend/docs/api/auth.md) | Docs endpoint đầy đủ với ví dụ request/response |
| [Component Index — Frontend](./frontend/docs/components/index.md) | Chỉ mục component frontend |
| [Chat AI Branch Notes](./frontend/docs/chat-ai-branch-notes.md) | Ghi chú nhánh phát triển chat AI |
| [Báo cáo đánh giá](./EVALUATION.md) | Chỉ số hiệu năng, độ chính xác, phân tích chi phí |
| [Đánh giá chứng cứ](./docs/eval_evidence_assessment.md) | Mức phủ test và đánh giá dựa trên chứng cứ |
| [Phân tích chi phí](./docs/cost_report.md) | Chi phí LLM, pricing tiers, phân tích biên lợi nhuận |
| [Brainstorm](./docs/brainstorm.md) | Ghi chép brainstorm ý tưởng sản phẩm |
| [Kiểm tra Visual Grade 2](./docs/grade2_visual_audit.md) | Kiểm tra trực quan cho lớp 2 |
| [Checklist Merge Conflict](./docs/main_merge_conflict_checklist.md) | Checklist xử lý merge conflict nhánh main |
| [Checklist Railway TTS](./docs/railway_tts_checklist.md) | Checklist triển khai TTS trên Railway |
| [Kế hoạch đánh giá Speech](./docs/speech_eval_plan.md) | Kế hoạch đánh giá tính năng TTS |
| [Báo cáo đánh giá Speech](./docs/speech_eval_report.md) | Kết quả đánh giá tính năng TTS |
| [Kế hoạch dự án](./planning/README.md) | Tổng quan kế hoạch sprint và release |
| [User Stories](./planning/user_stories.md) | User stories cho toàn bộ sản phẩm |
| [Ưu tiên & Ước lượng](./planning/priorities_and_estimates.md) | Ma trận ưu tiên và ước lượng effort |
| [README Backend](./backend/README.md) | Cài đặt, env vars, API endpoints, practice pipeline |
| [README Frontend](./frontend/README.md) | Kiến trúc component, scripts, cấu trúc thư mục |
| [Worklog](./WORKLOG.md) | Theo dõi theo tính năng, 220+ features |
| [Journal](./JOURNAL.md) | Journal hàng tuần — hành trình sản phẩm và bài học |

---

## Nhóm

- **Giang**
- **Bao**
- **Mien**

Xem [Worklog](./WORKLOG.md) để biết chi tiết đóng góp.

---

## Giấy phép

Dự án được cấp phép theo [MIT License](./LICENSE).

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
