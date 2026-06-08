# Sprint 2 Tasks - Core Learning Flow

## Epic: Lesson generation and AI orchestration

### T2-01

- Linked story: `US-004`, `US-009`
- Task: Tạo AI provider adapter theo hướng `provider-agnostic`
- Owner: `BE-AI`
- Priority: `P0`
- Estimate: `L`
- Dependency: `T1-02`, `T1-03`
- Done criteria: Backend có abstraction gọi AI; implement ban đầu chạy được với một provider mà không khóa contract vào vendor

### T2-02

- Linked story: `US-004`
- Task: Tạo lesson schema validation cho response AI
- Owner: `BE-AI`
- Priority: `P0`
- Estimate: `L`
- Dependency: `T1-02`, `T2-01`
- Done criteria: Validate được các field bắt buộc của lesson response và chặn sai `topic`/`visual_type`

### T2-03

- Linked story: `US-004`, `US-009`
- Task: Xây route `POST /lessons/generate` theo contract MVP
- Owner: `BE-AI`
- Priority: `P0`
- Estimate: `L`
- Dependency: `T2-01`, `T2-02`, `T1-08`
- Done criteria: Route nhận `user_id`, `grade`, `topic`, `prompt`; trả lesson JSON đúng shape

### T2-04

- Linked story: `US-004`
- Task: Thêm logging và fallback response cơ bản cho lỗi lesson generation
- Owner: `BE-AI`
- Priority: `P1`
- Estimate: `M`
- Dependency: `T2-03`
- Done criteria: Khi AI/provider lỗi, backend trả trạng thái lỗi có kiểm soát và log đủ để debug

## Epic: Visual Card and Mini Simulation

### T2-05

- Linked story: `US-004`, `US-005`
- Task: Xây UI nhập prompt hoặc chọn bài học gợi ý để gọi `/lessons/generate`
- Owner: `FE`
- Priority: `P0`
- Estimate: `M`
- Dependency: `T1-12`, `T2-03`
- Done criteria: UI gửi được request lesson generation và xử lý loading state cơ bản

### T2-06

- Linked story: `US-005`
- Task: Xây Visual Card renderer từ lesson JSON
- Owner: `FE`
- Priority: `P0`
- Estimate: `L`
- Dependency: `T1-02`, `T2-03`
- Done criteria: Render đúng `title`, `simple_explanation`, `real_life_example`, `visual`, `practice_question`

### T2-07

- Linked story: `US-005`, `US-006`
- Task: Tạo visual/simulation mapping cho `equal_groups` và `sharing`
- Owner: `FE`
- Priority: `P0`
- Estimate: `M`
- Dependency: `T2-06`
- Done criteria: `multiplication` và `division` có visual/simulation hoạt động cơ bản

### T2-08

- Linked story: `US-005`, `US-006`
- Task: Tạo visual/simulation mapping cho `fraction_pizza`
- Owner: `FE`
- Priority: `P0`
- Estimate: `M`
- Dependency: `T2-06`
- Done criteria: `fraction_basic` có visual và simulation hoạt động cơ bản

### T2-09

- Linked story: `US-005`, `US-006`
- Task: Tạo visual/simulation mapping cho `perimeter_path` và `area_grid`
- Owner: `FE`
- Priority: `P0`
- Estimate: `L`
- Dependency: `T2-06`
- Done criteria: `perimeter_area_basic` có 2 kiểu visual chính hoạt động được

## Epic: Practice and progress

### T2-10

- Linked story: `US-007`
- Task: Xây route `POST /practice/submit`
- Owner: `BE-AI`
- Priority: `P0`
- Estimate: `M`
- Dependency: `T1-02`, `T2-03`
- Done criteria: Route trả `is_correct`, `short_explanation`; khi sai có `retry_hint`

### T2-11

- Linked story: `US-008`
- Task: Xây persistence cho `progress` và `learning_sessions`
- Owner: `BE-AI`
- Priority: `P0`
- Estimate: `M`
- Dependency: `T1-05`, `T2-03`, `T2-10`
- Done criteria: Lưu được lesson snapshot và progress tối thiểu theo spec

### T2-12

- Linked story: `US-007`
- Task: Xây UI nộp đáp án và nhận feedback đúng/sai
- Owner: `FE`
- Priority: `P0`
- Estimate: `M`
- Dependency: `T2-06`, `T2-10`
- Done criteria: Học sinh chọn được đáp án, nộp được và thấy feedback ngay

### T2-13

- Linked story: `US-007`, `US-008`
- Task: Kết nối flow retry/học tiếp với update progress
- Owner: `Full-stack-QA`
- Priority: `P0`
- Estimate: `M`
- Dependency: `T2-11`, `T2-12`
- Done criteria: Sau một lượt làm bài, progress được cập nhật và UI chuyển được sang retry hoặc next step

## Epic: Integration checkpoint

### T2-14

- Linked story: `US-004` đến `US-009`
- Task: Chạy walkthrough tích hợp Sprint 2 cho full learning flow
- Owner: `Full-stack-QA`
- Priority: `P0`
- Estimate: `M`
- Dependency: `T2-03`, `T2-09`, `T2-13`
- Done criteria: Flow chọn topic -> lesson -> visual/simulation -> submit -> progress chạy được cho cả 4 domain
