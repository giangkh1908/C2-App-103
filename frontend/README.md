# AI20K Chat — Frontend

Frontend ứng dụng **AI20K Chat** được xây dựng bằng Next.js + TypeScript.

## Công nghệ sử dụng

| Công nghệ | Phiên bản | Mô tả |
|---|---|---|
| [Next.js](https://nextjs.org/) | 16.2.7 | Framework React với App Router |
| [React](https://react.dev/) | 19.2.4 | Thư viện UI |
| [TypeScript](https://www.typescriptlang.org/) | ^5 | Type-safe JavaScript |
| [Tailwind CSS](https://tailwindcss.com/) | v4 | Utility-first CSS framework |
| [ESLint](https://eslint.org/) | v9 | Linting & code quality |

## Cấu trúc thư mục

```
frontend/
├── public/                 # Static assets (images, fonts, favicon...)
├── src/
│   └── app/
│       ├── layout.tsx      # Root layout (chung cho tất cả trang)
│       ├── page.tsx        # Trang chủ (/)
│       ├── globals.css     # Global styles + Tailwind import
│       └── favicon.ico     # Favicon
├── next.config.ts          # Cấu hình Next.js
├── tsconfig.json           # Cấu hình TypeScript
├── postcss.config.mjs      # Cấu hình PostCSS (Tailwind v4)
├── eslint.config.mjs       # Cấu hình ESLint
└── package.json
```

## Cách chạy

### Cài đặt dependencies

```bash
npm install
```

### Chế độ development

```bash
npm run dev
```

Mở trình duyệt tại [http://localhost:3000](http://localhost:3000)

### Build production

```bash
npm run build
npm start
```

### Lint code

```bash
npm run lint
```

## Các lệnh có sẵn

| Lệnh | Mô tả |
|---|---|
| `npm run dev` | Khởi động dev server (với Turbopack) |
| `npm run build` | Build production |
| `npm start` | Chạy production build |
| `npm run lint` | Chạy ESLint kiểm tra code |

## Import alias

Sử dụng `@/*` để import từ thư mục `src/`:

```tsx
// Thay vì: import Button from "../../../components/Button"
import Button from "@/components/Button"
```

## Tailwind CSS v4

Project sử dụng **Tailwind CSS v4** — phiên bản mới, không cần file `tailwind.config.ts`. Chỉ cần import trong CSS:

```css
@import "tailwindcss";
```

Sử dụng trực tiếp class Tailwind trong JSX:

```tsx
<div className="flex items-center justify-center bg-blue-500 text-white p-4 rounded-lg">
  Hello AI20K
</div>
```

## Bắt đầu phát triển

Trang chính nằm tại `src/app/page.tsx`. Để thêm trang mới, tạo file `page.tsx` trong thư mục con:

```
src/app/
├── page.tsx              → /
├── about/page.tsx        → /about
├── chat/page.tsx         → /chat
└── chat/[id]/page.tsx    → /chat/123 (dynamic route)
```

## Tài liệu tham khảo

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/blog/tailwindcss-v4)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
