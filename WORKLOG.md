# Worklog — Bảng phân chia công việc và tiến độ từng thành viên


## Chú thích

| Ký hiệu | Ý nghĩa |
|---------|---------|
| ✅ | Đã hoàn thành (có code chạy được, kèm evidence) |
| ⬜ | Chưa làm |
| 🔶 | Làm một phần / cần cải thiện |

**Owner:**
- **Giang** = Auth, Landing, Admin, Payment/Pricing, Deploy/DevOps
- **Bảo** = Learning Core AI (LLM, prompts, schemas), Practice (full /learn), Visual/Simulation, TTS/STT
- **Miền** = AgentLoop, Tool system, Chat memory/history, Chat UI (/learn), Eval/Metrics

---

## 1. Auth (Xác thực & Phân quyền)

| # | Tính năng | Owner | Status | Evidence |
|-- |-----------|-------|--------|----------|
| 1 | Register (đăng ký email + password) | Giang | ✅ | `backend/src/api/auth.py:76` |
| 2 | Login JWT (access + refresh token) | Giang | ✅ | `backend/src/api/auth.py:116` |
| 3 | Google OAuth (đăng nhập bằng Google) | Giang | ✅ | `backend/src/api/auth.py:147` |
| 4 | Refresh token rotation (vô hiệu hoá token cũ) | Giang | ✅ | `backend/src/api/auth.py:216-276` |
| 5 | Forgot password (gửi email reset) | Giang | ✅ | `backend/src/api/auth.py:298` |
| 6 | Reset password (đặt lại mật khẩu) | Giang | ✅ | `backend/src/api/auth.py:323` |
| 7 | Email verification (xác thực email) | Giang | ✅ | `backend/src/api/auth.py:350-399` |
| 8 | Login page (giao diện đăng nhập) | Giang | ✅ | `frontend/src/app/[locale]/(auth)/login/page.tsx` |
| 9 | Register page (giao diện đăng ký) | Giang | ✅ | `frontend/src/app/[locale]/(auth)/register/page.tsx` |
| 10 | Forgot/Reset password pages | Giang | ✅ | `frontend/src/app/[locale]/(auth)/forgot-password/page.tsx`, `reset-password/page.tsx` |
| 11 | Email verification page | Giang | ✅ | `frontend/src/app/[locale]/(auth)/verify-email/page.tsx` |
| 12 | Google Sign-In Button | Giang | ✅ | `frontend/src/components/auth/GoogleSignInButton.tsx` |
| 13 | AuthProvider (React context) | Giang | ✅ | `frontend/src/components/providers/AuthProvider.tsx:36` |
| 14 | RequireAuth (guard component) | Giang | ✅ | `frontend/src/components/auth/RequireAuth.tsx:10` |
| 15 | Auth layout (bố cục trang auth) | Giang | ✅ | `frontend/src/app/[locale]/(auth)/layout.tsx` |
| 16 | Login/Register form components | Giang | ✅ | `frontend/src/components/auth/LoginForm.tsx`, `RegisterForm.tsx` |

---

## 2. Learning Core (Lõi học tập AI)

