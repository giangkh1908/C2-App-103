# Worklog — Bảng phân chia công việc và tiến độ từng thành viên

*(Dựa trên codebase thực tế — không dựa trên kế hoạch cũ)*

## Chú thích

| Ký hiệu | Ý nghĩa |
|---------|---------|
| ✅ | Đã hoàn thành (có code chạy được, kèm evidence) |
| ⬜ | Chưa làm |
| 🔶 | Làm một phần / cần cải thiện |

**Owner:**
- **FE** = Frontend (giao diện, UI/UX, component, i18n)
- **BE-AI** = Backend + AI (API, database, services, agents)
- **Full-stack-QA** = Infra + test + deploy + CI

---

## 1. Auth (Xác thực & Phân quyền)

| # | Tính năng | Owner | Status | Evidence |
|---|-----------|-------|--------|----------|
| 1 | Register (đăng ký email + password) | BE-AI | ✅ | `backend/src/api/auth.py:76` |
| 2 | Login JWT (access + refresh token) | BE-AI | ✅ | `backend/src/api/auth.py:116` |
| 3 | Google OAuth (đăng nhập bằng Google) | BE-AI | ✅ | `backend/src/api/auth.py:147` |
| 4 | Refresh token rotation (vô hiệu hoá token cũ) | BE-AI | ✅ | `backend/src/api/auth.py:216-276` |
| 5 | Forgot password (gửi email reset) | BE-AI | ✅ | `backend/src/api/auth.py:298` |
| 6 | Reset password (đặt lại mật khẩu) | BE-AI | ✅ | `backend/src/api/auth.py:323` |
| 7 | Email verification (xác thực email) | BE-AI | ✅ | `backend/src/api/auth.py:350-399` |
| 8 | Login page (giao diện đăng nhập) | FE | ✅ | `frontend/src/app/[locale]/(auth)/login/page.tsx` |
| 9 | Register page (giao diện đăng ký) | FE | ✅ | `frontend/src/app/[locale]/(auth)/register/page.tsx` |
| 10 | Forgot/Reset password pages | FE | ✅ | `frontend/src/app/[locale]/(auth)/forgot-password/page.tsx`, `reset-password/page.tsx` |
| 11 | Email verification page | FE | ✅ | `frontend/src/app/[locale]/(auth)/verify-email/page.tsx` |
| 12 | Google Sign-In Button | FE | ✅ | `frontend/src/components/auth/GoogleSignInButton.tsx` |
| 13 | AuthProvider (React context) | FE | ✅ | `frontend/src/components/providers/AuthProvider.tsx:36` |
| 14 | RequireAuth (guard component) | FE | ✅ | `frontend/src/components/auth/RequireAuth.tsx:10` |
| 15 | Auth layout (bố cục trang auth) | FE | ✅ | `frontend/src/app/[locale]/(auth)/layout.tsx` |
| 16 | Login/Register form components | FE | ✅ | `frontend/src/components/auth/LoginForm.tsx`, `RegisterForm.tsx` |

---

## 2. Learning Core (Lõi học tập AI)

