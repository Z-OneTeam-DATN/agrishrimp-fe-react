# Agri Shrimp React

Dự án Frontend được xây dựng với Next.js 15 (App Router), hỗ trợ các tính năng xác thực và quản lý người dùng.

## Yêu cầu hệ thống

- [Node.js](https://nodejs.org/) 18.x trở lên
- Trình quản lý gói: npm, yarn hoặc pnpm

## Hướng dẫn cài đặt (Local)

Làm theo các bước sau để thiết lập dự án trên máy cá nhân:

### 1. Clone dự án

```bash
git clone <repository-url>
cd agri-shrimp-react
```

### 2. Cài đặt thư viện

```bash
npm install
```

### 3. Cấu hình biến môi trường

Tạo file `.env.local` tại thư mục gốc và cấu hình các thông số kết nối tới Backend:

```bash
cp .env.example .env.local
# Hoặc tạo mới file .env.local với nội dung sau:
```

**Nội dung file `.env.local`:**

```env
# URL của Backend API (Java Spring Boot)
NEXT_PUBLIC_API_URL=http://localhost:8001/api

# URL của Next.js App (dùng cho các API Route nội bộ)
NEXT_PUBLIC_APP_URL=http://localhost:3000/api
```

> **Lưu ý:** Hãy đảm bảo Backend API đang chạy tại địa chỉ tương ứng.

### 4. Khởi chạy dự án

Chạy server phát triển (Development server):

```bash
npm run dev
```

Truy cập [http://localhost:3000](http://localhost:3000) để xem ứng dụng.

## Các lệnh Scripts

| Lệnh                   | Mô tả                                     |
| :--------------------- | :---------------------------------------- |
| `npm run dev`          | Chạy môi trường phát triển (Hot reload).  |
| `npm run build`        | Build ứng dụng cho môi trường Production. |
| `npm run start`        | Chạy ứng dụng sau khi đã build.           |
| `npm run lint`         | Kiểm tra lỗi code với ESLint.             |
| `npm run prettier`     | Kiểm tra định dạng code.                  |
| `npm run prettier:fix` | Tự động sửa định dạng code.               |

## Cấu trúc dự án

```
agri-shrimp-react/
├── app/
│   ├── (auth)/          # Các trang xác thực (Login, Signup, Reset Password)
│   ├── api/             # Next.js API Routes (Proxy, Auth handlers)
│   ├── services/        # Các service gọi API (AuthService, UserService...)
│   ├── types/           # Định nghĩa TypeScript (Schemas, Interfaces)
│   └── layout.tsx       # Root Layout
├── components/
│   └── ui/              # Các UI Component tái sử dụng (Button, Input...)
├── lib/
│   ├── axios.ts         # Cấu hình Axios Client & Interceptors
│   └── ...
├── hooks/               # Các Custom Hooks
├── stores/              # Quản lý State (Zustand)
└── public/              # Tài nguyên tĩnh (Images, Icons)
```

## Công nghệ sử dụng

- **Framework:** Next.js 15, React 18
- **Ngôn ngữ:** TypeScript
- **Styling:** Tailwind CSS, Radix UI
- **State Management:** Zustand, React Query
- **Form:** React Hook Form, Zod