| # | Tính năng | Owner | Status | Evidence |
|-- |-----------|-------|--------|----------|
| 1 | OpenRouter adapter (kết nối LLM) | Bảo | ✅ | `backend/src/llm/openrouter_client.py` |
| 2 | Base LLM client (abstract class) | Bảo | ✅ | `backend/src/llm/base.py` |
| 3 | TutorAgent chat (không stream) | Bảo | ✅ | `backend/src/agents/tutor_agent.py:29` |
| 4 | TutorAgent chat_stream (streaming) | Bảo | ✅ | `backend/src/agents/tutor_agent.py:65` |
| 5 | AgentLoop (vòng lặp agent) | Miền | ✅ | `backend/src/agents/agent_loop.py` |
| 6 | Lesson schema validation (Pydantic) | Bảo | ✅ | `backend/src/models/lesson.py` |
| 7 | Context detector (phát hiện chủ đề) | Bảo | ✅ | `backend/src/services/context_detector.py:44` |
| 8 | Guardrails (lọc nội dung) | Bảo | ✅ | `backend/src/agents/guardrails.py` |
| 9 | Response mapper (map kết quả) | Bảo | ✅ | `backend/src/services/response_mapper.py` |
| 10 | Session repository (lưu lượt chat) | Miền | ✅ | `backend/src/services/session_repository.py` |
| 11 | Memory repository (lịch sử hội thoại) | Miền | ✅ | `backend/src/services/memory_repository.py` |
| 12 | Tool system (registry + base + math_visual) | Miền | ✅ | `backend/src/tools/registry.py`, `base.py` |
| 13 | "Ví dụ khác" feature | Bảo | ✅ | `backend/src/services/learning_core.py:80-120` |
| 14 | LearningCoreService.generate() | Bảo | ✅ | `backend/src/services/learning_core.py:36` |
| 15 | LearningCoreService.generate_stream() | Bảo | ✅ | `backend/src/services/learning_core.py:295` |
| 16 | Chat orchestrator | Bảo | ✅ | `backend/src/agents/chat_orchestrator.py` |
| 17 | Agent schemas + prompts | Bảo | ✅ | `backend/src/agents/schemas.py`, `prompts.py` |
| 18 | Validation service | Bảo | ✅ | `backend/src/services/validation.py` |
| 19 | Visual builder (sinh dữ liệu visual) | Miền | ✅ | `backend/src/services/visual_builder.py` |
| 20 | Practice builder (sinh câu hỏi) | Miền | ✅ | `backend/src/services/practice_builder.py` |
| 21 | Prompt versioning | Bảo + Giang | ✅ | `backend/src/llm/prompt_registry.py`, `backend/prompts/tutor_system/v1.json` |

---

## 3. Visual & Simulation (Trực quan & Mô phỏng)

| # | Tính năng | Owner | Status | Evidence |
|-- |-----------|-------|--------|----------|
| 1 | Visual Card renderer | Bảo | ✅ | `frontend/src/components/AIExplanationChat.tsx` |
| 2 | InteractiveSimulation component | Bảo | ✅ | `frontend/src/components/InteractiveSimulation.tsx:42` |
| 3 | equal_groups (kẹo/đĩa phép nhân) | Bảo | ✅ | `InteractiveSimulation.tsx:21-23` |
| 4 | sharing (chia táo phép chia) | Bảo | ✅ | `InteractiveSimulation.tsx:25-32` |
| 5 | fraction_pizza (pizza phân số) | Bảo | ✅ | `InteractiveSimulation.tsx:34-36` |
| 6 | perimeter_path + area_grid | Bảo | ✅ | `InteractiveSimulation.tsx:38-40` |
| 7 | AIExplanationChat (component chat) | Bảo | ✅ | `frontend/src/components/AIExplanationChat.tsx` (956 dòng) |
| 8 | TTS trigger (đọc văn bản) | Bảo | ⬜ | Backend đã trả `tts_text`, frontend chưa có trigger |
| 9 | UX Polish (tối ưu mobile) | Miền | 🔶 | Đã responsive cơ bản, cần tối ưu cho học sinh tiểu học |
| 9 | UX Polish (tối ưu mobile) | Miền | 🔶 | Đã responsive cơ bản, cần tối ưu cho học sinh tiểu học |

---

## 4. Practice (Luyện tập)