| # | Tính năng | Owner | Status | Evidence |
|---|-----------|-------|--------|----------|
| 1 | OpenRouter adapter (kết nối LLM) | BE-AI | ✅ | `backend/src/llm/openrouter_client.py` |
| 2 | Base LLM client (abstract class) | BE-AI | ✅ | `backend/src/llm/base.py` |
| 3 | TutorAgent chat (không stream) | BE-AI | ✅ | `backend/src/agents/tutor_agent.py:29` |
| 4 | TutorAgent chat_stream (streaming) | BE-AI | ✅ | `backend/src/agents/tutor_agent.py:65` |
| 5 | AgentLoop (vòng lặp agent) | BE-AI | ✅ | `backend/src/agents/agent_loop.py` |
| 6 | Lesson schema validation (Pydantic) | BE-AI | ✅ | `backend/src/models/lesson.py` |
| 7 | Context detector (phát hiện chủ đề) | BE-AI | ✅ | `backend/src/services/context_detector.py:44` |
| 8 | Guardrails (lọc nội dung) | BE-AI | ✅ | `backend/src/agents/guardrails.py` |
| 9 | Response mapper (map kết quả) | BE-AI | ✅ | `backend/src/services/response_mapper.py` |
| 10 | Session repository (lưu lượt chat) | BE-AI | ✅ | `backend/src/services/session_repository.py` |
| 11 | Memory repository (lịch sử hội thoại) | BE-AI | ✅ | `backend/src/services/memory_repository.py` |
| 12 | Fallback responses (dự phòng) | BE-AI | ✅ | `backend/src/services/learning_core.py:754-784` |
| 13 | "Ví dụ khác" feature | BE-AI | ✅ | `backend/src/services/learning_core.py:80-120` |
| 14 | LearningCoreService.generate() | BE-AI | ✅ | `backend/src/services/learning_core.py:36` |
| 15 | LearningCoreService.generate_stream() | BE-AI | ✅ | `backend/src/services/learning_core.py:295` |
| 16 | Chat orchestrator | BE-AI | ✅ | `backend/src/agents/chat_orchestrator.py` |
| 17 | Agent schemas + prompts | BE-AI | ✅ | `backend/src/agents/schemas.py`, `prompts.py` |
| 18 | Validation service | BE-AI | ✅ | `backend/src/services/validation.py` |
| 19 | Visual builder (sinh dữ liệu visual) | BE-AI | ✅ | `backend/src/services/visual_builder.py` |
| 20 | Practice builder (sinh câu hỏi) | BE-AI | ✅ | `backend/src/services/practice_builder.py` |

---

## 3. Visual & Simulation (Trực quan & Mô phỏng)

| # | Tính năng | Owner | Status | Evidence |
|---|-----------|-------|--------|----------|
| 1 | Visual Card renderer | FE | ✅ | `frontend/src/components/AIExplanationChat.tsx` |
| 2 | InteractiveSimulation component | FE | ✅ | `frontend/src/components/InteractiveSimulation.tsx:42` |
| 3 | equal_groups (kẹo/đĩa phép nhân) | FE | ✅ | `InteractiveSimulation.tsx:21-23` |
| 4 | sharing (chia táo phép chia) | FE | ✅ | `InteractiveSimulation.tsx:25-32` |
| 5 | fraction_pizza (pizza phân số) | FE | ✅ | `InteractiveSimulation.tsx:34-36` |
| 6 | perimeter_path + area_grid | FE | ✅ | `InteractiveSimulation.tsx:38-40` |
| 7 | AIExplanationChat (component chat) | FE | ✅ | `frontend/src/components/AIExplanationChat.tsx` (956 dòng) |
| 8 | TTS trigger (đọc văn bản) | FE | ⬜ | Backend đã trả `tts_text`, frontend chưa có trigger |
| 9 | UX Polish (tối ưu mobile) | FE | 🔶 | Đã responsive cơ bản, cần tối ưu cho học sinh tiểu học |

---

## 4. Practice (Luyện tập)

