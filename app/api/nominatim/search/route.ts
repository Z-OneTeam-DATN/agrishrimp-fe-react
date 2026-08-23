import { NextRequest, NextResponse } from "next/server";

const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";

async function searchNominatim(query: string) {
  const params = new URLSearchParams({
    q: query,
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
    return [];
  }

  const results = await response.json();
  return Array.isArray(results) ? results : [];
}

export async function GET(request: NextRequest) {
  const input = request.nextUrl.searchParams.get("input")?.trim() ?? "";
  const province = request.nextUrl.searchParams.get("province")?.trim() ?? "";
  const district = request.nextUrl.searchParams.get("district")?.trim() ?? "";
  const ward = request.nextUrl.searchParams.get("ward")?.trim() ?? "";

  if (input.length < 3 || !province) {
    return NextResponse.json([]);
  }

  const queryCandidates = [
    [input, ward, district, province, "Vietnam"],
    [input, district, province, "Vietnam"],
    [input, province, "Vietnam"],
  ]
    .map((parts) => parts.filter(Boolean).join(", "))
    .filter((query, index, queries) => queries.indexOf(query) === index);

  try {
    const mergedResults: any[] = [];
    for (const query of queryCandidates) {
      const results = await searchNominatim(query);
      mergedResults.push(...results);
      if (mergedResults.length >= 5) {
        break;
      }
    }

    return NextResponse.json(
      mergedResults
        .map((item: any) => {
          const address = item?.address ?? {};
          return {
            label: item?.display_name || queryCandidates[0],
            province: address.city || address.state || address.province || province,
            district: address.city_district || address.county || address.district || district,
            ward: address.suburb || address.quarter || address.village || address.hamlet || ward,
            lat: item?.lat ? Number(item.lat) : undefined,
            lng: item?.lon ? Number(item.lon) : undefined,
          };
        })
        .filter((item: any) => Number.isFinite(item.lat) && Number.isFinite(item.lng))
        .filter(
          (item: any, index: number, array: any[]) =>
            array.findIndex(
              (current) =>
                current.label === item.label ||
                `${current.lat},${current.lng}` === `${item.lat},${item.lng}`,
            ) === index,
        )
        .slice(0, 5),
    );
  } catch (error) {
    console.error("[/api/nominatim/search] Error:", error);
    return NextResponse.json([]);
  }
}
