import { NextResponse } from "next/server"

const GHN_TOKEN = process.env.GHN_TOKEN ?? ""
const GHN_BASE = "https://online-gateway.ghn.vn/shiip/public-api/master-data"

export async function GET() {
  try {
    const res = await fetch(`${GHN_BASE}/province`, {
      headers: { Token: GHN_TOKEN },
      next: { revalidate: 86400 }, // cache 24h — data rarely changes
    })
    const json = await res.json()
    const provinces = (json.data || []).map((p: any) => ({
      id: p.ProvinceID,
      name: p.ProvinceName,
    }))
    return NextResponse.json(provinces)
  } catch {
    return NextResponse.json({ error: "Không thể tải tỉnh/thành" }, { status: 500 })
  }
}
