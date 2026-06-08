# ADR 0007: Frontend On Vercel And Backend On VPS

## Status

Accepted

## Context

MVP cần được deploy online với frontend và backend tách biệt rõ ràng. Frontend dùng `Next.js`, backend là HTTP API riêng và database là managed `MongoDB`.

Ở giai đoạn này, team muốn chốt deployment cụ thể để giảm độ mơ hồ khi triển khai:

- frontend lên `Vercel`
- backend lên `VPS`

## Decision

Deployment của MVP được chốt theo hướng hybrid:

- frontend deploy trên `Vercel`
- backend deploy trên `VPS`
- database tiếp tục dùng managed service phù hợp với `MongoDB`

Nguyên tắc triển khai bắt buộc:

- frontend và backend deploy độc lập
- frontend tận dụng platform phù hợp với `Next.js`
- backend chạy trên runtime HTTP ổn định cho API, AI calls và secret management
- database dùng managed service phù hợp với `MongoDB`
- toàn bộ cấu hình đi qua environment variables
- frontend gọi backend qua base URL cấu hình được
- backend phải tự quản lý reverse proxy, SSL, process runtime và secrets trên VPS

Lý do chọn hướng này:

- `Vercel` phù hợp tự nhiên với `Next.js`, giúp FE deploy nhanh và preview dễ
- `VPS` cho backend linh hoạt hơn về runtime, process control và cấu hình môi trường
- mô hình này vẫn giữ ranh giới rõ giữa frontend, backend và database

## Consequences

- FE và BE có vòng đời triển khai độc lập.
- Frontend được hưởng lợi từ flow deploy nhanh của `Vercel`.
- Backend có toàn quyền kiểm soát môi trường chạy trên `VPS`, phù hợp khi cần cài thêm reverse proxy, monitoring nhẹ hoặc background processes.
- Ranh giới frontend/backend/database rõ ràng hơn khi deploy và vận hành.

Chi phí phải chấp nhận:

- Cần tự quản lý vận hành backend trên `VPS`, gồm deploy process, SSL, restart policy và logging.
- Cần quản lý CORS, base URL và networking giữa `Vercel` với backend domain/IP.
- Mức portability của backend thấp hơn so với phương án PaaS thuần, dù kiến trúc API vẫn giữ được tính tách lớp.

## Alternatives considered

### Hosting-agnostic hoàn toàn

Không chọn ở thời điểm này vì team đã có quyết định triển khai cụ thể cho MVP và muốn ADR phản ánh đúng target vận hành thực tế.

### Backend trên Railway hoặc Render

Không chọn vì backend hiện được ưu tiên chạy trên `VPS` để có quyền kiểm soát môi trường cao hơn.

### Deploy frontend và backend như một khối không tách

Không chọn vì:

- làm mờ boundary kiến trúc đã chốt
- khó thay thế hoặc scale từng phần độc lập
- không phù hợp với việc backend cần quản lý AI secrets riêng
