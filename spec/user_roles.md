# User Roles

## MVP Role

MVP chỉ đặc tả một role chính thức: `student`.

Các vai trò `parent`, `teacher`, `admin` không thuộc MVP hiện tại. Chúng chỉ được xem là hướng mở rộng sau khi luồng học sinh hoạt động ổn định.

## Role: Student

### Mục tiêu

Học sinh dùng hệ thống để:

- hiểu khái niệm Toán bằng cách giải thích ngắn và trực quan
- thấy ví dụ gắn với đời sống quen thuộc
- thao tác với mô phỏng nhỏ để hiểu bản chất
- làm một câu luyện tập và biết ngay đúng hay sai
- được giải thích lại bằng cách dễ hơn khi chưa hiểu

### Pain Points

Những khó khăn chính của học sinh trong scope MVP:

- dễ nản khi chỉ thấy công thức hoặc đoạn văn dài
- khó hiểu các khái niệm trừu tượng nếu không có hình minh họa
- dễ mất tập trung khi giao diện có quá nhiều bước hoặc quá nhiều chữ
- cần phản hồi tích cực khi trả lời sai
- cần nội dung phù hợp với độ tuổi và lớp học

### Hành vi sử dụng trong MVP

Luồng sử dụng điển hình của student:

1. Đăng ký hoặc đăng nhập bằng tài khoản đơn giản.
2. Chọn lớp học hiện tại.
3. Chọn một chủ đề trong danh sách MVP.
4. Nhập câu hỏi ngắn hoặc chọn bài học gợi ý.
5. Xem Visual Card.
6. Tương tác với Mini Simulation.
7. Trả lời một câu luyện tập.
8. Nhận phản hồi và tiếp tục học hoặc ôn lại.

### Accessibility cơ bản

Role student yêu cầu các hỗ trợ cơ bản sau:

- nút lớn, dễ bấm trên màn hình cảm ứng hoặc chuột
- ít chữ, câu ngắn, dùng từ đơn giản
- icon và hình minh họa rõ nghĩa
- Text-to-Speech để đọc lời giải thích, câu hỏi và phản hồi
- một màn hình chỉ tập trung vào một nhiệm vụ chính

MVP không bao gồm voice input hoặc nhận diện giọng nói trẻ em.

### Dữ liệu tối thiểu lưu cho mỗi học sinh

Hệ thống chỉ cần lưu tập dữ liệu nhẹ để hỗ trợ cá nhân hóa cơ bản:

- `id`
- `display_name`
- `username`
- `password_hash`
- `grade`
- `role = student`
- `topics_learned`
- `correct_answers`
- `incorrect_answers`
- `last_learned_at`

### Grade Selection

`grade selection` là một thuộc tính hồ sơ của học sinh, không chỉ là lựa chọn UI tạm thời. Giá trị này được dùng để:

- lọc mức độ khó phù hợp
- điều chỉnh ngôn ngữ giải thích
- điều chỉnh ví dụ đời sống
- giới hạn nội dung vượt quá phạm vi lớp học

Trong toàn bộ MVP, AI phải nhận `grade` như một tham số đầu vào khi sinh bài học hoặc phản hồi.
