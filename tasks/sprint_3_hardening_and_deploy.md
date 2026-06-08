# Sprint 3 Tasks - Hardening And Deploy

## Epic: Hardening

### T3-01

- Linked story: `US-009`
- Task: Siết guardrail theo `grade` và `topic` ở backend
- Owner: `BE-AI`
- Priority: `P0`
- Estimate: `M`
- Dependency: `T2-03`, `T2-10`
- Done criteria: Lesson generation và practice flow chặn/điều chỉnh được nội dung lệch scope domain hoặc grade

### T3-02

- Linked story: `US-004`, `US-007`
- Task: Cải thiện error states và retry states cho lesson generation và practice submit
- Owner: `FE`
- Priority: `P0`
- Estimate: `M`
- Dependency: `T2-04`, `T2-12`
- Done criteria: UI có state rõ cho loading, network error, provider error, retry

### T3-03

- Linked story: `US-010`
- Task: Tích hợp TTS trigger từ `tts_text`
- Owner: `FE`
- Priority: `P1`
- Estimate: `M`
- Dependency: `T2-06`
- Done criteria: UI có action nghe nội dung; dùng đúng `tts_text`; không có voice input

### T3-04

- Linked story: `US-008`
- Task: Hiển thị progress cơ bản ở home hoặc result screen
- Owner: `FE`
- Priority: `P1`
- Estimate: `S`
- Dependency: `T2-11`
- Done criteria: UI đọc được `topics_learned`, `correct_answers`, `incorrect_answers`, `last_learned_at`

### T3-05

- Linked story: `US-005`, `US-006`
- Task: Polish UX cho Visual Card và Mini Simulation theo nguyên tắc ít chữ, nút lớn, một màn hình một nhiệm vụ
- Owner: `FE`
- Priority: `P1`
- Estimate: `M`
- Dependency: `T2-09`
- Done criteria: UI giảm ma sát cho học sinh, không thêm feature ngoài scope

## Epic: Deploy and operations

### T3-06

- Linked story: `US-011`
- Task: Chuẩn hóa env/config cho deploy FE/BE
- Owner: `Full-stack-QA`
- Priority: `P0`
- Estimate: `M`
- Dependency: `T1-03`, `T2-14`
- Done criteria: Có danh sách env cuối cùng cho Vercel, VPS, MongoDB, AI provider và base URLs

### T3-07

- Linked story: `US-011`
- Task: Deploy frontend lên Vercel
- Owner: `Full-stack-QA`
- Priority: `P0`
- Estimate: `M`
- Dependency: `T3-06`, `T3-02`
- Done criteria: FE online trên Vercel, trỏ đúng backend URL, các route chính hoạt động

### T3-08

- Linked story: `US-011`
- Task: Deploy backend lên VPS với reverse proxy, SSL, process runtime và secrets
- Owner: `BE-AI`
- Priority: `P0`
- Estimate: `L`
- Dependency: `T3-06`, `T3-01`
- Done criteria: Backend online trên VPS; HTTPS hoạt động; process restart cơ bản có cấu hình

### T3-09

- Linked story: `US-011`
- Task: Cấu hình networking và CORS giữa Vercel và VPS
- Owner: `BE-AI`
- Priority: `P0`
- Estimate: `M`
- Dependency: `T3-07`, `T3-08`
- Done criteria: FE gọi BE thành công từ môi trường production; không còn lỗi CORS/blocking cơ bản

## Epic: QA and demo readiness

### T3-10

- Linked story: `US-001` đến `US-011`
- Task: Chạy smoke test full production-like flow
- Owner: `Full-stack-QA`
- Priority: `P0`
- Estimate: `M`
- Dependency: `T3-07`, `T3-09`
- Done criteria: Pass flow register/login -> grade/topic -> lesson -> simulation -> submit -> progress trong môi trường đã deploy

### T3-11

- Linked story: `US-004` đến `US-011`
- Task: Chuẩn bị account demo, prompt demo và fallback scenario
- Owner: `Full-stack-QA`
- Priority: `P1`
- Estimate: `M`
- Dependency: `T3-10`
- Done criteria: Có script demo ngắn, account demo sẵn dùng và phương án xử lý khi AI chậm/lỗi

### T3-12

- Linked story: `US-011`
- Task: Rà cuối phạm vi MVP để loại bỏ feature creep hoặc UI lộ tính năng ngoài scope
- Owner: `Full-stack-QA`
- Priority: `P0`
- Estimate: `S`
- Dependency: `T3-05`, `T3-10`
- Done criteria: Không còn parent/teacher/admin, voice input, AI-generated image, gamification phức tạp xuất hiện trong UI hoặc flow demo
