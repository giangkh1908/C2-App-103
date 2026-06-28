# Sprint Plan

## Sprint strategy

MVP được chia thành 3 sprint để cân bằng giữa foundation, core learning flow và hardening/deploy. Sprint 3 ưu tiên rõ `hardening + deploy`, không dùng để mở thêm feature breadth ngoài scope MVP.

## Sprint 1: Foundation

### Goal

Thiết lập nền tảng kỹ thuật và luồng onboarding tối thiểu để hệ thống có skeleton chạy được end-to-end ở mức chưa có AI lesson hoàn chỉnh.

### Scope

- monorepo structure
- shared enums/schemas
- environment setup
- auth cơ bản
- grade selection
- topic list
- FE/BE connectivity skeleton
- MongoDB connection

### Deliverables

- repo có structure `apps/web`, `apps/api`, `packages/shared`
- shared contracts đầu tiên cho `topic`, `visual_type`, lesson/progress shape
- FE có màn hình auth, chọn lớp, chọn chủ đề
- BE có auth routes, topic route, MongoDB connection
- FE gọi được BE qua cấu hình environment

### Demo outcome

Nhóm có thể demo:

- tạo tài khoản
- đăng nhập
- chọn lớp
- xem 4 chủ đề MVP

Chưa yêu cầu AI lesson generation hoàn chỉnh ở sprint này.

## Sprint 2: Core learning flow

### Goal

Hoàn thiện luồng học cốt lõi từ lúc học sinh hỏi AI đến lúc nhận lesson, tương tác simulation, nộp câu trả lời và lưu progress.

### Scope

- `/lessons/generate`
- AI adapter + validation
- Visual Card render
- Mini Simulation cho 4 domain
- `/practice/submit`
- progress update
- result and retry flow

### Deliverables

- BE sinh lesson JSON đúng schema cho 4 domain
- FE render Visual Card từ API response
- simulation map đúng theo `visual_type`
- practice submit trả đúng/sai và explanation
- progress được lưu và đọc lại

### Demo outcome

Nhóm có thể demo full flow:

- học sinh chọn chủ đề
- nhập câu hỏi đơn giản
- xem visual đúng domain
- tương tác mô phỏng
- nộp một câu trả lời
- nhận feedback và thấy progress được cập nhật

## Sprint 3: Hardening + deploy

### Goal

Ổn định hệ thống để usable và demo-ready. FE + BE đã deploy trên Railway. Còn lại: smoke test, TTS trigger, demo script.

### Scope

- guardrail tightening
- UX polish cho flow học sinh
- TTS output integration
- error states / retry states
- FE deploy lên Railway ✅
- BE deploy lên Railway ✅
- smoke test và demo prep

### Deliverables

- guardrail theo `grade` và `topic` được kiểm tra kỹ hơn
- UI có state rõ cho loading, error, retry
- TTS trigger ⬜ (backend đã trả `tts_text`, frontend chưa trigger)
- FE chạy trên Railway ✅
- BE chạy trên Railway ✅
- smoke test ⬜ (chưa có script)

### Demo outcome

Nhóm có thể demo bản MVP online với luồng hoàn chỉnh, có phương án fallback nếu AI hoặc mạng gặp lỗi trong lúc thuyết trình.

## Sequencing notes

- Sprint 1 không nên cố xây simulation trước khi shared contracts ổn định.
- Sprint 2 chỉ nên mở đúng 4 domain MVP, không mở thêm cộng/trừ/word problem.
- Sprint 3 không dùng để thêm parent/teacher/admin, voice input hay gamification.

### Thực tế sau khi triển khai

- Sprint 1 ✅ hoàn thành: monorepo, auth, MongoDB, topics
- Sprint 2 ✅ hoàn thành: AI lesson, visual, practice, progress
- Sprint 3 🔶 gần hoàn thành: deploy Railway ✅, smoke test ⬜, demo script ⬜, TTS ⬜

### Tính năng ngoài MVP được build thêm
Nhiều tính năng không có trong kế hoạch ban đầu đã được triển khai:
- Payment SePay (thanh toán thực tế)
- Admin Dashboard (quản trị user/payment)
- Google OAuth (đăng nhập xã hội)
- Landing page đầy đủ (marketing)
- Email verification + Forgot/Reset password
- Streaming chat + ChatHistorySidebar
- UsageCounter + UpgradeModal
