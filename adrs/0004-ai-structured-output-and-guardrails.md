# ADR 0004: AI Structured Output And Guardrails

## Status

Accepted

## Context

AI là điểm khác biệt của sản phẩm, nhưng cũng là nguồn rủi ro lớn nhất về tính đúng, an toàn và nhất quán. `brainstorm.md` đã chốt:

- AI nên hoạt động theo pipeline
- output nên ở dạng JSON có cấu trúc
- guardrail phải giới hạn nội dung theo Toán tiểu học
- không dùng AI-generated free-form images

MVP cũng yêu cầu AI điều chỉnh giải thích theo `grade` và phản hồi nhẹ nhàng khi học sinh sai.

## Decision

AI layer được thiết kế theo hướng `provider-agnostic`:

- backend gọi AI qua provider adapter
- có thể implement OpenAI trước như lựa chọn ban đầu
- ADR không khóa cứng vào một vendor duy nhất

Output của AI bắt buộc ở dạng `structured JSON` theo schema lesson của MVP. AI không được trả free-form text dài như một chatbot mở và không được sinh image trực tiếp.

Guardrail được thực hiện qua 3 lớp:

- prompt guardrail
- domain scoping tại backend
- schema và logic validation sau khi nhận output

Rule bắt buộc cho MVP:

- AI chỉ sinh nội dung trong 4 domain MVP
- AI phải nhận `grade` như input chính thức
- AI phải trả về đúng lesson shape đã chốt trong `spec/api_contracts.md`
- AI chỉ được dùng `visual_type` nằm trong enum cố định
- nếu học sinh sai, AI phải trả explanation ngắn và `retry_hint` dễ hơn
- AI không trả lời ngoài scope học tập như một chatbot general-purpose

## Consequences

- Hệ thống dễ thay provider hơn mà không đổi contract sản phẩm.
- Frontend nhận output ổn định hơn và có thể render chắc chắn.
- Guardrail không phụ thuộc hoàn toàn vào prompt, giảm rủi ro hallucination hoặc lệch format.
- Việc debug lesson generation tốt hơn vì có thể lưu snapshot JSON trong `learning_sessions`.

Chi phí phải chấp nhận:

- Cần adapter và validation layer rõ ràng hơn.
- Phải bảo trì schema đồng bộ giữa API, backend và frontend.

## Alternatives considered

### Khóa cứng vào một provider cụ thể

Không chọn vì:

- làm giảm khả năng thay đổi theo chi phí, chất lượng hoặc availability
- không cần thiết ở mức kiến trúc MVP

### Chỉ dùng prompt guardrail, không validate backend

Không chọn vì:

- prompt một mình không đủ đảm bảo schema và phép tính đúng
- khó chặn output lệch domain hoặc visual type

### Dùng AI-generated free-form image

Không chọn vì:

- trái với hướng component-based visualization
- khó kiểm soát độ chính xác số lượng và hình minh họa