| # | Tính năng | Owner | Status | Evidence |
|-- |-----------|-------|--------|----------|
| 1 | PracticeService (logic luyện tập) | Bảo | ✅ | `backend/src/services/practice_service.py:28` |
| 2 | PracticeBuilder (xây đề thi) | Bảo | ✅ | `backend/src/services/practice_builder.py` |
| 3 | PracticeDataset (MCQ curated) | Bảo | ✅ | `backend/src/services/practice_dataset.py` |
| 4 | Curated manifest (10 đề/lớp × 5 lớp) | Bảo | ✅ | `backend/data/practice/vi_grade_school_math_mcq_curated_manifest.json` |
| 5 | Attempt lifecycle (create/in_progress) | Bảo | ✅ | `practice_service.py:126-182` |
| 6 | Attempt submit + scoring | Bảo | ✅ | `practice_service.py:217-308` |
| 7 | Save draft (lưu nháp) | Bảo | ✅ | `practice_service.py:184-215` |
| 8 | Practice API endpoints | Bảo | ✅ | `backend/src/api/practice.py` |
| 9 | PracticeBrowserView (danh sách đề) | Bảo | ✅ | `frontend/src/components/practice/PracticeBrowserView.tsx` |
| 10 | PracticeExamView (làm bài thi) | Bảo | ✅ | `frontend/src/components/practice/PracticeExamView.tsx` |
| 11 | PracticeResultView (kết quả) | Bảo | ✅ | `frontend/src/components/practice/PracticeResultView.tsx` |
| 12 | PracticeDialogs (hộp thoại) | Bảo | ✅ | `frontend/src/components/practice/PracticeDialogs.tsx` |
| 13 | PracticeExperience (container) | Bảo | ✅ | `frontend/src/components/practice/PracticeExperience.tsx` |
| 14 | Practice page (/practice route) | Bảo | ✅ | `frontend/src/app/[locale]/(protected)/practice/page.tsx` |
| 15 | Progress tracking (điểm, đúng/sai) | Bảo | ✅ | `practice_service.py:241-270` (result_summary) |

---

## 5. Chat UI (Giao diện trò chuyện)

| # | Tính năng | Owner | Status | Evidence |
|-- |-----------|-------|--------|----------|
| 1 | /learn page (trang học) | Miền | ✅ | `frontend/src/app/[locale]/(protected)/learn/page.tsx` |
| 2 | Streaming chat (backend SSE) | Bảo | ✅ | `backend/src/api/chat_stream.py` |
| 3 | Chat history API (CRUD) | Bảo | ✅ | `backend/src/api/chat_history.py` |
| 4 | ChatHistorySidebar (sidebar) | Miền | ✅ | `frontend/src/components/chat/ChatHistorySidebar.tsx` |
| 5 | useChatStream hook (frontend) | Miền | ✅ | `frontend/src/lib/useChatStream.ts` |
| 6 | chatHistoryApi lib | Miền | ✅ | `frontend/src/lib/chatHistoryApi.ts` |
| 7 | Chat API (turn-based) | Bảo | ✅ | `backend/src/api/chat.py` |

---

## 6. Plans & Subscription (Gói dịch vụ & Đăng ký)

| # | Tính năng | Owner | Status | Evidence |
|-- |-----------|-------|--------|----------|
| 1 | Plan seeding (free/plus/premium) | Giang | ✅ | `backend/src/services/plan_service.py:9-67` |
| 2 | Plan catalog API (công khai) | Giang | ✅ | `backend/src/api/plans.py:8` |
| 3 | Plan model (PlanQuota, PlanFeatures) | Giang | ✅ | `backend/src/models/plan.py:6-20` |
| 4 | SubscriptionService (auto-expire) | Giang | ✅ | `backend/src/services/subscription_service.py:68` |
| 5 | Expiry reminder emails | Giang | ✅ | `subscription_service.py:114` |
| 6 | UsageService (quota tracking) | Giang | ✅ | `backend/src/services/usage_service.py:22` |
| 7 | Quota enforcement (check + record) | Giang | ✅ | `usage_service.py:86-138` |
| 8 | Quota refund on AI failure | Giang | ✅ | `usage_service.py:140-158` |
| 9 | Quota overview (admin + user) | Giang | ✅ | `usage_service.py:200-263` |
| 10 | Plan API (admin listing) | Giang | ✅ | `backend/src/api/plans.py` |

