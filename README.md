# Agri Shrimp React

Dự án frontend của nền tảng AgriShrimp, xây dựng bằng Next.js 15 (App Router), phục vụ đồng thời website bán hàng, trang quản trị và các luồng AI dành cho người nuôi tôm.

## Description

AgriShrimp Web không chỉ là website bán thuốc, thức ăn và vật tư thủy sản, mà còn là lớp giao diện để người dùng tương tác trực tiếp với các dịch vụ AI của hệ thống.

Hai luồng AI chính đang được áp dụng trong web:

- `Tìm kiếm sản phẩm bằng ảnh`: người dùng tải ảnh sản phẩm lên, backend chuyển ảnh sang Python AI service dùng CLIP `ViT-B/32` để mã hóa ảnh thành vector đặc trưng 512 chiều. Vector của ảnh truy vấn sẽ được so sánh bằng cosine similarity với các vector ảnh sản phẩm đã index trước đó trong hệ thống để trả về danh sách sản phẩm giống nhất.
- `Bác sĩ AI chẩn đoán bệnh tôm`: người dùng tải ảnh tôm bệnh và nhập thêm triệu chứng. Web gửi dữ liệu sang backend Spring Boot, backend gọi AI service FastAPI dùng `YOLOv8` để nhận diện bệnh từ ảnh và lấy top dự đoán theo độ tin cậy. Sau đó backend dùng kết quả bệnh, triệu chứng người dùng nhập và danh sách sản phẩm còn khả dụng để gọi `Gemini 2.5 Flash` sinh phác đồ điều trị dạng có cấu trúc theo từng giai đoạn. Kết quả cuối cùng hiển thị ngay trên web gồm tên bệnh, độ tin cậy, mô tả dấu hiệu, nguyên nhân có thể, từng bước xử lý và các sản phẩm gợi ý có thể thêm thẳng vào giỏ hàng.

Nói ngắn gọn, website này là nơi kết nối giữa người nuôi tôm, dữ liệu sản phẩm và 2 nhóm AI khác nhau: một AI chuyên nhìn ảnh để tìm hoặc nhận diện, và một AI ngôn ngữ chuyên giải thích, lập phác đồ và biến kết quả thành hướng xử lý dễ áp dụng.

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
NEXT_PUBLIC_API_URL=http://localhost:8004/api

# URL của Next.js App (dùng cho các API Route nội bộ)
NEXT_PUBLIC_APP_URL=http://localhost:3004

# Backend origin cho media tuyệt đối và socket local
NEXT_PUBLIC_BACKEND_ORIGIN=http://localhost:8004
NEXT_PUBLIC_SOCKET_URL=http://localhost:8004

# URL backend dùng cho SSR / API route server-side
JAVA_API_URL=http://localhost:8004/api
```

> **Lưu ý:** Hãy đảm bảo Backend API đang chạy tại địa chỉ tương ứng.

### 4. Khởi chạy dự án

Chạy server phát triển (Development server):

```bash
npm run dev
```

Truy cập [http://localhost:3004](http://localhost:3004) để xem ứng dụng.

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
