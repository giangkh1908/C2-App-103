# User Stories

## Quy ước

- Story ID dùng dạng `US-xxx`
- Mỗi story chỉ bám phạm vi MVP hiện tại
- Acceptance criteria ngắn, có thể kiểm tra được

> **Lưu ý**: Trạng thái phản ánh thực tế codebase. US-001 đến US-009 và US-011 đều ✅ Done. US-010 (TTS) ⬜ chưa implement.

## US-001: Đăng ký tài khoản học sinh ✅

Với vai trò là học sinh, em muốn tạo tài khoản đơn giản để hệ thống nhớ thông tin lớp và tiến độ học của em.

### Acceptance criteria

- Hệ thống cho nhập `display_name`, `username`, `password`, `grade`
- Dữ liệu gửi đúng contract `POST /auth/register`
- Sau khi tạo tài khoản thành công, hệ thống trả về `user_id`, `display_name`, `grade`, `role`

## US-002: Đăng nhập và nhớ lớp học ✅

Với vai trò là học sinh, em muốn đăng nhập để tiếp tục học với đúng lớp học đã chọn trước đó.

### Acceptance criteria

- Hệ thống cho đăng nhập bằng `username` và `password`
- Contract `POST /auth/login` trả về token/session hợp lệ
- UI lấy được `grade` từ hồ sơ hoặc cho phép xác nhận lại sau khi vào hệ thống

## US-003: Chọn chủ đề trong phạm vi MVP ✅

Với vai trò là học sinh, em muốn chọn chủ đề Toán từ danh sách ngắn để dễ bắt đầu học.

### Acceptance criteria

- UI chỉ hiển thị 4 topic: `multiplication`, `division`, `fraction_basic`, `perimeter_area_basic`
- Topic list lấy từ `GET /topics`
- Không hiển thị topic ngoài scope MVP

## US-004: Hỏi AI và nhận bài học có cấu trúc ✅

Với vai trò là học sinh, em muốn hỏi AI một câu ngắn để nhận lời giải thích dễ hiểu thay vì đoạn chat dài.

### Acceptance criteria

- UI cho nhập prompt ngắn hoặc chọn bài học gợi ý
- Hệ thống gọi `POST /lessons/generate`
- Response phải có tối thiểu `topic`, `grade`, `title`, `simple_explanation`, `real_life_example`, `visual`, `simulation`, `practice_question`, `tts_text`

## US-005: Xem Visual Card đúng với chủ đề ✅

Với vai trò là học sinh, em muốn nhìn thấy minh họa trực quan đúng với bài học để hiểu nhanh hơn.

### Acceptance criteria

- `multiplication` dùng `equal_groups`
- `division` dùng `sharing`
- `fraction_basic` dùng `fraction_pizza`
- `perimeter_area_basic` dùng `perimeter_path` hoặc `area_grid`
- Frontend render từ enum cố định, không parse free-form text

## US-006: Tương tác với Mini Simulation ✅

Với vai trò là học sinh, em muốn chạm và thử thao tác với khái niệm Toán để hiểu bản chất chứ không chỉ đọc.

### Acceptance criteria

- Mỗi topic MVP có simulation tương ứng
- Simulation nhận dữ liệu từ lesson response
- Simulation không yêu cầu game loop phức tạp hoặc logic ngoài scope domain

## US-007: Nộp câu trả lời và nhận phản hồi ✅

Với vai trò là học sinh, em muốn nộp một câu trả lời để biết ngay mình đúng hay sai.

### Acceptance criteria

- Mỗi lesson chỉ có một câu luyện tập trong MVP
- UI gửi đáp án tới `POST /practice/submit`
- Hệ thống trả về `is_correct`, `short_explanation`
- Nếu sai, hệ thống trả thêm `retry_hint`

## US-008: Thấy tiến độ học cơ bản ✅

Với vai trò là học sinh, em muốn biết mình đã học gì và làm đúng/sai bao nhiêu để có động lực học tiếp.

### Acceptance criteria

- Hệ thống lưu `topics_learned`, `correct_answers`, `incorrect_answers`, `last_learned_at`
- UI có thể đọc progress từ `GET /progress`
- Progress chỉ ở mức cơ bản, không bao gồm dashboard phức tạp

## US-009: Nhận nội dung phù hợp với lớp học ✅

Với vai trò là học sinh, em muốn lời giải thích phù hợp với lớp của em để không bị quá khó hoặc quá dài.

### Acceptance criteria

- Lesson generation luôn nhận `grade`
- Backend kiểm tra `topic` và `grade` trước khi gọi AI
- Nội dung ngoài scope domain/grade bị chặn hoặc điều chỉnh lại

## US-010: Nghe nội dung học bằng giọng đọc ⬜

Với vai trò là học sinh, em muốn bấm nghe lời giải thích để dễ tiếp cận hơn khi chưa muốn đọc nhiều chữ.

### Acceptance criteria

- UI có action dùng `tts_text`
- Voice trong MVP chỉ là `Text-to-Speech output`
- Không có voice input hoặc voice chat realtime

## US-011: Hệ thống có thể deploy FE và BE độc lập ✅

Với vai trò là nhóm triển khai, chúng tôi muốn deploy frontend và backend độc lập để phù hợp kiến trúc và target vận hành của MVP.

### Acceptance criteria

- FE deploy được lên `Vercel`
- BE deploy được lên `VPS`
- FE gọi BE qua base URL cấu hình được
- Secrets không nằm ở frontend
