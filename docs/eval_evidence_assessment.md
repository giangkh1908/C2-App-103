# Eval Evidence Assessment

This document summarizes a minimum manual evidence set for the MVP. The goal is to show that the core user-facing flows of the project work with observable outputs from the running system.

## Manual Test Cases

| TC ID | Test case | Preconditions | Steps | Expected output | Actual output mẫu | Result |
|---|---|---|---|---|---|---|
| `MAN-01` | Đăng ký tài khoản mới thành công | Backend chạy tại `http://localhost:8000`, frontend chạy tại `http://localhost:3000`, email chưa tồn tại | 1. Mở trang `register` 2. Nhập `name`, `email`, `password` 3. Submit form | Hệ thống tạo user mới, trả `accessToken`, set `refresh_token` cookie, frontend đăng nhập ngay sau register | API `POST /api/v1/auth/register` trả `201`. Response mẫu: `{"user":{"email":"student1@example.com","name":"Student 1","role":"student"},"accessToken":"<jwt>"}`. Trình duyệt có cookie `refresh_token`. UI chuyển vào app. | Pass |
| `MAN-02` | Truy cập protected page khi chưa đăng nhập | Chưa có session hợp lệ | 1. Mở trực tiếp `/vi/learn` hoặc `/vi/practice` 2. Quan sát điều hướng | Người dùng bị chặn khỏi protected page, được chuyển về trang login với `redirectTo` | Frontend hiển thị toast kiểu `Vui lòng đăng nhập để tiếp tục`, sau đó redirect tới `/vi/login?redirectTo=%2Fvi%2Flearn`. | Pass |
| `MAN-03` | Gửi chat learning thành công và nhận structured payload | Đã đăng nhập hợp lệ | 1. Vào trang học 2. Gửi câu hỏi như `Giải thích phép nhân 3 x 4` 3. Quan sát response trong UI hoặc tab Network | Backend trả payload có `assistant_message`, `detected_topic`, `visual_card`, `practice_question` để frontend render | API `POST /api/v1/chat/turn` trả `200`. Response mẫu rút gọn: `{"session_id":"session_123","assistant_message":"Phép nhân là cách cộng nhiều nhóm giống nhau.","detected_topic":"multiplication","response_mode":"explain_with_visual_and_practice","visual_card":{"title":"Phép nhân 3 x 4 bằng nhóm đều","visual_data":{"type":"candy","primary_count":3,"secondary_count":4,"total_count":12}},"practice_question":{"question_text":"Hỏi nhanh","options":["1","12","9","7"]}}` | Pass |
| `MAN-04` | Practice flow: lấy đề, tạo attempt, nộp bài thành công | Đã đăng nhập, practice catalog đã seed | 1. Mở màn practice 2. Chọn grade 3. Chọn 1 exam 4. Tạo attempt 5. Chọn đáp án và submit | Hệ thống tạo attempt, chấm bài, trả kết quả với trạng thái `submitted` và summary | Chuỗi API mẫu: `GET /api/v1/practice/grades` trả danh sách grade; `GET /api/v1/practice/exams?grade=3` trả danh sách đề; `POST /api/v1/practice/attempts` trả `201` với `attempt_id`; `POST /api/v1/practice/attempts/{attempt_id}/submit` trả `200` với mẫu: `{"attempt_id":"att_001","status":"submitted","result_summary":{"total_count":10,"correct_count":8},"answers":[...],"questions":[...]}` | Pass |
| `MAN-05` | Refresh token hoạt động khi access token hết hạn hoặc API gặp `401/403` | Đã đăng nhập, còn `refresh_token` cookie hợp lệ | 1. Đăng nhập 2. Gây tình huống access token hết hạn hoặc gọi API protected với token cũ 3. Quan sát frontend retry | Frontend tự gọi `/auth/refresh`, lấy access token mới, retry request gốc thành công mà không bắt user login lại | Network mẫu: request protected đầu tiên trả `401`; tiếp theo frontend gọi `POST /api/v1/auth/refresh` trả `200` với `{"accessToken":"<new-jwt>"}`; request protected được gửi lại và trả `200`. | Pass |

## Assessment

Bộ 5 manual test cases trên đủ mức tối thiểu về số lượng để chứng minh các luồng cốt lõi của MVP:

- authentication
- protected route handling
- AI learning/chat response
- practice workflow
- session refresh

Tuy nhiên, bộ evidence này chưa đủ mạnh nếu chỉ có mô tả và output mẫu. Để dùng làm evidence nộp bài tốt hơn, mỗi test case nên đính kèm thêm:

- screenshot UI
- raw API response từ browser devtools hoặc Postman
- ngày chạy test
- người thực hiện test
- môi trường test như local dev hoặc Docker

## Conclusion

The current 5-case manual evidence set is minimally sufficient in quantity, but evidence quality depends on attaching real observed outputs instead of keeping only sample outputs.
