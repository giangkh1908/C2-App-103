# Practice Test-First Plan

## Goal

Hoàn thiện `/practice` theo hướng `test-first, merge-later`:

- không merge sớm vào `dev`
- giữ toàn bộ thay đổi trên nhánh `feature-practice-production`
- test dữ liệu thật từ Hugging Face, backend contract, UI shell và acceptance flow trước
- chỉ mở PR/merge khi pass checklist

## Working Branch

- Base branch: `dev`
- Working branch: `feature-practice-production`
- Không rework các file ngoài scope practice trong giai đoạn hardening

## Phases

### Phase A — Data Pipeline And Backend Contract

Mục tiêu:

- dùng dataset thật từ Hugging Face
- import full snapshot local
- curate đúng `10` đề production mỗi lớp
- khóa contract backend để frontend code theo

Deliverables:

- `backend/scripts/fetch_hf_practice_dataset.py`
- `backend/scripts/generate_practice_manifest.py`
- `backend/scripts/import_practice_dataset.py`
- curated manifest production candidate
- API `/practice` đầy đủ cho list, detail, draft, resume, restart, submit, history

Pass gate:

- fetch được snapshot thật
- import được lên MongoDB
- manifest hợp lệ
- text đã normalize, không còn mojibake
- backend contract ổn định

### Phase B — Frontend UI Rewrite

Mục tiêu:

- rewrite sạch `PracticeExperience`
- bám form UI tham chiếu ở bố cục và flow chính
- không merge phase này nếu acceptance flow chưa chạy được

Deliverables:

- shell `/practice` với left sidebar + main workspace
- modal `Tiếp tục / Làm lại`
- autosave draft local + server
- confirm submit khi còn câu trống
- result screen hoàn chỉnh

Pass gate:

- render shell đúng
- chọn lớp đổi danh sách đề đúng
- resume/restart chạy đúng
- result render đầy đủ
- mobile usable

### Phase C — Integration, Regression And Merge Hardening

Mục tiêu:

- khóa chất lượng trước merge
- rà conflict risk với team

Deliverables:

- import + API + UI end-to-end
- manual screenshots/checklist
- conflict notes cho shared files
- merge readiness checklist pass

Pass gate:

- acceptance scenario pass
- không còn critical regression ở `/practice`
- rebase thử lên `origin/dev` không nảy conflict lớn ngoài các file shared đã biết

## Shared Files Freeze

Các file sau chỉ được chỉnh tối thiểu và có lý do testable rõ:

- `frontend/src/types.ts`
- `backend/src/api/__init__.py`
- `backend/src/core/database.py`
- `backend/tests/conftest.py`

Nguyên tắc:

- không cleanup lan man
- không reformat hàng loạt
- ưu tiên thêm code practice vào file riêng

## Risk Areas

### Backend

- import dataset thật có row bẩn
- manifest curate sai ID hoặc sai grade
- `attempt` cũ cần replay được dù đề inactive

### Frontend

- component rewrite dễ lệch contract backend
- autosave/debounce dễ race state
- mobile action bar và navigator dễ vỡ layout

### Merge

- `types.ts` dễ conflict với frontend branch khác
- `database.py` và `api/__init__.py` dễ conflict với backend branch khác
- tests/conftest dễ xung đột khi team thêm fixture

## Definition Of Ready To Merge

Chỉ merge khi đồng thời đúng tất cả:

- dataset thật đã fetch và import thành công
- curated manifest production đã review
- backend contract ổn định
- UI `/practice` bám đúng flow mong muốn
- unit/integration/manual checks đã hoàn tất
- rebase lên `dev` sạch hoặc conflict nhỏ, xử lý rõ ràng