| # | Tính năng | Owner | Status | Evidence |
|---|-----------|-------|--------|----------|
| 1 | PracticeService (logic luyện tập) | BE-AI | ✅ | `backend/src/services/practice_service.py:28` |
| 2 | PracticeBuilder (xây đề thi) | BE-AI | ✅ | `backend/src/services/practice_builder.py` |
| 3 | PracticeDataset (MCQ curated) | BE-AI | ✅ | `backend/src/services/practice_dataset.py` |
| 4 | Curated manifest (10 đề/lớp × 5 lớp) | BE-AI | ✅ | `backend/data/practice/vi_grade_school_math_mcq_curated_manifest.json` |
| 5 | Attempt lifecycle (create/in_progress) | BE-AI | ✅ | `practice_service.py:126-182` |
| 6 | Attempt submit + scoring | BE-AI | ✅ | `practice_service.py:217-308` |
| 7 | Save draft (lưu nháp) | BE-AI | ✅ | `practice_service.py:184-215` |
| 8 | Practice API endpoints | BE-AI | ✅ | `backend/src/api/practice.py` |
| 9 | PracticeBrowserView (danh sách đề) | FE | ✅ | `frontend/src/components/practice/PracticeBrowserView.tsx` |
| 10 | PracticeExamView (làm bài thi) | FE | ✅ | `frontend/src/components/practice/PracticeExamView.tsx` |
| 11 | PracticeResultView (kết quả) | FE | ✅ | `frontend/src/components/practice/PracticeResultView.tsx` |
| 12 | PracticeDialogs (hộp thoại) | FE | ✅ | `frontend/src/components/practice/PracticeDialogs.tsx` |
| 13 | PracticeExperience (container) | FE | ✅ | `frontend/src/components/practice/PracticeExperience.tsx` |
| 14 | Practice page (/practice route) | FE | ✅ | `frontend/src/app/[locale]/(protected)/practice/page.tsx` |
| 15 | Progress tracking (điểm, đúng/sai) | BE-AI | ✅ | `practice_service.py:241-270` (result_summary) |

---

## 5. Chat UI (Giao diện trò chuyện)

| # | Tính năng | Owner | Status | Evidence |
|---|-----------|-------|--------|----------|
| 1 | /learn page (trang học) | FE | ✅ | `frontend/src/app/[locale]/(protected)/learn/page.tsx` |
| 2 | Streaming chat (backend SSE) | BE-AI | ✅ | `backend/src/api/chat_stream.py` |
| 3 | Chat history API (CRUD) | BE-AI | ✅ | `backend/src/api/chat_history.py` |
| 4 | ChatHistorySidebar (sidebar) | FE | ✅ | `frontend/src/components/chat/ChatHistorySidebar.tsx` |
| 5 | useChatStream hook (frontend) | FE | ✅ | `frontend/src/lib/useChatStream.ts` |
| 6 | chatHistoryApi lib | FE | ✅ | `frontend/src/lib/chatHistoryApi.ts` |
| 7 | Chat API (turn-based) | BE-AI | ✅ | `backend/src/api/chat.py` |

---

## 6. Plans & Subscription (Gói dịch vụ & Đăng ký)

| # | Tính năng | Owner | Status | Evidence |
|---|-----------|-------|--------|----------|
| 1 | Plan seeding (free/plus/premium) | BE-AI | ✅ | `backend/src/services/plan_service.py:9-67` |
| 2 | Plan catalog API (công khai) | BE-AI | ✅ | `backend/src/api/plans.py:8` |
| 3 | Plan model (PlanQuota, PlanFeatures) | BE-AI | ✅ | `backend/src/models/plan.py:6-20` |
| 4 | SubscriptionService (auto-expire) | BE-AI | ✅ | `backend/src/services/subscription_service.py:68` |
| 5 | Expiry reminder emails | BE-AI | ✅ | `subscription_service.py:114` |
| 6 | UsageService (quota tracking) | BE-AI | ✅ | `backend/src/services/usage_service.py:22` |
| 7 | Quota enforcement (check + record) | BE-AI | ✅ | `usage_service.py:86-138` |
| 8 | Quota refund on AI failure | BE-AI | ✅ | `usage_service.py:140-158` |
| 9 | Quota overview (admin + user) | BE-AI | ✅ | `usage_service.py:200-263` |
| 10 | Plan API (admin listing) | BE-AI | ✅ | `backend/src/api/plans.py` |

---

## 7. Payment (Thanh toán)

