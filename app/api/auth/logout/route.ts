import { AuthService } from "@/app/services/auth.service";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = await cookies();
  
  try {
    // 1. Gọi Backend Java để vô hiệu hóa token (nếu có accessToken)
    const accessToken = cookieStore.get("accessToken")?.value;
    if (accessToken) {
      await AuthService.logout(accessToken); 
    }
  } catch (error) {
    console.error("Backend logout failed, but proceeding to clear cookies:", error);
  }

  // 2. Tạo phản hồi thành công
  const response = NextResponse.json(
    { message: "Logged out successfully" },
    { status: 200 }
  );

  // 3. Xóa Cookies phía Next.js Server
  response.cookies.set({
    name: "accessToken",
    value: "",
    path: "/",
    maxAge: 0, // Xóa ngay lập tức
  });
  
  response.cookies.set({
    name: "refreshToken",
    value: "",
    path: "/",
    maxAge: 0,
  });

  return response;
}
