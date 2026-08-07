import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Dùng JAVA_API_URL (server-side internal URL) để tránh NEXT_PUBLIC_API_URL
    // ("/be-api") không hợp lệ trong context Node.js — giống app/api/auth/me/route.ts.
    const javaApiUrl = process.env.JAVA_API_URL ?? "http://api:8004/api";
    await axios.post(`${javaApiUrl}/public/visits/track`, body, {
      timeout: 5000,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    // Lượt truy cập là số liệu tham khảo — lỗi ghi nhận không được ảnh hưởng người dùng.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
