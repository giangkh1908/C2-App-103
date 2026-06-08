# Product Backlog

## Nguyên tắc sắp xếp backlog

Backlog được nhóm theo epic để bám sát MVP đã chốt. Thứ tự ưu tiên phản ánh logic build end-to-end: foundation trước, learning flow sau, hardening và deploy cuối cùng.

## Epic 1: Product foundation

| ID | Title | Mô tả ngắn | Priority | Estimate | Dependencies | Sprint |
| --- | --- | --- | --- | --- | --- | --- |
| BL-001 | Monorepo scaffold | Tạo cấu trúc `apps/web`, `apps/api`, `packages/shared` theo ADR | P0 | M | ADR 0006 | Sprint 1 |
| BL-002 | Shared contracts baseline | Tạo shared enums và schema cho `topic`, `visual_type`, lesson response, progress | P0 | L | BL-001 | Sprint 1 |
| BL-003 | Environment setup | Thiết lập biến môi trường cho FE, BE, MongoDB, AI provider | P0 | M | BL-001 | Sprint 1 |
| BL-004 | FE/BE connectivity skeleton | Dựng luồng FE gọi BE thành công với base URL cấu hình được | P0 | M | BL-001, BL-003 | Sprint 1 |

## Epic 2: Student account and onboarding

| ID | Title | Mô tả ngắn | Priority | Estimate | Dependencies | Sprint |
| --- | --- | --- | --- | --- | --- | --- |
| BL-101 | Student register | Hỗ trợ tạo tài khoản đơn giản theo `POST /auth/register` | P0 | M | BL-002, BL-003 | Sprint 1 |
| BL-102 | Student login | Hỗ trợ đăng nhập và lưu session/token cơ bản | P0 | M | BL-101 | Sprint 1 |
| BL-103 | Grade selection flow | Cho học sinh chọn/xác nhận lớp học và lưu trong hồ sơ | P0 | M | BL-101, BL-102 | Sprint 1 |
| BL-104 | Topic list screen | Hiển thị 4 chủ đề MVP từ `GET /topics` | P0 | S | BL-004, BL-103 | Sprint 1 |

## Epic 3: Lesson generation and AI orchestration

| ID | Title | Mô tả ngắn | Priority | Estimate | Dependencies | Sprint |
| --- | --- | --- | --- | --- | --- | --- |
| BL-201 | AI provider adapter | Tạo lớp adapter `provider-agnostic`, cho phép implement OpenAI trước | P0 | L | BL-002, BL-003 | Sprint 2 |
| BL-202 | `/lessons/generate` API | Sinh lesson theo structured format cho 4 domain | P0 | L | BL-201, BL-203 | Sprint 2 |
| BL-203 | Lesson schema validation | Validate `topic`, `grade`, `visual_type`, lesson shape và logic cơ bản | P0 | L | BL-002 | Sprint 2 |
| BL-204 | Retry-safe lesson flow | Xử lý lỗi AI, fallback message và logging cho lesson generation | P1 | M | BL-202, BL-203 | Sprint 2 |

## Epic 4: Visual Card and Mini Simulation

| ID | Title | Mô tả ngắn | Priority | Estimate | Dependencies | Sprint |
| --- | --- | --- | --- | --- | --- | --- |
| BL-301 | Visual Card renderer | Render title, explanation, example, visual, practice prompt từ lesson JSON | P0 | L | BL-002, BL-202 | Sprint 2 |
| BL-302 | Simulation mapping | Map 4 domain và 5 `visual_type` vào các simulation component | P0 | L | BL-301 | Sprint 2 |
| BL-303 | Domain simulations | Xây mini simulation cho `equal_groups`, `sharing`, `fraction_pizza`, `perimeter_path`, `area_grid` | P0 | XL | BL-302 | Sprint 2 |
| BL-304 | TTS trigger from UI | Thêm nút nghe nội dung và trigger `tts_text` từ UI | P1 | M | BL-301 | Sprint 3 |

## Epic 5: Practice and progress

| ID | Title | Mô tả ngắn | Priority | Estimate | Dependencies | Sprint |
| --- | --- | --- | --- | --- | --- | --- |
| BL-401 | `/practice/submit` API | Nhận đáp án, trả đúng/sai, explanation, retry hint | P0 | M | BL-002, BL-202 | Sprint 2 |
| BL-402 | Progress persistence | Lưu `topics_learned`, `correct_answers`, `incorrect_answers`, `last_learned_at` | P0 | M | BL-401, BL-102 | Sprint 2 |
| BL-403 | Result and retry flow | UI phản hồi đúng/sai và cho phép ôn lại hoặc học tiếp | P0 | M | BL-401, BL-301 | Sprint 2 |
| BL-404 | Progress view | Hiển thị tiến độ cơ bản ở home hoặc result screen | P1 | S | BL-402 | Sprint 3 |

## Epic 6: Hardening and deployment

| ID | Title | Mô tả ngắn | Priority | Estimate | Dependencies | Sprint |
| --- | --- | --- | --- | --- | --- | --- |
| BL-501 | Guardrail tightening | Rà và siết guardrail theo grade/domain, tránh drift ngoài scope | P0 | M | BL-202, BL-203 | Sprint 3 |
| BL-502 | Error and retry states | Thêm UI/BE handling cho lỗi AI, lỗi network, retry flow | P0 | M | BL-204, BL-403 | Sprint 3 |
| BL-503 | End-to-end smoke flow | Kiểm tra full flow đăng nhập → học → nộp bài → lưu progress | P0 | M | BL-402, BL-502 | Sprint 3 |
| BL-504 | Frontend deploy to Vercel | Deploy FE lên Vercel với env/config hoàn chỉnh | P0 | M | BL-503 | Sprint 3 |
| BL-505 | Backend deploy to VPS | Deploy backend lên VPS với reverse proxy, SSL, process runtime | P0 | L | BL-503 | Sprint 3 |
| BL-506 | Demo readiness checklist | Chuẩn bị flow demo, data mẫu, fallback plan | P1 | M | BL-504, BL-505 | Sprint 3 |

## Ghi chú về task lớn

Hai backlog item có nguy cơ thành quá lớn nếu không tách ở `tasks/`:

- `BL-303` Domain simulations
- `BL-202` `/lessons/generate` API

Trong tầng `tasks/`, hai item này phải được chia tiếp thành nhiều task `S/M` để nhóm triển khai song song được.
