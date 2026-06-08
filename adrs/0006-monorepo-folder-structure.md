# ADR 0006: Monorepo Folder Structure

## Status

Accepted

## Context

MVP có frontend, backend và shared contracts phụ thuộc chặt vào nhau:

- topic enum
- visual type enum
- lesson response shape
- progress shape

Nếu tách repo quá sớm, nguy cơ lệch contract giữa API và UI sẽ cao hơn, trong khi team hiện đang ở giai đoạn chốt MVP và cần di chuyển nhanh.

## Decision

Repo được tổ chức theo `monorepo`.

High-level structure mục tiêu:

```text
apps/
  web/
  api/
packages/
  shared/
spec/
adrs/
```

Quy ước vai trò:

- `apps/web`: ứng dụng `Next.js` cho UI học sinh
- `apps/api`: backend API cho auth, lesson generation, practice và progress
- `packages/shared`: shared enums, schemas, types và contract helpers
- `spec/`: product và business specs
- `adrs/`: quyết định kiến trúc

Shared contracts tối thiểu nên sống ở `packages/shared`:

- `Topic enum`
- `Visual type enum`
- `Lesson response shape`
- `Progress shape`

## Consequences

- Frontend và backend dùng cùng một nguồn truth cho các contract quan trọng.
- Giảm nguy cơ drift giữa `spec/api_contracts.md` và code implementation sau này.
- Dễ thay đổi schema lesson trong MVP vì cả hai phía cùng cập nhật trong một repo.
- Hợp với giai đoạn đầu khi số service còn ít và boundary sản phẩm còn gọn.

Chi phí phải chấp nhận:

- Cần quy ước rõ ràng về ownership của `apps` và `packages/shared`
- Build tooling có thể phức tạp hơn một repo đơn ứng dụng

## Alternatives considered

### Two separate apps in separate repos

Không chọn vì:

- tăng overhead quản lý contract
- làm việc đồng bộ frontend/backend chậm hơn cho MVP
- dễ lệch schema lesson và visual enum

### Một app duy nhất chứa cả UI và API không tách boundary

Không chọn vì:

- làm mờ ranh giới giữa UI rendering, business logic và AI orchestration
- khó mở rộng thành hệ thống có API rõ ràng hơn sau MVP
