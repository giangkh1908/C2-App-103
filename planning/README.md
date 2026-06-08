# Planning

## Mục tiêu

Thư mục `planning/` chứa kế hoạch tổng hợp để triển khai MVP Bạn Học Toán AI theo đúng `spec/` và `adrs/`. Đây là tầng định hướng thực thi: backlog, user stories, sprint plan, ưu tiên, ước lượng và release criteria.

## Cách đọc bộ planning

Thứ tự đọc khuyến nghị:

1. `spec/` để hiểu phạm vi MVP, role, domain và API contracts
2. `adrs/` để hiểu các quyết định kiến trúc đã khóa
3. `planning/product_backlog.md` để xem toàn cảnh công việc
4. `planning/sprint_plan.md` để hiểu sequencing 3 sprint
5. `planning/user_stories.md` để map giá trị người dùng với công việc build
6. `planning/release_plan.md` để biết điều kiện hoàn thành MVP
7. `tasks/` để vào đầu việc triển khai chi tiết

## Giả định team

Planning này giả định một nhóm 3 người:

- `FE`: phụ trách giao diện, Visual Card, Mini Simulation, TTS trigger
- `BE-AI`: phụ trách backend API, MongoDB, AI adapter, validation
- `Full-stack-QA`: phụ trách shared contracts, integration, smoke test, deploy, demo readiness

## Quy ước ưu tiên và ước lượng

- Priority:
  - `P0`: bắt buộc để MVP chạy end-to-end
  - `P1`: quan trọng để MVP usable và demo tốt
  - `P2`: nice-to-have trong phạm vi MVP
- Estimate:
  - `S`: nhỏ, ít phụ thuộc
  - `M`: vừa, có 1-2 dependency
  - `L`: phức tạp hơn, cần phối hợp liên vai trò
  - `XL`: quá lớn, nên tách thành task nhỏ hơn

## Phạm vi planning

Planning này chỉ bao phủ MVP hiện tại:

- role `student`
- 4 domain `multiplication`, `division`, `fraction_basic`, `perimeter_area_basic`
- frontend `Next.js`
- backend API riêng
- AI `structured JSON`
- database `MongoDB`
- deploy `frontend = Vercel`, `backend = VPS`

Ngoài phạm vi:

- parent/teacher/admin flows
- voice input
- AI-generated free-form images
- gamification phức tạp
- adaptive learning hoàn chỉnh