---

## 7. Payment (Thanh toán)

| # | Tính năng | Owner | Status | Evidence |
|-- |-----------|-------|--------|----------|
| 1 | SePay integration (cổng thanh toán) | Giang | ✅ | `backend/src/services/payment_service.py` |
| 2 | Checkout flow (tạo QR) | Giang | ✅ | `backend/src/api/payment.py:308` |
| 3 | Webhook handler (SePay → backend) | Giang | ✅ | `backend/src/api/payment.py:159` |
| 4 | Payment status polling | Giang | ✅ | `backend/src/api/payment.py:347` |
| 5 | Cancel payment endpoint | Giang | ✅ | `backend/src/api/payment.py:376` |
| 6 | Payment model (status lifecycle) | Giang | ✅ | `backend/src/models/payment.py` |
| 7 | PaymentClient + QR render | Giang | ✅ | `frontend/src/app/[locale]/payment/PaymentClient.tsx` |
| 8 | Payment success page | Giang | ✅ | `frontend/src/app/[locale]/payment/success/page.tsx` |
| 9 | Payment failed page | Giang | ✅ | `frontend/src/app/[locale]/payment/failed/page.tsx` |
| 10 | Payment cancel page | Giang | ✅ | `frontend/src/app/[locale]/payment/cancel/page.tsx` |
| 11 | Payment client lib (paymentApi.ts) | Giang | ✅ | `frontend/src/lib/paymentApi.ts:107` |
| 12 | UpgradeModal (nâng cấp gói) | Giang | ✅ | `frontend/src/components/UpgradeModal.tsx` |
| 13 | UsageCounter (quota còn lại) | Giang | ✅ | `frontend/src/components/UsageCounter.tsx` |
| 14 | planApi lib (gọi plans API) | Giang | ✅ | `frontend/src/lib/planApi.ts` |

---

## 8. Admin (Quản trị)

| # | Tính năng | Owner | Status | Evidence |
|-- |-----------|-------|--------|----------|
| 1 | Admin dashboard (thống kê) | Giang | ✅ | `backend/src/api/admin.py:363` |
| 2 | Admin dashboard UI | Giang | ✅ | `frontend/src/app/[locale]/admin/page.tsx` |
| 3 | User list API | Giang | ✅ | `backend/src/api/admin.py:201` |
| 4 | User extend subscription | Giang | ✅ | `backend/src/api/admin.py:316` |
| 5 | User change plan | Giang | ✅ | `backend/src/api/admin.py:261` |
| 6 | User management UI | Giang | ✅ | `frontend/src/app/[locale]/admin/users/page.tsx` |
| 7 | Payment list API | Giang | ✅ | `backend/src/api/admin.py:37` |
| 8 | Payment detail API | Giang | ✅ | `backend/src/api/admin.py:103` |
| 9 | Payment activate manually | Giang | ✅ | `backend/src/api/admin.py:128` |
| 10 | Payment management UI | Giang | ✅ | `frontend/src/app/[locale]/admin/payments/page.tsx` |
| 11 | Payment detail page | Giang | ✅ | `frontend/src/app/[locale]/admin/payments/[id]/page.tsx` |
| 12 | Admin plan listing | Giang | ✅ | `backend/src/api/admin.py:244` |
| 13 | Admin role guard (frontend) | Giang | ✅ | `frontend/src/app/[locale]/admin/layout.tsx` |
| 14 | Admin layout + sidebar | Giang | ✅ | `frontend/src/app/[locale]/admin/layout.tsx` |
| 15 | adminApi lib | Giang | ✅ | `frontend/src/lib/adminApi.ts` |
| 16 | scripts/create_admin.py | Giang | ✅ | `scripts/create_admin.py` |
| 17 | Admin cost API (`/admin/costs`) | Giang | ✅ | `backend/src/api/admin.py` |
| 18 | Admin cost UI card ("Chi phí LLM") | Giang | ✅ | `frontend/src/app/[locale]/admin/page.tsx` |
| 19 | Cost report smoke test | Giang | ✅ | `scripts/smoke_cost_report.py` |

