import { NextRequest, NextResponse } from "next/server"

const JAVA_API_URL = process.env.JAVA_API_URL ?? "http://localhost:8004/api"

export async function GET(request: NextRequest) {
  const districtId = request.nextUrl.searchParams.get("district_id")
  if (!districtId) {
    return NextResponse.json({ error: "Thiếu district_id" }, { status: 400 })
  }

  try {
    const res = await fetch(`${JAVA_API_URL}/ghn/ward?district_id=${districtId}`, {
      cache: "no-store",
    })

    if (!res.ok) {
      return NextResponse.json({ error: "Không thể tải phường/xã" }, { status: res.status })
    }

    const json = await res.json()
    const wards = (json.data || [])
      .map((w: any) => ({
        wardId: w.WardID as number,    // integer — dùng cho branch.wardId
        code: w.WardCode as string,    // string  — dùng cho wardCode (user + branch)
        name: w.WardName as string,
      }))
      .sort((left: { name: string }, right: { name: string }) =>
        left.name.localeCompare(right.name, "vi"),
      )
    return NextResponse.json(wards)
  } catch {
    return NextResponse.json({ error: "Không thể tải phường/xã" }, { status: 500 })
  }
}