| # | Tính năng | Owner | Status | Evidence |
|---|-----------|-------|--------|----------|
| 1 | SePay integration (cổng thanh toán) | BE-AI | ✅ | `backend/src/services/payment_service.py` |
| 2 | Checkout flow (tạo QR) | BE-AI | ✅ | `backend/src/api/payment.py:308` |
| 3 | Webhook handler (SePay → backend) | BE-AI | ✅ | `backend/src/api/payment.py:159` |
| 4 | Payment status polling | BE-AI | ✅ | `backend/src/api/payment.py:347` |
| 5 | Cancel payment endpoint | BE-AI | ✅ | `backend/src/api/payment.py:376` |
| 6 | Payment model (status lifecycle) | BE-AI | ✅ | `backend/src/models/payment.py` |
| 7 | PaymentClient + QR render | FE | ✅ | `frontend/src/app/[locale]/payment/PaymentClient.tsx` |
| 8 | Payment success page | FE | ✅ | `frontend/src/app/[locale]/payment/success/page.tsx` |
| 9 | Payment failed page | FE | ✅ | `frontend/src/app/[locale]/payment/failed/page.tsx` |
| 10 | Payment cancel page | FE | ✅ | `frontend/src/app/[locale]/payment/cancel/page.tsx` |
| 11 | Payment client lib (paymentApi.ts) | FE | ✅ | `frontend/src/lib/paymentApi.ts:107` |
| 12 | UpgradeModal (nâng cấp gói) | FE | ✅ | `frontend/src/components/UpgradeModal.tsx` |
| 13 | UsageCounter (quota còn lại) | FE | ✅ | `frontend/src/components/UsageCounter.tsx` |
| 14 | planApi lib (gọi plans API) | FE | ✅ | `frontend/src/lib/planApi.ts` |

---

## 8. Admin (Quản trị)

| # | Tính năng | Owner | Status | Evidence |
|---|-----------|-------|--------|----------|
| 1 | Admin dashboard (thống kê) | BE-AI | ✅ | `backend/src/api/admin.py:363` |
| 2 | Admin dashboard UI | FE | ✅ | `frontend/src/app/[locale]/admin/page.tsx` |
| 3 | User list API | BE-AI | ✅ | `backend/src/api/admin.py:201` |
| 4 | User extend subscription | BE-AI | ✅ | `backend/src/api/admin.py:316` |
| 5 | User change plan | BE-AI | ✅ | `backend/src/api/admin.py:261` |
| 6 | User management UI | FE | ✅ | `frontend/src/app/[locale]/admin/users/page.tsx` |
| 7 | Payment list API | BE-AI | ✅ | `backend/src/api/admin.py:37` |
| 8 | Payment detail API | BE-AI | ✅ | `backend/src/api/admin.py:103` |
| 9 | Payment activate manually | BE-AI | ✅ | `backend/src/api/admin.py:128` |
| 10 | Payment management UI | FE | ✅ | `frontend/src/app/[locale]/admin/payments/page.tsx` |
| 11 | Payment detail page | FE | ✅ | `frontend/src/app/[locale]/admin/payments/[id]/page.tsx` |
| 12 | Admin plan listing | BE-AI | ✅ | `backend/src/api/admin.py:244` |
| 13 | Admin role guard (frontend) | FE | ✅ | `frontend/src/app/[locale]/admin/layout.tsx:14` |
| 14 | Admin layout + sidebar | FE | ✅ | `frontend/src/app/[locale]/admin/layout.tsx` |
| 15 | adminApi lib | FE | ✅ | `frontend/src/lib/adminApi.ts` |
| 16 | scripts/create_admin.py | BE-AI | ✅ | `scripts/create_admin.py` |

---

## 9. Landing & Marketing (Trang chủ & Tiếp thị)