---

## 9. Landing & Marketing (Trang chủ & Tiếp thị)

| # | Tính năng | Owner | Status | Evidence |
|-- |-----------|-------|--------|----------|
| 1 | Home page (trang chủ) | Giang | ✅ | `frontend/src/app/[locale]/page.tsx` |
| 2 | Hero section | Giang | ✅ | `frontend/src/components/landing/Hero.tsx` |
| 3 | Sandbox (trải nghiệm tương tác) | Giang | ✅ | `frontend/src/components/landing/Sandbox.tsx` (593 dòng) |
| 4 | Benefits section (lợi ích) | Giang | ✅ | `frontend/src/components/landing/Benefits.tsx` |
| 5 | Testimonials section (cảm nhận) | Giang | ✅ | `frontend/src/components/landing/Testimonials.tsx` |
| 6 | Roadmap section (lộ trình) | Giang | ✅ | `frontend/src/components/landing/Roadmap.tsx` |
| 7 | FAQ section (hỏi đáp) | Giang | ✅ | `frontend/src/components/landing/FAQ.tsx` |
| 8 | FAQ page (trang riêng) | Giang | ✅ | `frontend/src/app/[locale]/faq/page.tsx`, `FaqContent.tsx` |
| 9 | Pricing page (bảng giá) | Giang | ✅ | `frontend/src/app/[locale]/pricing/page.tsx`, `PricingClient.tsx` |
| 10 | Navbar (thanh điều hướng) | Giang | ✅ | `frontend/src/components/landing/Navbar.tsx` |
| 11 | Footer (chân trang) | Giang | ✅ | `frontend/src/components/landing/Footer.tsx` |
| 12 | i18n — Tiếng Việt (vi.json) | Giang | ✅ | `frontend/src/messages/vi.json` |
| 13 | i18n — Tiếng Anh (en.json) | Giang | ✅ | `frontend/src/messages/en.json` |
| 14 | ScrollReveal animation | Giang | ✅ | `frontend/src/components/shared/ScrollReveal.tsx` |
| 15 | i18n routing (next-intl) | Giang | ✅ | `frontend/src/i18n/routing.ts`, `request.ts` |

---

## 10. Infrastructure (Hạ tầng)

| # | Tính năng | Owner | Status | Evidence |
|-- |-----------|-------|--------|----------|
| 1 | Monorepo structure (backend/ + frontend/) | Giang | ✅ | Cấu trúc thư mục root |
| 2 | Docker Compose (2 services) | Giang | ✅ | `compose.yml` (79 dòng, healthcheck) |
| 3 | Env config (.env.docker) | Giang | ✅ | `.env.docker`, `.env.docker.example` |
| 4 | MongoDB connection + indexes | Bảo | ✅ | `backend/src/core/database.py:115-120` |
| 5 | CORS middleware (FastAPI) | Bảo | ✅ | `backend/src/main.py:203` |
| 6 | APScheduler 4 cron jobs | Bảo | ✅ | `backend/src/main.py:56-90` |
| 7 | structlog logging (JSON) | Bảo | ✅ | `backend/src/core/logging.py` |
| 8 | Health check endpoint | Bảo | ✅ | `backend/src/api/health.py:12` |
| 9 | Prometheus metrics (in-memory) | Miền | ✅ | `backend/src/core/metrics.py` |
| 10 | Metrics API endpoint | Miền | ✅ | `backend/src/api/metrics.py` |
| 11 | Langfuse integration (tracing) | Bảo | ✅ | `backend/src/core/langfuse.py` |
| 12 | AI logging hooks (6 tools) | Giang | ✅ | `.github/hooks/hooks.json`, `.claude/`, `.cursor/`, `.codex/`, `.gemini/` |
| 13 | Railway deploy (FE + BE) | Giang | ✅ | Docker compose sẵn sàng deploy |
| 14 | Email service (Resend) | Giang | ✅ | `backend/src/core/email.py` |
| 15 | Scripts: submit_log, log_hook | Giang | ✅ | `scripts/submit_log.py`, `scripts/log_hook.py` |
| 16 | Smoke test (Railway full flow) | Giang | ⬜ | Chưa có script smoke test |

