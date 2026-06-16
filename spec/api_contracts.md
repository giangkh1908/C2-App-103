# API Contracts

## Mục tiêu

Tài liệu này mô tả các contract mức sản phẩm đủ để build MVP. Đây không phải OpenAPI đầy đủ, mà là bộ interface tối thiểu để frontend, backend và AI layer thống nhất cách làm việc.

## Shared enums

### Topic enum

- `multiplication`
- `division`
- `fraction_basic`
- `perimeter_area_basic`

### Visual type enum

- `equal_groups`
- `sharing`
- `fraction_pizza`
- `perimeter_path`
- `area_grid`

Backend chỉ chấp nhận visual type nằm trong enum này.

## `POST /auth/register`

### Purpose

Tạo tài khoản học sinh đơn giản cho MVP.

### Request

```json
{
  "display_name": "Minh",
  "username": "minh123",
  "password": "plain-text-from-ui",
  "grade": 3
}
```

### Response

```json
{
  "user_id": "user_001",
  "display_name": "Minh",
  "grade": 3,
  "role": "student"
}
```

## `POST /auth/login`

### Purpose

Xác thực học sinh và trả về thông tin hồ sơ tối thiểu để bắt đầu phiên học.

### Request

```json
{
  "username": "minh123",
  "password": "plain-text-from-ui"
}
```

### Response

```json
{
  "user_id": "user_001",
  "display_name": "Minh",
  "grade": 3,
  "role": "student",
  "accessToken": "jwt-access-token"
}
```

Refresh tokens are delivered only via an `httpOnly` `refresh_token` cookie scoped to auth
endpoints. Frontend code must not store access or refresh tokens in `localStorage`.

## `GET /topics`

### Purpose

Trả về danh sách chủ đề thuộc MVP để frontend render màn hình chọn chủ đề.

### Response

```json
{
  "topics": [
    {
      "id": "multiplication",
      "label": "Phép nhân"
    },
    {
      "id": "division",
      "label": "Phép chia"
    },
    {
      "id": "fraction_basic",
      "label": "Phân số cơ bản"
    },
    {
      "id": "perimeter_area_basic",
      "label": "Chu vi và diện tích cơ bản"
    }
  ]
}
```

## `POST /lessons/generate`

### Purpose

Sinh một lesson có cấu trúc để frontend render thành Visual Card và Mini Simulation.

### Request

```json
{
  "user_id": "user_001",
  "grade": 3,
  "topic": "multiplication",
  "prompt": "Con chưa hiểu phép nhân"
}
```

### Response shape

```json
{
  "topic": "multiplication",
  "grade": 3,
  "title": "Phép nhân là gì?",
  "simple_explanation": "Phép nhân là cách cộng nhiều nhóm giống nhau.",
  "real_life_example": "Có 3 đĩa táo, mỗi đĩa có 4 quả.",
  "visual": {
    "visual_type": "equal_groups",
    "object": "apple",
    "groups": 3,
    "items_per_group": 4
  },
  "simulation": {
    "simulation_type": "equal_groups_builder",
    "prompt": "Con thử đếm xem có tất cả bao nhiêu quả táo nhé."
  },
  "practice_question": {
    "question": "Có 3 đĩa táo, mỗi đĩa 4 quả. Có tất cả bao nhiêu quả?",
    "options": ["10", "12", "14"],
    "correct_answer": "12"
  },
  "tts_text": "Phép nhân là cách cộng nhiều nhóm giống nhau. Có 3 đĩa táo, mỗi đĩa có 4 quả."
}
```

### Response rules

- `topic` phải thuộc topic enum
- `grade` phải khớp với hồ sơ hoặc input phiên học
- `visual.visual_type` phải thuộc visual enum
- `visual` phải khớp với domain đã chọn
- `practice_question` chỉ có một câu trong MVP
- `tts_text` là nội dung dành cho Text-to-Speech output

### Validation responsibility

Backend chịu trách nhiệm kiểm tra tính nhất quán cơ bản giữa:

- phép tính và đáp án đúng
- topic và visual type
- nội dung giải thích và dữ liệu visual

## `POST /practice/submit`

### Purpose

Nhận đáp án của học sinh, trả về kết quả chấm và gợi ý học lại nếu cần.

### Request

```json
{
  "user_id": "user_001",
  "topic": "multiplication",
  "question_id": "lesson_001_q1",
  "selected_answer": "10"
}
```

### Response

```json
{
  "is_correct": false,
  "correct_answer": "12",
  "short_explanation": "Có 3 nhóm, mỗi nhóm 4 quả nên 4 + 4 + 4 = 12.",
  "retry_hint": "Con thử đếm lại từng nhóm táo nhé."
}
```

### Response rules

- luôn trả về `is_correct`
- luôn có `short_explanation`
- nếu sai thì phải có `retry_hint`
- lời giải thích phải ngắn, dễ hiểu và phù hợp với `grade`

## `GET /progress`

### Purpose

Lấy tiến độ cơ bản của học sinh để hiển thị ở home hoặc trang kết quả.

### Request

Query theo `user_id` hoặc lấy từ session/token.

### Response

```json
{
  "user_id": "user_001",
  "topics_learned": ["multiplication", "division"],
  "correct_answers": 4,
  "incorrect_answers": 1,
  "last_learned_at": "2026-06-07T21:00:00Z"
}
```

## `POST /progress`

### Purpose

Ghi lại tiến độ tối thiểu sau một lượt học hoặc một lần nộp bài.

### Request

```json
{
  "user_id": "user_001",
  "topic": "multiplication",
  "result": "correct",
  "learned_at": "2026-06-07T21:00:00Z"
}
```

### Response

```json
{
  "status": "ok"
}
```

## Non-contract decisions

Những nội dung sau không phải một phần của contract MVP hiện tại:

- OpenAPI schema đầy đủ cho mọi field
- streaming response
- image generation API
- voice input API
- adaptive recommendation API
- teacher hoặc parent API
