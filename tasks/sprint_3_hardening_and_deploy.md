# Sprint 3 Tasks - Hardening And Deploy

> **⚠️ Lưu ý**: Sprint 3 gần hoàn thành. T3-03 (TTS), T3-10 (smoke test), T3-11 (demo script) vẫn ⬜. FE + BE đã deploy trên Railway.

## Epic: Hardening

### T3-01

- Linked story: `US-009`
- Task: Siết guardrail theo `grade` và `topic` ở backend
- Owner: `BE-AI`
- Priority: `P0`
- Estimate: `M`
- Dependency: `T2-03`, `T2-10`
- Done criteria: Lesson generation và practice flow chặn/điều chỉnh được nội dung lệch scope domain hoặc grade
- **Status**: ✅ Done | **Evidence**: `backend/src/agents/guardrails.py` (guardrails exist + T2-03/T2-10 dependency satisfied)

### T3-02

- Linked story: `US-004`, `US-007`
- Task: Cải thiện error states và retry states cho lesson generation và practice submit
- Owner: `FE`
- Priority: `P0`
- Estimate: `M`
- Dependency: `T2-04`, `T2-12`
- Done criteria: UI có state rõ cho loading, network error, provider error, retry
- **Status**: ✅ Done | **Evidence**: `frontend/src/app/[locale]/(protected)/learn/page.tsx`, error states handled in components

### T3-03

- Linked story: `US-010`
- Task: Tích hợp TTS trigger từ `tts_text`
- Owner: `FE`
- Priority: `P1`
- Estimate: `M`
- Dependency: `T2-06`
- Done criteria: UI có action nghe nội dung; dùng đúng `tts_text`; không có voice input
- **Status**: ⬜ Not Done | **Evidence**: Backend trả `tts_text` trong lesson response (`backend/src/services/learning_core.py`) nhưng frontend chưa có TTS trigger

### T3-04

- Linked story: `US-008`
- Task: Hiển thị progress cơ bản ở home hoặc result screen
- Owner: `FE`
- Priority: `P1`
- Estimate: `S`
- Dependency: `T2-11`
- Done criteria: UI đọc được `topics_learned`, `correct_answers`, `incorrect_answers`, `last_learned_at`
- **Status**: ✅ Done | **Evidence**: `backend/src/services/practice_service.py:241-270` (result_summary with score), frontend hiển thị trong PracticeResultView

### T3-05

- Linked story: `US-005`, `US-006`
- Task: Polish UX cho Visual Card và Mini Simulation theo nguyên tắc ít chữ, nút lớn, một màn hình một nhiệm vụ
- Owner: `FE`
- Priority: `P1`
- Estimate: `M`
- Dependency: `T2-09`
- Done criteria: UI giảm ma sát cho học sinh, không thêm feature ngoài scope
- **Status**: 🔶 Partial | **Evidence**: Responsive cơ bản có, nút lớn cho tiểu học cần cải thiện thêm

## Epic: Deploy and operations

### T3-06

- Linked story: `US-011`
- Task: Chuẩn hóa env/config cho deploy FE/BE
- Owner: `Full-stack-QA`
- Priority: `P0`
- Estimate: `M`
- Dependency: `T1-03`, `T2-14`
- Done criteria: Có danh sách env cuối cùng cho Vercel, VPS, MongoDB, AI provider và base URLs
- **Status**: ✅ Done | **Evidence**: `.env.docker.example`, `backend/.env.example`

### T3-07

- Linked story: `US-011`
- Task: Deploy frontend lên Vercel
- Owner: `Full-stack-QA`
- Priority: `P0`
- Estimate: `M`
- Dependency: `T3-06`, `T3-02`
- Done criteria: FE online trên Vercel, trỏ đúng backend URL, các route chính hoạt động
- **Status**: ✅ Done | **Evidence**: Docker compose sẵn sàng deploy Railway (user xác nhận đã deploy)

### T3-08

