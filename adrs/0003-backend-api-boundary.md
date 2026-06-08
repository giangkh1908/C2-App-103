# ADR 0003: Backend API Boundary

## Status

Accepted

## Context

MVP cần một lớp điều phối duy nhất để kết nối frontend, data store và AI provider. Theo `spec/api_contracts.md`, bộ interface tối thiểu của hệ thống gồm:

- `POST /auth/register`
- `POST /auth/login`
- `GET /topics`
- `POST /lessons/generate`
- `POST /practice/submit`
- `GET /progress`
- `POST /progress`

Ngoài ra backend còn phải chịu trách nhiệm validation `topic`, `grade`, `visual_type` và logic phép tính cơ bản.

## Decision

Backend là lớp điều phối duy nhất giữa frontend, data store và LLM. Backend chịu trách nhiệm:

- nhận request từ frontend
- xác thực `student`
- kiểm tra `topic` và `grade` hợp lệ
- gọi AI provider adapter
- validate lesson JSON và logic cơ bản
- lưu `learning_sessions` và `progress`

Shared contracts bắt buộc:

- `topic` chỉ gồm `multiplication`, `division`, `fraction_basic`, `perimeter_area_basic`
- `visual_type` chỉ gồm `equal_groups`, `sharing`, `fraction_pizza`, `perimeter_path`, `area_grid`
- lesson response tối thiểu phải có:
  - `topic`
  - `grade`
  - `title`
  - `simple_explanation`
  - `real_life_example`
  - `visual`
  - `simulation`
  - `practice_question`
  - `tts_text`

Frontend không được tự kiểm tra nghiệp vụ thay backend. Frontend có thể kiểm tra UI-level errors, nhưng validation domain và contract thuộc về backend.

## Consequences

- API trở thành nguồn sự thật duy nhất cho lesson generation và progress tracking.
- Backend có thể chặn dữ liệu AI sai hoặc lệch domain trước khi UI render.
- Logging và debugging đơn giản hơn vì mọi lesson generation đi qua một boundary thống nhất.
- Sau MVP, có thể thêm provider khác hoặc domain mới mà không đổi bản chất frontend.

Chi phí phải chấp nhận:

- Cần thêm lớp schema validation và mapping ở backend.
- Tốc độ response phụ thuộc vào cả backend và AI provider.

## Alternatives considered

### Đẩy validation nghiệp vụ sang frontend

Không chọn vì:

- frontend không nên là nơi quyết định truth của domain
- dễ tạo lệch logic giữa các client
- khó bảo vệ trước dữ liệu AI không hợp lệ

### Cho AI provider trả dữ liệu thẳng về UI

Không chọn vì:

- không có lớp guardrail và validation ổn định
- khó logging, retry và debug
- làm secrets và provider coupling đi vào client layer
