import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Lấy IP từ query param hoặc từ header
    const searchParams = request.nextUrl.searchParams
    const ipParam = searchParams.get("ip")

    const ip =
      ipParam ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      ""

    const url = ip
      ? `http://ip-api.com/json/${ip}`
      : "http://ip-api.com/json/"

    const res = await fetch(url, { next: { revalidate: 0 } })

    if (!res.ok) {
      return NextResponse.json(
        { error: "Không thể lấy thông tin vị trí từ IP" },
        { status: 500 }
      )
    }

    const data = await res.json()

    if (data.status !== "success") {
      return NextResponse.json(
        { error: data.message || "IP lookup thất bại" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      lat: data.lat,
      lng: data.lon,
      city: data.city,
      source: "ip",
    })
  } catch (err) {
    console.error("[/api/location] Error:", err)
    return NextResponse.json(
      { error: "Lỗi server khi lấy vị trí" },
      { status: 500 }
    )
  }
}
