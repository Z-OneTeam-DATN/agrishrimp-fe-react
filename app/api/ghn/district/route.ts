import { NextRequest, NextResponse } from "next/server"

const GHN_TOKEN = process.env.GHN_TOKEN ?? ""
const GHN_BASE = "https://online-gateway.ghn.vn/shiip/public-api/master-data"

export async function GET(request: NextRequest) {
  const provinceId = request.nextUrl.searchParams.get("province_id")
  if (!provinceId) {
    return NextResponse.json({ error: "Thiếu province_id" }, { status: 400 })
  }

  try {
    const res = await fetch(`${GHN_BASE}/district?province_id=${provinceId}`, {
      headers: { Token: GHN_TOKEN },
      next: { revalidate: 86400 },
    })
    const json = await res.json()
    const districts = (json.data || []).map((d: any) => ({
      id: d.DistrictID,
      name: d.DistrictName,
    }))
    return NextResponse.json(districts)
  } catch {
    return NextResponse.json({ error: "Không thể tải quận/huyện" }, { status: 500 })
  }
}
