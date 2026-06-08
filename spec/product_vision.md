# Product Vision

## Vấn đề

Học sinh tiểu học thường nhớ phép tính hoặc công thức nhưng chưa hiểu bản chất khái niệm. Với các chủ đề như phép nhân, phép chia, phân số, chu vi và diện tích, cách giải thích thuần chữ hoặc chỉ đưa đáp án khiến các em khó liên hệ với đồ vật quen thuộc và khó tự thao tác để hiểu.

Khoảng trống lớn nhất không phải là thiếu bài tập, mà là thiếu một cách giải thích phù hợp với cách trẻ nhìn thế giới: ít chữ, nhiều hình, có ví dụ gần gũi và có phản hồi ngay khi làm sai.

## Insight

Toán ở bậc tiểu học nên bắt đầu từ hình ảnh, đồ vật và thao tác trực quan trước khi đi tới công thức. Vì vậy MVP không nên là chatbot văn bản thuần túy, mà là một AI visual tutor biết chuyển câu hỏi thành:

- lời giải thích ngắn, dễ hiểu
- ví dụ đời sống gần gũi
- Visual Card có cấu trúc
- Mini Simulation cho học sinh thao tác
- một câu luyện tập có phản hồi tức thì

## Đối tượng người dùng

Vision của sản phẩm hướng tới học sinh tiểu học lớp 1-5. Tuy nhiên persona chính và nhóm phù hợp nhất để demo MVP là học sinh lớp 2-4 vì các em đã bắt đầu đọc hiểu tốt hơn và học các khái niệm dễ trực quan hóa.

Quy ước dùng trong bộ spec:

- phạm vi sản phẩm: lớp 1-5
- persona chính và ví dụ MVP: lớp 2-4
- nội dung AI phải điều chỉnh theo lớp đã chọn của học sinh

## Định vị sản phẩm

Sản phẩm được định vị là web app AI giúp học sinh hiểu Toán bằng cách nhìn, chạm, thử và nghe giải thích, thay vì chỉ xem đáp án.

Tuyên ngôn cốt lõi:

> AI không làm bài thay học sinh. AI giúp học sinh hiểu bản chất khái niệm Toán qua Visual Card và Mini Simulation.

MVP cũng chốt rõ hai quyết định sản phẩm:

- không dùng AI-generated image tự do làm đầu ra chính
- dùng component-based visualization, nơi AI trả về structured JSON và frontend render bằng component cố định

## Giá trị khác biệt

So với một ứng dụng luyện bài tập thông thường, sản phẩm khác ở 5 điểm:

- giải thích trực quan trước khi yêu cầu trả lời
- gắn ví dụ với đồ vật quen thuộc như táo, kẹo, pizza, ô vuông
- cho học sinh thao tác với Mini Simulation thay vì chỉ đọc
- giải thích lại khi học sinh trả lời sai
- có nút Text-to-Speech để đọc nội dung cho học sinh

## MVP Summary

MVP cân bằng giữa learning flow và product foundation cơ bản. Hệ thống vẫn có đăng ký, đăng nhập, chọn lớp và lưu tiến độ nhẹ, nhưng trọng tâm là luồng học:

1. Học sinh đăng nhập hoặc tạo tài khoản đơn giản.
2. Học sinh chọn lớp và chọn một chủ đề.
3. Học sinh đặt câu hỏi hoặc mở bài học mẫu.
4. AI trả về Visual Card bằng structured JSON.
5. Frontend render hình minh họa và Mini Simulation.
6. Học sinh làm một câu luyện tập.
7. Hệ thống phản hồi đúng/sai, giải thích lại nếu cần và lưu tiến độ cơ bản.

Phạm vi chủ đề của MVP chỉ gồm 4 domain:

- `multiplication`
- `division`
- `fraction_basic`
- `perimeter_area_basic`

Ngoài phạm vi MVP:

- dashboard phụ huynh hoặc giáo viên
- voice input hoặc voice chat realtime
- game hóa phức tạp
- AI-generated free-form images
- mở toàn bộ chương trình Toán tiểu học ngay từ bản đầu
