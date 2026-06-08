# Sprint 1 Tasks - Foundation

## Epic: Product foundation

### T1-01

- Linked story: `US-011`
- Task: Dựng monorepo skeleton với `apps/web`, `apps/api`, `packages/shared`
- Owner: `Full-stack-QA`
- Priority: `P0`
- Estimate: `M`
- Dependency: none
- Done criteria: Cấu trúc thư mục đúng ADR 0006; FE, BE và shared package có thể được import/khởi động ở mức skeleton

### T1-02

- Linked story: `US-011`
- Task: Khởi tạo shared contracts đầu tiên cho `Topic enum`, `Visual type enum`, `Lesson response shape`, `Progress shape`
- Owner: `Full-stack-QA`
- Priority: `P0`
- Estimate: `L`
- Dependency: `T1-01`
- Done criteria: Shared package xuất được enums/shapes khớp `spec/api_contracts.md`

### T1-03

- Linked story: `US-011`
- Task: Thiết lập environment variables mẫu cho FE, BE, MongoDB và AI provider
- Owner: `BE-AI`
- Priority: `P0`
- Estimate: `M`
- Dependency: `T1-01`
- Done criteria: Có danh sách env cần thiết; FE và BE đọc được config từ environment

### T1-04

- Linked story: `US-011`
- Task: Dựng skeleton FE gọi thử BE bằng base URL cấu hình được
- Owner: `FE`
- Priority: `P0`
- Estimate: `M`
- Dependency: `T1-01`, `T1-03`
- Done criteria: FE gửi được request thử tới BE và hiển thị trạng thái thành công/thất bại

### T1-05

- Linked story: `US-011`
- Task: Thiết lập MongoDB connection và cấu trúc collection mức cơ bản
- Owner: `BE-AI`
- Priority: `P0`
- Estimate: `M`
- Dependency: `T1-03`
- Done criteria: Backend kết nối được MongoDB; chuẩn bị được `users`, `learning_sessions`, `progress`

## Epic: Student account and onboarding

### T1-06

- Linked story: `US-001`
- Task: Xây route `POST /auth/register` theo contract đã chốt
- Owner: `BE-AI`
- Priority: `P0`
- Estimate: `M`
- Dependency: `T1-02`, `T1-05`
- Done criteria: Route nhận đúng payload, tạo user và trả response đúng shape

### T1-07

- Linked story: `US-001`
- Task: Xây UI form đăng ký đơn giản cho học sinh
- Owner: `FE`
- Priority: `P0`
- Estimate: `M`
- Dependency: `T1-04`, `T1-06`
- Done criteria: UI cho nhập `display_name`, `username`, `password`, `grade`; submit thành công tới backend

### T1-08

- Linked story: `US-002`
- Task: Xây route `POST /auth/login` và session/token response tối thiểu
- Owner: `BE-AI`
- Priority: `P0`
- Estimate: `M`
- Dependency: `T1-06`
- Done criteria: Route login thành công với account hợp lệ; response có `user_id`, `grade`, `role`, `token`

### T1-09

- Linked story: `US-002`
- Task: Xây UI đăng nhập và lưu session/token ở mức MVP
- Owner: `FE`
- Priority: `P0`
- Estimate: `M`
- Dependency: `T1-08`
- Done criteria: Học sinh đăng nhập được và UI giữ trạng thái vào app

### T1-10

- Linked story: `US-002`, `US-009`
- Task: Tạo flow chọn hoặc xác nhận `grade` sau khi đăng nhập
- Owner: `FE`
- Priority: `P0`
- Estimate: `M`
- Dependency: `T1-09`
- Done criteria: UI cho chọn/xác nhận lớp; giá trị `grade` được lưu vào state hồ sơ hiện tại

### T1-11

- Linked story: `US-003`
- Task: Xây route `GET /topics` chỉ trả 4 topic MVP
- Owner: `BE-AI`
- Priority: `P0`
- Estimate: `S`
- Dependency: `T1-02`
- Done criteria: Route trả đúng 4 topic với label phù hợp

### T1-12

- Linked story: `US-003`
- Task: Xây màn hình chọn chủ đề lấy dữ liệu từ `GET /topics`
- Owner: `FE`
- Priority: `P0`
- Estimate: `S`
- Dependency: `T1-11`, `T1-10`
- Done criteria: UI hiển thị đúng 4 chủ đề và điều hướng được sang bước học tiếp theo

## Epic: Integration checkpoint

### T1-13

- Linked story: `US-001`, `US-002`, `US-003`, `US-011`
- Task: Chạy walkthrough tích hợp Sprint 1
- Owner: `Full-stack-QA`
- Priority: `P0`
- Estimate: `M`
- Dependency: `T1-07`, `T1-09`, `T1-12`
- Done criteria: Walkthrough pass cho flow register/login/grade/topic; ghi lại lỗi tích hợp cần chuyển sang Sprint 2 nếu có
