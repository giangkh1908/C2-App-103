# Next.js 16 Production Skill

## ⚠️ BREAKING CHANGES - Read Before Coding

**This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.**

---

## 1. Phương pháp làm việc

### Quy trình khi viết code Next.js 16:
1. **Đọc docs trước** — Không viết code dựa trên kiến thức cũ. Mở file doc liên quan trong `node_modules/next/dist/docs/` trước khi implement.
2. **Kiểm tra version** — Project dùng Next.js 16.2.7, React 19.2.4. Mọi API có thể khác training data.
3. **Test ngay** — Sau khi viết, chạy `npm run dev` để verify ngay, không đợi cuối.

### Bảng tra cứu — Code phần nào thì đọc doc đó:
| Đang làm gì | Đọc file này |
|---|---|
| Tạo page / layout / routing | `01-app/01-getting-started/03-layouts-and-pages.md` |
| Server vs Client component | `01-app/01-getting-started/05-server-and-client-components.md` |
| Fetch data | `01-app/01-getting-started/06-fetching-data.md` |
| Caching / revalidation | `01-app/01-getting-started/08-caching.md` |
| API routes | `01-app/01-getting-started/15-route-handlers.md` |
| Ảnh (Image) | `01-app/01-getting-started/12-images.md` |
| Font | `01-app/01-getting-started/13-fonts.md` |
| Metadata / OG image | `01-app/01-getting-started/14-metadata-and-og-images.md` |
| Auth / redirect (proxy) | `01-app/01-getting-started/16-proxy.md` |
| Deploy | `01-app/01-getting-started/17-deploying.md` |
| Config (`next.config.ts`) | `01-app/03-api-reference/05-config/01-next-config-js/` |
| Turbopack | `01-app/03-api-reference/08-turbopack.md` |
| Upgrade từ v15 | `01-app/02-guides/upgrading/version-16.md` |

Tất cả docs nằm trong `node_modules/next/dist/docs/`.

---

## 2. Breaking Changes quan trọng

### Phải nhớ:
1. **Async Request APIs** — `params`, `searchParams`, `cookies()`, `headers()`, `draftMode()` đều phải `await`. Không thể truy cập đồng bộ nữa.
2. **Middleware → Proxy** — File `middleware.ts` đổi tên thành `proxy.ts`. Export function tên `proxy` thay vì `middleware`.
3. **Turbopack là default** — `next dev` và `next build` dùng Turbopack. Nếu có custom webpack config sẽ fail build → dùng `--webpack` flag.
4. **Caching API đổi** — `revalidateTag()` cần argument thứ 2 (cacheLife profile). `cacheLife`/`cacheTag` bỏ prefix `unstable_`.
5. **next/image** — `images.domains` deprecated → dùng `images.remotePatterns`.
6. **Đã xóa** — AMP, `next lint`, `serverRuntimeConfig`/`publicRuntimeConfig`.

### Cách kiểm tra nhanh:
- Nếu code có `params.xxx` mà không có `await` → SAI
- Nếu thấy `middleware.ts` → Đổi thành `proxy.ts`
- Nếu thấy `revalidateTag('tag')` thiếu arg thứ 2 → BỔ SUNG
- Nếu thấy `images.domains` → CHUYỂN sang `remotePatterns`

---

## 3. Quyết định Server vs Client Component

### Mặc định là Server Component. Chỉ thêm `'use client'` khi:
- Dùng `useState`, `useEffect`, `useReducer` hoặc các hooks khác
- Dùng event handlers (`onClick`, `onChange`, `onSubmit`)
- Dùng browser APIs (`window`, `document`, `localStorage`)
- Dùng thư viện cần client-side (framer-motion, react-hook-form...)

### Nếu không chắc → Thử Server Component trước. Lỗi thì mới chuyển.

---

## 4. Quyết định cách fetch data

### Ưu tiên theo thứ tự:
1. **Server Component + fetch** — Mặc định. Data lấy ở server, không gửi JS xuống client.
2. **Server Action** — Khi cần mutate data (create, update, delete).
3. **Client-side fetch (SWR/React Query)** — Chỉ khi cần real-time updates hoặc data thay đổi theo user interaction.

### Caching strategy:
- Data ít thay đổi → `revalidate: 3600` (ISR)
- Data thay đổi theo user → `no-store` (dynamic)
- Data cần update ngay → `updateTag()` trong Server Action

---

## 5. Error Handling

### Phải có ở mọi level:
1. **Route level** — `app/error.tsx` (Error Boundary)
2. **Not found** — `app/not-found.tsx`
3. **Loading** — `app/loading.tsx` (Suspense fallback)
4. **API routes** — Try/catch + trả status code đúng
5. **Form validation** — Zod schema trước khi xử lý

---

## 6. Code Quality Checklist

### Trước khi commit:
- [ ] Không có `any` type
- [ ] Không có `params.xxx` mà thiếu `await`
- [ ] Không dùng `middleware.ts` (dùng `proxy.ts`)
- [ ] Không dùng `images.domains` (dùng `remotePatterns`)
- [ ] `revalidateTag` có 2 arguments
- [ ] Component nào cần interactivity thì có `'use client'`
- [ ] Chạy `npm run build` thành công

---

## 7. Nguyên tắc chung

1. **Server Components mặc định** — Chỉ `'use client'` khi thật sự cần
2. **TypeScript strict** — Không `any`, dùng type/interface rõ ràng
3. **Tailwind CSS** — Không inline styles, dùng utility classes
4. **Zod validation** — Validate mọi input từ user
5. **Error boundaries** — Luôn xử lý lỗi ở mỗi level
6. **Ảnh** — Dùng `next/image` với `remotePatterns`