| # | Tính năng | Owner | Status | Evidence |
|---|-----------|-------|--------|----------|
| 1 | Home page (trang chủ) | FE | ✅ | `frontend/src/app/[locale]/page.tsx` |
| 2 | Hero section | FE | ✅ | `frontend/src/components/landing/Hero.tsx` |
| 3 | Sandbox (trải nghiệm tương tác) | FE | ✅ | `frontend/src/components/landing/Sandbox.tsx` (593 dòng) |
| 4 | Benefits section (lợi ích) | FE | ✅ | `frontend/src/components/landing/Benefits.tsx` |
| 5 | Testimonials section (cảm nhận) | FE | ✅ | `frontend/src/components/landing/Testimonials.tsx` |
| 6 | Roadmap section (lộ trình) | FE | ✅ | `frontend/src/components/landing/Roadmap.tsx` |
| 7 | FAQ section (hỏi đáp) | FE | ✅ | `frontend/src/components/landing/FAQ.tsx` |
| 8 | FAQ page (trang riêng) | FE | ✅ | `frontend/src/app/[locale]/faq/page.tsx`, `FaqContent.tsx` |
| 9 | Pricing page (bảng giá) | FE | ✅ | `frontend/src/app/[locale]/pricing/page.tsx`, `PricingClient.tsx` |
| 10 | Navbar (thanh điều hướng) | FE | ✅ | `frontend/src/components/landing/Navbar.tsx` |
| 11 | Footer (chân trang) | FE | ✅ | `frontend/src/components/landing/Footer.tsx` |
| 12 | i18n — Tiếng Việt (vi.json) | FE | ✅ | `frontend/src/messages/vi.json` |
| 13 | i18n — Tiếng Anh (en.json) | FE | ✅ | `frontend/src/messages/en.json` |
| 14 | ScrollReveal animation | FE | ✅ | `frontend/src/components/shared/ScrollReveal.tsx` |
| 15 | i18n routing (next-intl) | FE | ✅ | `frontend/src/i18n/routing.ts`, `request.ts` |

---

## 10. Infrastructure (Hạ tầng)

| # | Tính năng | Owner | Status | Evidence |
|---|-----------|-------|--------|----------|
| 1 | Monorepo structure (backend/ + frontend/) | Full-stack-QA | ✅ | Cấu trúc thư mục root |
| 2 | Docker Compose (2 services) | Full-stack-QA | ✅ | `compose.yml` (79 dòng, healthcheck) |
| 3 | Env config (.env.docker) | Full-stack-QA | ✅ | `.env.docker`, `.env.docker.example` |
| 4 | MongoDB connection + indexes | BE-AI | ✅ | `backend/src/core/database.py:115-120` |
| 5 | CORS middleware (FastAPI) | BE-AI | ✅ | `backend/src/main.py:203` |
| 6 | APScheduler 4 cron jobs | BE-AI | ✅ | `backend/src/main.py:56-90` |
| 7 | structlog logging (JSON) | BE-AI | ✅ | `backend/src/core/logging.py` |
| 8 | Health check endpoint | BE-AI | ✅ | `backend/src/api/health.py:12` |
| 9 | Prometheus metrics (in-memory) | BE-AI | ✅ | `backend/src/core/metrics.py` |
| 10 | Metrics API endpoint | BE-AI | ✅ | `backend/src/api/metrics.py` |
| 11 | Langfuse integration (tracing) | BE-AI | ✅ | `backend/src/core/langfuse.py` |
| 12 | AI logging hooks (6 tools) | Full-stack-QA | ✅ | `.github/hooks/hooks.json`, `.claude/`, `.cursor/`, `.codex/`, `.gemini/` |
| 13 | Railway deploy (FE + BE) | Full-stack-QA | ✅ | Docker compose sẵn sàng deploy |
| 14 | Email service (Resend) | BE-AI | ✅ | `backend/src/core/email.py` |
| 15 | Scripts: submit_log, log_hook | Full-stack-QA | ✅ | `scripts/submit_log.py`, `scripts/log_hook.py` |
| 16 | Smoke test (Railway full flow) | Full-stack-QA | ⬜ | Chưa có script smoke test |

---

## 11. Testing (Kiểm thử)

