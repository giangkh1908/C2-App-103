# ADR 0002: Frontend Stack And UI Rendering

## Status

Accepted

## Context

Frontend MVP phải phục vụ học sinh tiểu học lớp 1-5, ưu tiên lớp 2-4. UI cần ít chữ, nút lớn, trực quan, mobile-friendly và đủ linh hoạt để hiển thị:

- Visual Card
- Mini Simulation
- practice question
- TTS action

`brainstorm.md` đã đề xuất `React hoặc Next.js`, `TailwindCSS` và render visual bằng SVG/HTML/CSS.

## Decision

Frontend MVP dùng:

- `Next.js`
- `Tailwind CSS`
- component-based rendering cho `Visual Card` và `Mini Simulation`
- animation nhẹ, có kiểm soát

Nguyên tắc render:

- visual chỉ được render từ enum cố định do API trả về
- simulation được map theo domain và `visual_type`, không render từ free-form prompt
- TTS chỉ là output action từ UI
- UX ưu tiên một màn hình một nhiệm vụ, nút lớn, dễ bấm

Visual mapping chuẩn cho MVP:

- `equal_groups` cho `multiplication`
- `sharing` cho `division`
- `fraction_pizza` cho `fraction_basic`
- `perimeter_path` và `area_grid` cho `perimeter_area_basic`

## Consequences

- UI nhất quán hơn giữa các domain và dễ kiểm soát chất lượng hiển thị.
- Frontend có thể phát triển như một thư viện component tái sử dụng thay vì xử lý từng lesson thủ công.
- Shared enum và lesson schema trở thành contract bắt buộc giữa frontend và backend.
- Next.js phù hợp cho web app MVP, routing rõ ràng và dễ triển khai trên các nền tảng hỗ trợ framework này.

Chi phí phải chấp nhận:

- Cần đầu tư vào bộ visual component từ sớm.
- Không thể hiển thị các visual mới nếu backend chưa thống nhất enum và schema.

## Alternatives considered

### React + Vite SPA

Có thể làm được nhưng không được chọn vì MVP cần app structure rõ hơn cho routing, scale và deployability.

### Render trực tiếp từ free-form text của AI

Không chọn vì:

- khó kiểm soát UI
- khó đồng nhất trải nghiệm
- làm simulation phụ thuộc vào parsing tự do

### Dùng game engine hoặc animation nặng

Không chọn vì MVP chỉ cần mini simulation đơn giản, tránh tăng độ phức tạp và giảm khả năng maintain.
