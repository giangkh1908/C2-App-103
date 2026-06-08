# ADR 0005: Data Store And Progress Model

## Status

Accepted

## Context

MVP cần lưu:

- hồ sơ học sinh
- lesson/session đã sinh
- progress cơ bản theo topic

`brainstorm.md` ban đầu mở giữa PostgreSQL và MongoDB, còn bộ plan đã chốt `MongoDB`. Dữ liệu lesson có phần JSON lồng nhau và scope MVP hiện còn gọn, ít quan hệ phức tạp.

## Decision

MVP dùng `MongoDB` làm data store chính.

Các collection mức MVP:

- `users`
- `learning_sessions`
- `progress`

Nguyên tắc dữ liệu:

- `grade` là thuộc tính hồ sơ chính thức của user
- `learning_sessions` có thể lưu snapshot `ai_response` để debug, audit nhẹ và replay UI
- `progress` chỉ lưu mức nhẹ, đủ cho MVP:
  - `topics_learned`
  - `correct_answers`
  - `incorrect_answers`
  - `last_learned_at`

`topic` trong progress và session phải dùng cùng enum đã chốt trong spec.

## Consequences

- Phù hợp với lesson/session response có JSON lồng nhau và thay đổi vừa phải trong giai đoạn đầu.
- Tốc độ phát triển MVP nhanh hơn so với việc tối ưu schema quan hệ từ đầu.
- Dễ lưu cả request context và AI response snapshot trong cùng document/session record.

Chi phí phải chấp nhận:

- Cần kỷ luật tốt về schema ở application layer vì database linh hoạt hơn.
- Nếu sau này reporting hoặc analytics phức tạp hơn, có thể cần tái cấu trúc hoặc thêm tầng phân tích riêng.

## Alternatives considered

### PostgreSQL

Không chọn ở MVP vì:

- dữ liệu hiện tại chưa có quan hệ đủ phức tạp để buộc dùng relational model
- lesson response và session payload lồng nhau hợp hơn với document store
- mục tiêu hiện tại là tốc độ phát triển và tính linh hoạt

### Tách thêm nhiều collection như `topics`, `questions`, `answers`

Không chọn ở MVP vì:

- spec hiện tại chưa cần độ chi tiết đó
- dễ làm schema nặng hơn trước khi có nhu cầu thật
- progress và session hiện đã đủ bao phủ luồng học chính
