# Release Plan

## Mục tiêu release

MVP được coi là sẵn sàng release khi nhóm có thể demo online một luồng học hoàn chỉnh cho role `student`, đúng 4 domain đã chốt, với FE + BE trên Railway.

## Release criteria

### Product criteria

- chỉ có role `student`
- chỉ có 4 domain `multiplication`, `division`, `fraction_basic`, `perimeter_area_basic`
- học sinh có thể đăng ký, đăng nhập, chọn lớp, chọn chủ đề
- học sinh có thể hỏi AI hoặc mở bài học gợi ý
- lesson trả về đúng structured format
- có Visual Card và Mini Simulation đúng domain
- có một câu luyện tập cho mỗi lesson
- có feedback đúng/sai và giải thích lại khi sai
- có lưu progress cơ bản
- voice chỉ ở mức `Text-to-Speech output`

### Technical criteria

- shared contracts giữa FE/BE ổn định
- backend validate `topic`, `grade`, `visual_type` và lesson shape
- MongoDB lưu được `users`, `learning_sessions`, `progress`
- FE deploy thành công trên Railway ✅
- BE deploy thành công trên Railway ✅
- FE gọi BE qua base URL cấu hình được

### Demo criteria

- có ít nhất một flow demo mượt cho mỗi nhóm domain:
  - phép nhân hoặc chia
  - phân số
  - chu vi hoặc diện tích
- có dữ liệu test/account demo sẵn
- có phương án fallback nếu AI provider lỗi hoặc network chậm

## Demo readiness checklist

- [⬜] Có account demo hoạt động (chưa có script)
- [ ] Có ít nhất 2 prompt demo an toàn cho mỗi domain
- [ ] FE environment trên Vercel đúng base URL backend
- [ ] Backend VPS có reverse proxy, SSL và process restart cơ bản
- [⬜] Smoke test full flow pass (chưa có script)
- [ ] Error state hiển thị rõ nếu BE hoặc AI lỗi
- [⬜] TTS trigger hoạt động (backend trả tts_text, frontend chưa trigger)
- [ ] Không còn tính năng ngoài scope MVP lộ ra trên UI

## Rủi ro chính và thứ tự xử lý

### 1. AI trả output lệch schema hoặc sai domain

Xử lý trước ở Sprint 2 và siết thêm trong Sprint 3 bằng:

- schema validation
- enum validation
- fallback response

### 2. Simulation và visual không khớp lesson

Xử lý bằng:

- shared `visual_type` enum
- mapping cố định FE
- validation ở backend

### 3. Deploy thành công nhưng FE không gọi được BE

Xử lý bằng:

- base URL cấu hình được
- kiểm tra CORS
- smoke test sau deploy

### 4. Sprint 3 bị trôi sang thêm feature mới

Xử lý bằng:

- đóng băng scope sau Sprint 2
- Sprint 3 chỉ tập trung hardening, TTS, deploy, demo readiness

## Release decision

MVP **GẦN SẴN SÀNG RELEASE**.

**Đã đạt:**
- Tất cả P0 hoàn thành ✅
- FE + BE deployed trên Railway ✅
- Full flow register → login → lesson → simulation → practice → progress ✅

**Còn thiếu (không blocker cho core flow):**
- Smoke test tự động ⬜
- Demo script + account demo ⬜
- TTS trigger ⬜ (chỉ ảnh hưởng UX, không block flow)

**Kết luận:** Có thể demo MVP ngay với core flow. Smoke test và demo script nên hoàn thành trước khi public release.
