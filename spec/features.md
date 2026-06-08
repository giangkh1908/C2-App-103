# Features

## Core MVP Journey

MVP được thiết kế theo một user journey rõ ràng thay vì tập hợp nhiều tính năng rời rạc.

### 1. Đăng ký và đăng nhập đơn giản

Học sinh có thể tạo tài khoản bằng tên hiển thị, username, mật khẩu và lớp học. Đăng nhập chỉ nhằm lưu lại lớp đã chọn và tiến độ cơ bản, không nhằm xây hệ thống tài khoản phức tạp.

### 2. Chọn lớp

Sau khi vào hệ thống, học sinh chọn hoặc xác nhận lớp hiện tại. Giá trị này được dùng để điều chỉnh nội dung AI và là dữ liệu hồ sơ chính thức.

### 3. Chọn chủ đề

Màn hình chủ đề chỉ hiển thị 4 chủ đề MVP:

- `multiplication`
- `division`
- `fraction_basic`
- `perimeter_area_basic`

### 4. Hỏi AI hoặc vào bài học mẫu

Học sinh có thể:

- nhập một câu hỏi ngắn như “Con chưa hiểu phép nhân”
- hoặc bấm vào một bài học gợi ý theo chủ đề

Ở bước này, hệ thống phải luôn dẫn tới một lesson có cấu trúc thay vì trả về đoạn chat dài.

### 5. Nhận Visual Card

AI trả về bài học dưới dạng structured JSON để frontend render thành Visual Card, gồm:

- tiêu đề bài học
- lời giải thích ngắn
- ví dụ đời sống
- visual tương ứng với domain
- nội dung đọc bằng TTS

### 6. Tương tác Mini Simulation

Sau phần giải thích, học sinh thao tác với mô phỏng nhỏ tương ứng với domain. Mục tiêu là chạm, thử và quan sát thay đổi để hiểu khái niệm, không phải chơi game phức tạp.

### 7. Làm 1 câu luyện tập

Mỗi lesson trong MVP chỉ yêu cầu một câu luyện tập ngắn để kiểm tra hiểu bài ngay sau khi học.

### 8. Nhận phản hồi và giải thích lại

Hệ thống phải trả về:

- đúng hoặc sai
- một lời giải thích ngắn
- một gợi ý học lại nếu học sinh trả lời sai

Nếu sai, hệ thống ưu tiên giải thích lại bằng cách đơn giản hơn thay vì chỉ lặp lại đáp án.

### 9. Lưu tiến độ cơ bản

Sau mỗi lượt học, hệ thống lưu mức tiến độ nhẹ:

- chủ đề đã học
- số câu đúng
- số câu sai
- lần học gần nhất

## Core MVP

Các năng lực bắt buộc để MVP có thể build và demo:

- auth đơn giản cho học sinh
- chọn lớp và chọn chủ đề
- AI lesson generation theo structured JSON
- Visual Card render theo visual enum cố định
- Mini Simulation cho 4 domain
- một câu luyện tập cho mỗi lesson
- phản hồi đúng/sai và giải thích lại
- Text-to-Speech output cho nội dung học
- lưu tiến độ cơ bản
- guardrail nội dung theo độ tuổi và lớp học

## Supporting MVP

Các năng lực hỗ trợ nhưng vẫn thuộc MVP:

- bài học gợi ý theo từng chủ đề
- thông điệp khích lệ khi học sinh trả lời sai
- điều hướng học tiếp hoặc ôn lại sau một lượt học
- validation backend để tránh visual lệch với phép tính cơ bản

## Explicitly Out Of Scope

Những phần sau không thuộc MVP hiện tại:

- voice input hoặc voice chat realtime
- dashboard phụ huynh
- dashboard giáo viên
- dashboard admin
- gamification phức tạp như level, quest, economy
- AI-generated free-form images
- chấm bài tự luận phức tạp
- adaptive learning hoàn chỉnh
- mở rộng sang toàn bộ chương trình Toán tiểu học

## Non-goals cần giữ rõ

MVP không cố gắng thay giáo viên hoặc làm toàn bộ ứng dụng học tập. Bản đầu chỉ cần chứng minh 3 điều:

- AI có thể giải thích Toán bằng format trực quan, có cấu trúc
- trẻ có thể hiểu tốt hơn nhờ Visual Card và Mini Simulation
- product foundation cơ bản đủ để lưu lại trải nghiệm học và demo end-to-end

## Voice policy

Voice trong MVP chỉ là `Text-to-Speech output only`.

Điều này có nghĩa:

- hệ thống có thể đọc lời giải thích
- hệ thống có thể đọc câu hỏi luyện tập
- hệ thống có thể đọc phản hồi đúng/sai

MVP không xử lý giọng nói đầu vào từ học sinh.
