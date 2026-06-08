# Tasks

## Mục tiêu

Thư mục `tasks/` chứa breakdown chi tiết để đội triển khai thực hiện theo từng sprint. Nếu `planning/` trả lời câu hỏi “xây cái gì và theo thứ tự nào”, thì `tasks/` trả lời “mỗi sprint cần làm những đầu việc nào”.

## Quy ước task

- Task ID dùng dạng `T1-xx`, `T2-xx`, `T3-xx` theo sprint
- Mỗi task phải gắn ít nhất một `linked story`
- Mỗi task có:
  - `owner`
  - `priority`
  - `estimate`
  - `dependency`
  - `done criteria`

## Owner roles

- `FE`
- `BE-AI`
- `Full-stack-QA`

## Mapping tài liệu

- `planning/user_stories.md` là nguồn truth cho user stories
- `planning/sprint_plan.md` là nguồn truth cho sequencing sprint
- `spec/api_contracts.md` và `packages/shared` là nguồn truth cho shared contracts khi implement

## Nguyên tắc breakdown

- ưu tiên task ở mức `S/M`
- nếu phát hiện task `XL`, phải tách tiếp
- không tạo task ngoài scope MVP đã chốt
