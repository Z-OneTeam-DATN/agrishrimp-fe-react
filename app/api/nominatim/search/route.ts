import { NextRequest, NextResponse } from "next/server";

const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";

export async function GET(request: NextRequest) {
  const input = request.nextUrl.searchParams.get("input")?.trim() ?? "";
  const province = request.nextUrl.searchParams.get("province")?.trim() ?? "";
  const district = request.nextUrl.searchParams.get("district")?.trim() ?? "";
  const ward = request.nextUrl.searchParams.get("ward")?.trim() ?? "";

  if (input.length < 3 || !province) {
    return NextResponse.json([]);
  }

  const scopedQuery = [input, ward, district, province, "Việt Nam"]
    .filter(Boolean)
    .join(", ");

  try {
    const params = new URLSearchParams({
      q: scopedQuery,
      format: "jsonv2",
      addressdetails: "1",
      countrycodes: "vn",
      limit: "5",
    });

    const response = await fetch(`${NOMINATIM_SEARCH_URL}?${params.toString()}`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Accept-Language": "vi",
        "User-Agent": "AgriShrimp/1.0 (branch-address-search)",
      },
    });

    if (!response.ok) {
      return NextResponse.json([], { status: response.status });
    }

    const results = await response.json();
    if (!Array.isArray(results)) {
      return NextResponse.json([]);
    }

    return NextResponse.json(
      results
        .map((item: any) => {
          const address = item?.address ?? {};
          return {
            label: item?.display_name || scopedQuery,
            province:
              address.city ||
              address.state ||
              address.province ||
              province,
            district:
              address.city_district ||
              address.county ||
              address.district ||
              district,
            ward:
              address.suburb ||
              address.quarter ||
              address.village ||
              address.hamlet ||
              ward,
            lat: item?.lat ? Number(item.lat) : undefined,
            lng: item?.lon ? Number(item.lon) : undefined,
          };
        })
        .filter(
          (item: any) =>
            Number.isFinite(item.lat) && Number.isFinite(item.lng),
        ),
    );
  } catch (error) {
    console.error("[/api/nominatim/search] Error:", error);
    return NextResponse.json([]);
  }
}
