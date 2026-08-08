import { NextRequest, NextResponse } from "next/server"

const JAVA_API_URL = process.env.JAVA_API_URL ?? "http://localhost:8004/api"

export async function GET(request: NextRequest) {
  const provinceId = request.nextUrl.searchParams.get("province_id")
  if (!provinceId) {
    return NextResponse.json({ error: "Thiếu province_id" }, { status: 400 })
  }

  try {
    const res = await fetch(`${JAVA_API_URL}/ghn/district?province_id=${provinceId}`, {
      cache: "no-store",
    })

    if (!res.ok) {
      return NextResponse.json({ error: "Không thể tải quận/huyện" }, { status: res.status })
    }

    const json = await res.json()
    const districts = (json.data || [])
      .map((d: any) => ({
        id: d.DistrictID,
        name: d.DistrictName,
      }))
      .sort((left: { name: string }, right: { name: string }) =>
        left.name.localeCompare(right.name, "vi"),
      )
    return NextResponse.json(districts)
  } catch {
    return NextResponse.json({ error: "Không thể tải quận/huyện" }, { status: 500 })
  }
}
