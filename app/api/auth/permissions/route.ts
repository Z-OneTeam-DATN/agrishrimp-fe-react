import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import axios from "axios";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    return NextResponse.json([], { status: 200 });
  }

  try {
    const javaApiUrl =
      process.env.JAVA_API_URL ??
      (process.env.NODE_ENV === "production"
        ? "http://api:8004/api"
        : "http://localhost:8004/api");
    const response = await axios.get(
      `${javaApiUrl}/me/permissions`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: 8000,
      }
    );

    const raw = response.data;

    // Handle nhiều format: string[] / { data: string[] } / { permissions: string[] } / { content: string[] }
    let permissions: string[] = [];
    if (Array.isArray(raw)) {
      permissions = raw;
    } else if (raw && typeof raw === "object") {
      const inner = raw.data ?? raw.permissions ?? raw.content ?? raw.result;
      if (Array.isArray(inner)) permissions = inner;
    }
    return NextResponse.json(permissions, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("Fetch /me/permissions failed:", error?.response?.data || error.message);
    return NextResponse.json([], {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }
}
