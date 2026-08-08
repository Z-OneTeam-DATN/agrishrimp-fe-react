import { NextResponse } from "next/server"

const JAVA_API_URL = process.env.JAVA_API_URL ?? "http://localhost:8004/api"

export async function GET() {
  try {
    const res = await fetch(`${JAVA_API_URL}/ghn/province`, {
      cache: "no-store",
    })

    if (!res.ok) {
      return NextResponse.json({ error: "Không thể tải tỉnh/thành" }, { status: res.status })
    }

    const json = await res.json()
    const provinces = (json.data || [])
      .map((p: any) => ({
        id: p.ProvinceID,
        name: p.ProvinceName,
      }))
      .sort((left: { name: string }, right: { name: string }) =>
        left.name.localeCompare(right.name, "vi"),
      )
    return NextResponse.json(provinces)
  } catch {
    return NextResponse.json({ error: "Không thể tải tỉnh/thành" }, { status: 500 })
  }
}
