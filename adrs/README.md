# Architecture Decision Records

## Mục tiêu

Thư mục `adrs/` lưu các quyết định kiến trúc quan trọng của MVP. Các tài liệu này không lặp lại phần product spec, mà khóa các tradeoff kỹ thuật để người implement biết rõ hệ thống sẽ được xây theo hướng nào.

## Phạm vi

Bộ ADR hiện tại tập trung vào các quyết định lớn cho MVP:

- architecture style
- frontend stack và UI rendering
- backend API boundary
- AI integration, structured output và guardrail
- data store và progress model
- monorepo folder structure
- deployment portability

Những phần ngoài scope MVP như parent dashboard, teacher authoring, voice input, gamification phức tạp và adaptive learning chưa được đặc tả bằng ADR ở giai đoạn này.

## Quy ước

- Mỗi ADR dùng format cố định:
  - `Status`
  - `Context`
  - `Decision`
  - `Consequences`
  - `Alternatives considered`
- Mỗi file chỉ chốt một quyết định kiến trúc lớn.
- Số thứ tự tăng dần từ `0001`.
- Trạng thái hiện dùng cho bộ MVP này là `Accepted`.

## Danh sách ADR

- [0001 - Architecture Style](./0001-architecture-style.md)
- [0002 - Frontend Stack And UI Rendering](./0002-frontend-stack-and-ui-rendering.md)
- [0003 - Backend API Boundary](./0003-backend-api-boundary.md)
- [0004 - AI Structured Output And Guardrails](./0004-ai-structured-output-and-guardrails.md)
- [0005 - Data Store And Progress Model](./0005-data-store-and-progress-model.md)
- [0006 - Monorepo Folder Structure](./0006-monorepo-folder-structure.md)
- [0007 - Deployment Portability](./0007-deployment-portability.md)

## Shared assumptions

Toàn bộ ADR trong thư mục này cùng dựa trên các quyết định MVP đã chốt trong `spec/`:

- chỉ có role `student`
- chỉ có 4 domain `multiplication`, `division`, `fraction_basic`, `perimeter_area_basic`
- frontend render từ `structured JSON`
- không dùng AI-generated free-form images
- voice chỉ ở mức `Text-to-Speech output only`
