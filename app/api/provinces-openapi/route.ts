import { NextRequest, NextResponse } from "next/server";

const PROVINCES_OPEN_API_BASE = "https://provinces.open-api.vn/api/v2";

const isAllowedProvincePath = (path: string) => {
  return (
    path === "/" ||
    /^\/p\/\d+(\?depth=\d+)?$/.test(path) ||
    /^\/d\/\d+(\?depth=\d+)?$/.test(path)
  );
};

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path") || "/";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (!isAllowedProvincePath(normalizedPath)) {
    return NextResponse.json(
      { error: "Invalid province API path" },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(`${PROVINCES_OPEN_API_BASE}${normalizedPath}`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch Province Open API" },
        { status: response.status },
      );
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    console.error("[/api/provinces-openapi] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Province Open API" },
      { status: 500 },
    );
  }
}
