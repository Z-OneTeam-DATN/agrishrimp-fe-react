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
    // Use JAVA_API_URL (server-side internal URL) to avoid using the relative
    // NEXT_PUBLIC_API_URL ("/be-api") which is invalid in Node.js context.
    const javaApiUrl =
      process.env.JAVA_API_URL ??
      (process.env.NODE_ENV === "production"
        ? "http://api:8004/api"
        : "http://localhost:8004/api");
    const response = await axios.get(
      `${javaApiUrl}/auth/me`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: 8000,
      }
    );

    return NextResponse.json(response.data, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("Hydration /auth/me failed:", error?.response?.data || error.message);
    return NextResponse.json(
      { message: "Phiên đăng nhập hết hạn" },
      { status: 401 }
    );
  }
}
