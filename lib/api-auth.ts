import { cookies } from "next/headers";
import axios from "axios";

/**
 * Xác thực request tới 1 API route nội bộ (gọi Gemini/AI, tốn phí mỗi lần gọi) đến từ 1 phiên
 * đăng nhập hợp lệ. middleware.ts cố ý bỏ qua toàn bộ /api/* nên các route AI phải tự kiểm tra —
 * nếu không, bất kỳ ai trên internet cũng gọi được, vừa tốn quota Gemini vừa mở đường prompt
 * injection qua request body không lọc. Xác thực thật với backend qua /auth/me thay vì chỉ decode
 * JWT tại chỗ, để chặn được cả token đã bị thu hồi/hết hạn phía server.
 */
export async function requireAuthenticatedSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  if (!accessToken) return false;

  try {
    const javaApiUrl = process.env.JAVA_API_URL ?? "http://api:8004/api";
    await axios.get(`${javaApiUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: 5000,
    });
    return true;
  } catch {
    return false;
  }
}
