import { NextRequest, NextResponse } from "next/server"

const GHN_TOKEN = process.env.GHN_TOKEN ?? ""
const GHN_BASE = "https://online-gateway.ghn.vn/shiip/public-api/master-data"

export async function GET(request: NextRequest) {
  const districtId = request.nextUrl.searchParams.get("district_id")
  if (!districtId) {
    return NextResponse.json({ error: "Thiếu district_id" }, { status: 400 })
  }

  try {
    const res = await fetch(`${GHN_BASE}/ward?district_id=${districtId}`, {
      headers: { Token: GHN_TOKEN },
      next: { revalidate: 86400 },
    })
    const json = await res.json()
    const wards = (json.data || []).map((w: any) => ({
      wardId: w.WardID as number,    // integer — dùng cho branch.wardId
      code: w.WardCode as string,    // string  — dùng cho wardCode (user + branch)
      name: w.WardName as string,
    }))
    return NextResponse.json(wards)
  } catch {
    return NextResponse.json({ error: "Không thể tải phường/xã" }, { status: 500 })
  }
}
