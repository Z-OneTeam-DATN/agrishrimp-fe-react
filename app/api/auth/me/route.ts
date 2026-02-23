import { AuthService } from "@/app/services/auth.service";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import axios from "axios";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    return NextResponse.json(
      { message: "Chưa đăng nhập" },
      { status: 401 }
    );
  }

  try {
    // Gọi Java backend trực tiếp bằng axios với token từ cookie
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return NextResponse.json(response.data, { status: 200 });
  } catch (error: any) {
    console.error("Hydration /auth/me failed:", error?.response?.data || error.message);
    return NextResponse.json(
      { message: "Phiên đăng nhập hết hạn" },
      { status: 401 }
    );
  }
}