---

## 11. Testing (Kiểm thử)

| # | Tính năng | Owner | Status | Evidence |
|-- |-----------|-------|--------|----------|
| 1 | Backend unit tests (17 files) | Bảo | ✅ | `backend/tests/unit/` — 17 files |
| 2 | Backend integration tests (5 files) | Bảo | ✅ | `backend/tests/integration/` — 5 files |
| 3 | Agent tests (5 files) | Bảo | ✅ | `backend/tests/agents/` — 5 files |
| 4 | Tool tests (3 files) | Miền | ✅ | `backend/tests/tools/` — 3 files |
| 5 | Test conftest + fixtures | Bảo | ✅ | `backend/tests/conftest.py`, `tests/fixtures/` |
| 6 | Frontend tests (vitest, 6 files) | Bảo | 🔶 | `frontend/src/__tests__/` — 6 files, coverage còn thấp |
| 7 | Smoke test (tự động) | Giang | ⬜ | Chưa có |
| 9 | Eval pipeline | Miền + Giang | ✅ | `backend/eval/scripts/run_eval.py`, `backend/eval/datasets/` |

---

## 12. Database (Cơ sở dữ liệu)

| # | Collection | Owner | Status | Evidence |
|-- |-----------|-------|--------|----------|
| 1 | **users** — thông tin người dùng | Giang | ✅ | `database.py:95`, `src/models/user.py` |
| 2 | **learning_sessions** — lịch sử học tập | Bảo | ✅ | `database.py:96-97`, `session_repository.py` |
| 3 | **agent_memory** — bộ nhớ agent | Bảo | ✅ | `memory_repository.py` |
| 4 | **practice_attempts** — bài làm | Bảo | ✅ | `database.py:98-102`, `practice_service.py` |
| 5 | **practice_exam_sets** — bộ đề thi | Bảo | ✅ | `database.py:103-106`, `practice_dataset.py` |
| 6 | **plans** — gói dịch vụ | Giang | ✅ | `database.py:107-108`, `plan_service.py` |
| 7 | **payments** — thanh toán | Giang | ✅ | `database.py:13-76`, `payment_service.py` |
| 8 | **usage_logs** — nhật ký sử dụng | Giang | ✅ | `database.py:109-111`, `usage_service.py` |

---

## 13. LLMOps (Observability)

| # | Tính năng | Owner | Status | Evidence |
|-- |-----------|-------|--------|----------|
| 1 | Audit log | Giang | ✅ | `backend/src/services/llm_audit.py`, `backend/src/api/admin.py` |
| 2 | Fallback model | Giang | ✅ | `backend/src/llm/model_router.py` |
| 3 | Dashboard metric | Giang | ✅ | `frontend/src/app/[locale]/admin/page.tsx` |
| 4 | Budget alert | Giang | ✅ | `backend/src/services/budget_alert.py` |
| 5 | Audit hook | Giang | ✅ | `backend/src/llm/openrouter_client.py`, `backend/src/services/llm_audit.py` |
| 6 | Token usage streaming | Giang | ✅ | `backend/src/llm/openrouter_client.py` |

---

## 14. Remaining Work (Công việc còn lại)

