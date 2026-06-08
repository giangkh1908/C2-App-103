# ADR 0001: Architecture Style

## Status

Accepted

## Context

MVP cần chứng minh rằng AI có thể giải thích Toán tiểu học bằng Visual Card và Mini Simulation, thay vì chỉ trả lời như một chatbot văn bản. Hệ thống phải hỗ trợ:

- auth đơn giản cho `student`
- chọn lớp và chủ đề
- lesson generation theo `structured JSON`
- practice feedback
- lưu progress cơ bản

Theo `brainstorm.md` và `spec/`, frontend phải render từ component cố định và AI không được sinh ảnh tự do.

## Decision

MVP dùng kiến trúc web app tách lớp rõ ràng:

- `Next.js` frontend chịu trách nhiệm UI, routing và client interactions
- một backend API riêng chịu trách nhiệm auth, lesson generation, practice submit và progress
- AI provider nằm sau backend, không được gọi trực tiếp từ frontend
- frontend chỉ render lesson từ `structured JSON`, không tự suy diễn logic bài học

`component-based visualization` là trung tâm của kiến trúc. AI chỉ sinh dữ liệu có cấu trúc; frontend chịu trách nhiệm render thành Visual Card và Mini Simulation bằng các component có kiểm soát.

## Consequences

- Kiến trúc này giữ được ranh giới rõ giữa product UI, business validation và AI integration.
- Backend có thể kiểm tra `topic`, `grade`, `visual_type` và phép tính cơ bản trước khi trả dữ liệu cho frontend.
- Frontend không cần biết prompt hoặc logic của AI provider, chỉ cần bám shared contracts.
- Hệ thống dễ mở rộng thêm domain hoặc provider sau MVP mà không phá vỡ UI layer.

Chi phí phải chấp nhận:

- Cần thêm một lớp backend thay vì làm frontend-only.
- Cần duy trì contract giữa frontend và backend chặt chẽ hơn.

## Alternatives considered

### Chatbot-only architecture

Không chọn vì:

- trái với mục tiêu sản phẩm là học qua visual và simulation
- khó kiểm soát format đầu ra
- dễ trôi thành giao diện chat dài, nhiều chữ

### Frontend gọi LLM trực tiếp

Không chọn vì:

- khó bảo vệ API key và secrets
- không có lớp validation logic đủ mạnh
- khó áp guardrail và logging nhất quán
- làm shared contract dễ lệch giữa AI output và UI rendering

### AI-generated image centered architecture

Không chọn vì:

- khó kiểm soát số lượng và tính chính xác
- không phù hợp với yêu cầu visual có cấu trúc cho Toán tiểu học
- khó tái sử dụng cho simulation và practice flow
