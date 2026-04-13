# Env/Tunnel checklist (server)

Ghi chú nhanh để deploy 5 dịch vụ mà không lỗi cấu hình môi trường.

## 1) Frontend – agrishrimp-web (Next.js, port 3004)
- Cổng/tunnel: agrishrimp.io.vn → http://localhost:3004
- Biến bắt buộc (.env/.env.local trên server):
  - `PORT=3004`
  - `NEXT_PUBLIC_APP_URL=https://agrishrimp.io.vn`
  - `NEXT_PUBLIC_BACKEND_ORIGIN=https://api.agrishrimp.io.vn`
  - `NEXT_PUBLIC_API_URL=https://api.agrishrimp.io.vn/api`
  - `NEXT_PUBLIC_SOCKET_URL=https://api.agrishrimp.io.vn`
  - `JAVA_API_URL=http://api:8004/api` (nếu chạy chung docker-compose) hoặc `https://api.agrishrimp.io.vn/api` khi front đứng riêng.
- Docker: expose 3004; compose đã map `3004:3004`.

## 2) Backend – agrishrimp-be-spring-webapp (Spring Boot, port 8004)
- Cổng/tunnel: api.agrishrimp.io.vn → http://localhost:8004
- Biến bắt buộc (.env.example gốc):
  - `SERVER_PORT=8004`
  - `APP_SERVER_URL=https://api.agrishrimp.io.vn`
  - `APP_WEB_BASE_URL=https://agrishrimp.io.vn`
  - `APP_CORS_ALLOWED_ORIGINS=https://agrishrimp.io.vn`
  - `PAYOS_RETURN_URL=https://agrishrimp.io.vn/order-success`
  - `PAYOS_CANCEL_URL=https://agrishrimp.io.vn/order-cancel`
  - DB/Redis/S3/GHN… giữ theo hạ tầng hiện tại.
- Docker: expose 8004; compose đã map `${APP_PORT:-8004}:8004`.

## 3) MiniZalo – agrishrimp-minizalo-app (Vite, dev 5173)
- Dùng khi cần preview mini app; nếu tunnel: `<subdomain>` → http://localhost:5173.
- Biến bắt buộc:
  - `VITE_API_URL=https://api.agrishrimp.io.vn/api`
  - `VITE_API_PROXY_TARGET=https://api.agrishrimp.io.vn`
  - `VITE_API_ORIGIN=https://api.agrishrimp.io.vn`
  - `VITE_QR_LOGIN_WEB_BASE_URL=https://agrishrimp.io.vn`

## 4) AI Visual Search – agrishrimp-ai-visual-search (Flask, port 5001)
- Cổng/tunnel nội bộ: `<subdomain nội bộ>` → http://localhost:5001
- Biến chính:
  - `FLASK_PORT=5001`
  - `DB_HOST=db` (prod) / `127.0.0.1` (dev), `DB_PORT=3306|3307`
  - Các khóa khác giữ theo hạ tầng hiện tại.

## 5) AI Diagnosis – agrishrimp-ai-diagnosis (FastAPI, port 3002)
- Cổng/tunnel nội bộ: `<subdomain nội bộ>` → http://localhost:3002
- Biến chính:
  - `GOOGLE_API_KEY=<key>`
  - Port mặc định trong `run.py`: 3002

## Cloudflare/Tunnel mapping gợi ý
- `agrishrimp.io.vn` → 3004
- `api.agrishrimp.io.vn` → 8004
- (Tùy chọn) preview mini app → 5173
- (Tùy chọn) ai-visual-search → 5001
- (Tùy chọn) ai-diagnosis → 3002
