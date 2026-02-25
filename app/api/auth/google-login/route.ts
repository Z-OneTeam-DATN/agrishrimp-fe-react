import { AuthService } from "@/app/services/auth.service";
import { AxiosError } from "axios";
import { jwtDecode, JwtPayload } from "jwt-decode";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { token } = await request.json();
  
  try {
    // 1. Gửi Token Google tới Java Backend
    const res = await AuthService.loginWithGoogle(token);

    // 2. Decode JWT để lấy ngày hết hạn cho Cookies
    const accessToken = jwtDecode<JwtPayload>(res.accessToken);
    const expiresDateAccessToken =
      typeof accessToken.exp === "number"
        ? new Date(accessToken.exp * 1000)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const response = NextResponse.json(res, { status: 200 });

    // 3. Thiết lập Cookies HttpOnly cho Access Token
    response.cookies.set({
      name: "accessToken",
      value: res.accessToken,
      path: "/",
      httpOnly: true,
      expires: expiresDateAccessToken,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    // 4. Thiết lập Cookies HttpOnly cho Refresh Token
    const refreshToken = jwtDecode<JwtPayload>(res.refreshToken);
    const expiresDateRefreshToken =
      typeof refreshToken.exp === "number"
        ? new Date(refreshToken.exp * 1000)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    response.cookies.set({
      name: "refreshToken",
      value: res.refreshToken,
      path: "/",
      httpOnly: true,
      expires: expiresDateRefreshToken,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    // Marker cookie (non-HttpOnly) để client-side JS biết user đã đăng nhập
    response.cookies.set({
      name: "hasSession",
      value: "1",
      path: "/",
      httpOnly: false,
      expires: expiresDateRefreshToken,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (e) {
    if (e instanceof AxiosError) {
      return NextResponse.json(
        { message: e.response?.data?.message || e.message },
        { status: e.response?.status || 500 },
      );
    }
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