| # | Tính năng | Mức độ | Owner | Status | Ghi chú |
|-- |-----------|--------|-------|--------|---------|
| 1 | Smoke test full flow trên Railway | P0 | Giang | ⬜ | FE + BE đã deploy, cần script smoke test |
| 2 | TTS trigger — text-to-speech từ `tts_text` | P1 | Bảo | ⬜ | Backend đã trả `tts_text`, frontend chưa có trigger |
| 3 | UX Polish — tối ưu cho học sinh tiểu học | P1 | Miền | 🔶 | Đã responsive cơ bản, cần nút lớn, 1 task/màn |
| 4 | Frontend tests — mở rộng coverage | P1 | Miền | 🔶 | 6 test file vitest, cần thêm cho components chính |
| 5 | Demo script — account demo + fallback AI | P1 | Miền | ⬜ | Cần script demo tự động |
| 6 | Error state audit — loading/error/retry | P2 | Miền | ⬜ | Kiểm tra trạng thái lỗi trên tất cả pages |
| 7 | Mobile audit — responsive tablet/phone | P2 | Miền | ⬜ | Test responsive trên màn hình nhỏ |
| 8 | Quota enforcement UX — hiển thị hết quota | P2 | Giang | ⬜ | Backend có 429, frontend cần UX thân thiện |
| 9 | Eval CI/CD pipeline (Wave 3) — GitHub Actions eval + dataset mở rộng | P2 | Giang | ⬜ | Chờ roadmap |

---

## 15. Per-Member Summary (Tổng kết theo thành viên)

| Thành viên | Vai trò | Tổng features | ✅ Done | ⬜ Remaining | 🔶 Partial | Trọng tâm tiếp theo |
|------------|---------|--------------|---------|-------------|------------|-------------------|
| **Giang** | FE-BE + DevOps | ~100 | ~98 | 2 | 0 | Auth, Payment, Admin, Landing, Deploy, Pricing, LLMOps, Eval, Prompt versioning |
| **Bảo** | FE-BE | ~68 | ~66 | 1 | 1 | Learning Core, Practice (/learn), Visual/Sim, TTS/STT |
| **Miền** | FE-BE | ~50 | ~42 | 6 | 2 | AgentLoop, Tool, Chat UI, Memory, Eval/Metrics, FE tests |
| **Tổng cộng** | | ~218 | ~206 | 9 | 3 | |

---

## 16. Usage Guide (Hướng dẫn cập nhật)

### Cách cập nhật WORKLOG.md

1. **Khi bắt đầu task mới:**
   - Thêm dòng mới với ⬜ vào section tương ứng
   - Bao gồm tên tính năng, owner, và mô tả ngắn

2. **Khi đang làm:**
   - Đổi ⬜ → 🔶
   - (Không cần daily standup — cập nhật khi có thay đổi)

3. **Khi hoàn thành:**
   - Đổi 🔶 → ✅
   - Thêm evidence (file path + line number) vào cột Evidence
   - Evidence phải là file có thật trong codebase

4. **Khi phát hiện bug hoặc cần cải thiện:**
   - Thêm 🔶 vào các tính năng hiện có
   - Ghi chú lý do vào cột Ghi chú

5. **Sau mỗi lần merge code:**
   - Rà soát và cập nhật trạng thái feature tương ứng
   - Đảm bảo evidence trỏ đúng vào file/thư mục trong codebase
   - Kiểm tra không còn các task ID cũ (định dạng Tx-yy) trong file

6. **Review hàng tuần:**
   - Không cần daily standup — chỉ review 1 lần/tuần
   - Kiểm tra các ⬜ có cần ưu tiên lại không
   - Cập nhật số liệu trong Per-Member Summary

### Quy tắc evidence

- Mỗi ✅ **phải** có ít nhất một đường dẫn file thật
- ⬜ không cần evidence (vì chưa có code)
- 🔶 nên có ghi chú về phần nào đã làm, phần nào còn thiếu
- Sử dụng đường dẫn tương đối từ root repository
- Thêm line number nếu là function/class cụ thể

### Ví dụ:

```markdown
| Login JWT | BE-AI | ✅ | `backend/src/api/auth.py:116` |
```

```markdown
| TTS trigger | FE | ⬜ | Backend trả `tts_text`, cần implement frontend |
```
