import { NextRequest, NextResponse } from "next/server"

const JAVA_API_URL = process.env.JAVA_API_URL ?? "http://localhost:8004/api"

export async function GET(request: NextRequest) {
  const input = request.nextUrl.searchParams.get("input")?.trim() ?? ""
  const province = request.nextUrl.searchParams.get("province")?.trim() ?? ""
  const district = request.nextUrl.searchParams.get("district")?.trim() ?? ""
  const ward = request.nextUrl.searchParams.get("ward")?.trim() ?? ""

  if (input.length < 3) return NextResponse.json([])

  try {
    const params = new URLSearchParams({ input })
    if (province) params.set("province", province)
    if (district) params.set("district", district)
    if (ward) params.set("ward", ward)

    const res = await fetch(`${JAVA_API_URL}/ghn/address-suggestions?${params.toString()}`, {
      cache: "no-store",
    })

    if (!res.ok) return NextResponse.json([], { status: res.status })

    const suggestions = await res.json()
    return NextResponse.json(Array.isArray(suggestions) ? suggestions : [])
  } catch {
    return NextResponse.json([])
  }
}