| # | Tính năng | Owner | Status | Evidence |
|---|-----------|-------|--------|----------|
| 1 | Backend unit tests (17 files) | BE-AI | ✅ | `backend/tests/unit/` — 17 files |
| 2 | Backend integration tests (5 files) | BE-AI | ✅ | `backend/tests/integration/` — 5 files |
| 3 | Agent tests (5 files) | BE-AI | ✅ | `backend/tests/agents/` — 5 files |
| 4 | Tool tests (3 files) | BE-AI | ✅ | `backend/tests/tools/` — 3 files |
| 5 | Test conftest + fixtures | BE-AI | ✅ | `backend/tests/conftest.py`, `tests/fixtures/` |
| 6 | Frontend tests (vitest, 6 files) | FE | 🔶 | `frontend/src/__tests__/` — 6 files, coverage còn thấp |
| 7 | Smoke test (tự động) | Full-stack-QA | ⬜ | Chưa có |
| 8 | Demo script (tự động) | Full-stack-QA | ⬜ | Chưa có |

---

## 12. Database (Cơ sở dữ liệu)

| # | Collection | Owner | Status | Evidence |
|---|-----------|-------|--------|----------|
| 1 | **users** — thông tin người dùng | BE-AI | ✅ | `database.py:95`, `src/models/user.py` |
| 2 | **learning_sessions** — lịch sử học tập | BE-AI | ✅ | `database.py:96-97`, `session_repository.py` |
| 3 | **agent_memory** — bộ nhớ agent | BE-AI | ✅ | `memory_repository.py` |
| 4 | **practice_attempts** — bài làm | BE-AI | ✅ | `database.py:98-102`, `practice_service.py` |
| 5 | **practice_exam_sets** — bộ đề thi | BE-AI | ✅ | `database.py:103-106`, `practice_dataset.py` |
| 6 | **plans** — gói dịch vụ | BE-AI | ✅ | `database.py:107-108`, `plan_service.py` |
| 7 | **payments** — thanh toán | BE-AI | ✅ | `database.py:13-76`, `payment_service.py` |
| 8 | **usage_logs** — nhật ký sử dụng | BE-AI | ✅ | `database.py:109-111`, `usage_service.py` |

---

## 13. Remaining Work (Công việc còn lại)

| # | Tính năng | Mức độ | Owner | Status | Ghi chú |
|---|-----------|--------|-------|--------|---------|
| 1 | Smoke test full flow trên Railway | P0 | Full-stack-QA | ⬜ | FE + BE đã deploy, cần script smoke test |
| 2 | TTS trigger — text-to-speech từ `tts_text` | P1 | FE | ⬜ | Backend đã trả `tts_text`, frontend chưa có trigger |
| 3 | UX Polish — tối ưu cho học sinh tiểu học | P1 | FE | 🔶 | Đã responsive cơ bản, cần nút lớn, 1 task/màn |
| 4 | Frontend tests — mở rộng coverage | P1 | FE | 🔶 | 6 test file vitest, cần thêm cho components chính |
| 5 | Demo script — account demo + fallback AI | P1 | Full-stack-QA | ⬜ | Cần script demo tự động |
| 6 | Error state audit — loading/error/retry | P2 | FE | ⬜ | Kiểm tra trạng thái lỗi trên tất cả pages |
| 7 | Mobile audit — responsive tablet/phone | P2 | FE | ⬜ | Test responsive trên màn hình nhỏ |
| 8 | Quota enforcement UX — hiển thị hết quota | P2 | FE | ⬜ | Backend có 429, frontend cần UX thân thiện |

---

## 14. Per-Member Summary (Tổng kết theo thành viên)

| Thành viên | Tổng features | ✅ Done | ⬜ Remaining | 🔶 Partial | Trọng tâm tiếp theo |
|------------|--------------|---------|-------------|------------|-------------------|
| **FE** | ~42 | ~37 | 3 | 2 | TTS trigger, UX Polish, Mobile audit |
| **BE-AI** | ~46 | ~46 | 0 | 0 | Hỗ trợ smoke test, monitoring |
| **Full-stack-QA** | ~18 | ~15 | 3 | 0 | Smoke test Railway, Demo script |
| **Tổng cộng** | ~106 | ~98 | 6 | 2 | |

---

## 15. Usage Guide (Hướng dẫn cập nhật)

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
