# Learning Domains

## Domain scope của MVP

MVP chỉ hỗ trợ 4 domain học tập:

- `multiplication`
- `division`
- `fraction_basic`
- `perimeter_area_basic`

Các domain như cộng, trừ và bài toán có lời văn không thuộc scope MVP hiện tại. Chúng có thể xuất hiện ở roadmap sau MVP.

## Domain: `multiplication`

### Learning goal

Giúp học sinh hiểu phép nhân là cộng nhiều nhóm bằng nhau, không chỉ nhớ kết quả.

### Concept explanation style

- giải thích bằng nhóm đồ vật giống nhau
- dùng câu ngắn, tránh định nghĩa trừu tượng
- ưu tiên ví dụ như đĩa táo, hộp bút, hàng đồ vật

### Allowed visual component

- `equal_groups`

### Allowed simulation pattern

- thêm hoặc bớt nhóm
- đếm tổng số đồ vật từ nhiều nhóm bằng nhau
- thay đổi số nhóm hoặc số phần tử mỗi nhóm trong giới hạn nhỏ

### Practice question shape

- một câu trắc nghiệm ngắn
- đầu vào là số nhóm và số phần tử mỗi nhóm
- đầu ra là tổng số đồ vật

### Guardrail giới hạn độ khó

- chỉ dùng số nhỏ, phù hợp tiểu học
- không dùng phép nhân nhiều bước
- không chuyển sang bài toán có lời văn phức tạp
- luôn giải thích lại bằng phép cộng lặp khi học sinh sai

## Domain: `division`

### Learning goal

Giúp học sinh hiểu phép chia là chia đều thành các nhóm bằng nhau.

### Concept explanation style

- mô tả hành động chia đồ vật cho nhiều bạn
- nhấn mạnh sự công bằng và bằng nhau giữa các nhóm
- ưu tiên ví dụ như kẹo, bút, đồ chơi

### Allowed visual component

- `sharing`

### Allowed simulation pattern

- kéo đồ vật vào từng nhóm hoặc từng bạn
- bấm nút chia đều
- quan sát hệ thống phân phối từng phần tử

### Practice question shape

- một câu trắc nghiệm ngắn
- đầu vào là tổng số đồ vật và số nhóm
- đầu ra là số đồ vật mỗi nhóm nhận được

### Guardrail giới hạn độ khó

- chỉ dùng phép chia hết trong MVP
- không dạy số dư ở bản đầu
- không yêu cầu suy luận nhiều bước
- nếu học sinh sai, AI phải giải thích lại bằng cách chia từng món một

## Domain: `fraction_basic`

### Learning goal

Giúp học sinh hiểu phân số cơ bản là một hoặc vài phần trong tổng số phần bằng nhau.

### Concept explanation style

- bắt đầu từ vật tròn hoặc vật dễ chia phần như pizza, bánh, thanh sô-cô-la
- nhấn mạnh tử số là số phần được lấy, mẫu số là tổng số phần bằng nhau
- giữ ngôn ngữ ngắn và trực tiếp

### Allowed visual component

- `fraction_pizza`

### Allowed simulation pattern

- tô màu một số phần
- thay đổi số phần bằng nhau trong giới hạn đơn giản
- chọn hình phù hợp với phân số đã cho

### Practice question shape

- một câu trắc nghiệm ngắn
- đầu vào là hình chia phần hoặc mô tả chia phần đơn giản
- đầu ra là phân số tương ứng hoặc số phần được tô

### Guardrail giới hạn độ khó

- chỉ dùng phân số đơn giản, trực quan
- không dạy quy đồng, cộng trừ phân số
- không dùng hình quá nhiều phần nhỏ gây rối
- nếu học sinh sai, AI phải nhắc lại khái niệm phần bằng nhau

## Domain: `perimeter_area_basic`

### Learning goal

Giúp học sinh phân biệt:

- chu vi là đường bao quanh hình
- diện tích là phần mặt bên trong hình

### Concept explanation style

- giải thích chu vi bằng đường đi quanh cạnh
- giải thích diện tích bằng đếm ô vuông phủ kín bên trong
- ưu tiên hình chữ nhật hoặc hình đơn giản

### Allowed visual component

- `perimeter_path`
- `area_grid`

### Allowed simulation pattern

- bấm hoặc kéo theo từng cạnh để tính chu vi
- tô hoặc đếm từng ô vuông để hiểu diện tích
- thay đổi số hàng và số cột trong giới hạn dễ theo dõi

### Practice question shape

- một câu trắc nghiệm ngắn
- hoặc hỏi tổng độ dài các cạnh
- hoặc hỏi số ô vuông bên trong hình

### Guardrail giới hạn độ khó

- chỉ dùng hình đơn giản
- không dùng đổi đơn vị phức tạp
- không trộn chu vi và diện tích trong cùng một câu nếu chưa có nhắc lại
- nếu học sinh sai, AI phải chỉ rõ em đang nhầm “bao quanh” với “bên trong” hay ngược lại

## Quy tắc chung cho mọi domain

- chỉ dùng visual type nằm trong enum cố định của MVP
- mọi nội dung phải tương thích với `grade` của học sinh
- AI phải trả về một câu luyện tập duy nhất cho mỗi lesson response
- phản hồi sai phải luôn có giải thích ngắn và gợi ý học lại