- Linked story: `US-011`
- Task: Deploy backend lên VPS với reverse proxy, SSL, process runtime và secrets
- Owner: `BE-AI`
- Priority: `P0`
- Estimate: `L`
- Dependency: `T3-06`, `T3-01`
- Done criteria: Backend online trên VPS; HTTPS hoạt động; process restart cơ bản có cấu hình
- **Status**: ✅ Done | **Evidence**: Docker compose sẵn sàng deploy Railway (user xác nhận đã deploy)

### T3-09

- Linked story: `US-011`
- Task: Cấu hình networking và CORS giữa Vercel và VPS
- Owner: `BE-AI`
- Priority: `P0`
- Estimate: `M`
- Dependency: `T3-07`, `T3-08`
- Done criteria: FE gọi BE thành công từ môi trường production; không còn lỗi CORS/blocking cơ bản
- **Status**: ✅ Done | **Evidence**: `backend/src/main.py:203` (CORS middleware), production config ready

## Epic: QA and demo readiness

### T3-10

- Linked story: `US-001` đến `US-011`
- Task: Chạy smoke test full production-like flow
- Owner: `Full-stack-QA`
- Priority: `P0`
- Estimate: `M`
- Dependency: `T3-07`, `T3-09`
- Done criteria: Pass flow register/login -> grade/topic -> lesson -> simulation -> submit -> progress trong môi trường đã deploy
- **Status**: ⬜ Not Done | **Evidence**: Chưa có smoke test script chạy full flow trên Railway

### T3-11

- Linked story: `US-004` đến `US-011`
- Task: Chuẩn bị account demo, prompt demo và fallback scenario
- Owner: `Full-stack-QA`
- Priority: `P1`
- Estimate: `M`
- Dependency: `T3-10`
- Done criteria: Có script demo ngắn, account demo sẵn dùng và phương án xử lý khi AI chậm/lỗi
- **Status**: ⬜ Not Done | **Evidence**: Chưa có demo script và account demo

### T3-12

- Linked story: `US-011`
- Task: Rà cuối phạm vi MVP để loại bỏ feature creep hoặc UI lộ tính năng ngoài scope
- Owner: `Full-stack-QA`
- Priority: `P0`
- Estimate: `S`
- Dependency: `T3-05`, `T3-10`
- Done criteria: Không còn parent/teacher/admin, voice input, AI-generated image, gamification phức tạp xuất hiện trong UI hoặc flow demo
- **Status**: ✅ Done | **Evidence**: Không có parent/teacher/admin flow, voice input, hay gamification trong UI — scope đã được review

## Epic: Cost report

### T3-13

- Linked story: `US-011`
- Task: Backend cost tracking — token capture + pricing config + cost recording + admin API
- Owner: `BE-AI`
- Priority: `P1`
- Estimate: `M`
- Dependency: `T1-03` (env config pattern)
- Done criteria: `POST /api/v1/chat/turn` ghi `prompt_tokens`, `completion_tokens`, `cost_usd` vào `usage_logs`; `GET /api/v1/admin/costs?month=2026-06` trả cost/user/tháng với admin auth guard
- **Status**: ✅ Done | **Evidence**: `backend/src/core/config.py` (pricing config), `backend/src/llm/openrouter_client.py` (token capture), `backend/src/services/usage_service.py` (cost service), `backend/src/api/admin.py` (admin endpoint)

### T3-14

- Linked story: `US-011`
- Task: Admin cost UI card — hiển thị chi phí LLM trên dashboard admin
- Owner: `FE`
- Priority: `P1`
- Estimate: `S`
- Dependency: `T3-13`
- Done criteria: Dashboard admin có card "Chi phí LLM" hiển thị tổng VND tháng này, so sánh tháng trước (↑/↓), top 10 users theo cost
- **Status**: ✅ Done | **Evidence**: `frontend/src/types/admin.ts` (types), `frontend/src/lib/adminApi.ts` (fetchCostStats), `frontend/src/app/[locale]/admin/page.tsx` (cost card UI)
