import { NextRequest, NextResponse } from "next/server"

const NOMINATIM = "https://nominatim.openstreetmap.org/search"

export async function GET(request: NextRequest) {
  const input = request.nextUrl.searchParams.get("input")?.trim() ?? ""

  if (input.length < 3) return NextResponse.json([])

  try {
    const params = new URLSearchParams({
      q: `${input}, Việt Nam`,
      format: "json",
      countrycodes: "vn",
      addressdetails: "1",
      limit: "5",
      "accept-language": "vi",
    })

    const res = await fetch(`${NOMINATIM}?${params}`, {
      headers: {
        "User-Agent": "AgriShrimp/1.0 (contact@agrishrimp.vn)",
        "Accept-Language": "vi",
      },
    })

    if (!res.ok) return NextResponse.json([])

    const data: any[] = await res.json()

    const suggestions = data
      .filter((item) => item.address)
      .map((item) => {
        const addr = item.address

        // Province: state (tỉnh/thành phố)
        const province = addr.state || addr.city || ""

        // District: city_district → county → municipality
        const district =
          addr.city_district || addr.county || addr.municipality || addr.town || ""

        // Ward: suburb → quarter → neighbourhood → village
        const ward =
          addr.suburb || addr.quarter || addr.neighbourhood || addr.village || ""

        // Build readable label: "Số nhà Đường, Phường, Quận, Tỉnh"
        const street = [addr.house_number, addr.road].filter(Boolean).join(" ")
        const label = [street, ward, district, province].filter(Boolean).join(", ")

        return { label, province, district, ward, lat: parseFloat(item.lat), lng: parseFloat(item.lon) }
      })
      .filter((s) => s.province && s.label)

    return NextResponse.json(suggestions)
  } catch {
    return NextResponse.json([])
  }
}
