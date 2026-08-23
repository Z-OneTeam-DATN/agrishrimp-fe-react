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

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildInputVariants(input: string) {
  const variants = new Set<string>();
  const addVariant = (value: string) => {
    const normalizedValue = value.trim();
    if (normalizedValue.length < 3) return;
    variants.add(normalizedValue);
    const asciiValue = normalizeSearchText(normalizedValue);
    if (asciiValue.length >= 3) {
      variants.add(asciiValue);
    }
  };
  const trimmed = input.trim();
  addVariant(trimmed);

  const withoutAdminTail = trimmed
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)[0];
  if (withoutAdminTail) {
    addVariant(withoutAdminTail);
  }

  for (const value of Array.from(variants)) {
    const withoutLeadingHouseNumber = value
      .replace(/^([0-9][0-9a-zA-Z/-]*\s*)+/, "")
      .trim();
    addVariant(withoutLeadingHouseNumber);

    const withoutExtension = value
      .replace(/\b(noi dai|noi dai\.|extended)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    addVariant(withoutExtension);

    const withoutHouseNumberAndExtension = withoutLeadingHouseNumber
      .replace(/\b(noi dai|noi dai\.|extended)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    addVariant(withoutHouseNumberAndExtension);
  }

  return Array.from(variants).filter((value) => value.length >= 3);
}

function scoreByScope(item: any, province: string, district: string, ward: string) {
  const label = normalizeSearchText(item.label || "");
  const expectedProvince = normalizeSearchText(province);
  const expectedDistrict = normalizeSearchText(district);
  const expectedWard = normalizeSearchText(ward);

  let score = 0;
  if (expectedProvince && label.includes(expectedProvince)) {
    score += 1;
  }
  if (expectedDistrict && label.includes(expectedDistrict)) {
    score += 2;
  }
  if (expectedWard && label.includes(expectedWard)) {
    score += 4;
  }
  return score;
}

export async function GET(request: NextRequest) {
  const input = request.nextUrl.searchParams.get("input")?.trim() ?? "";
  const province = request.nextUrl.searchParams.get("province")?.trim() ?? "";
  const district = request.nextUrl.searchParams.get("district")?.trim() ?? "";
  const ward = request.nextUrl.searchParams.get("ward")?.trim() ?? "";

  if (input.length < 3 || !province) {
    return NextResponse.json([]);
  }

  const inputVariants = buildInputVariants(input)
    .sort((left, right) => left.length - right.length)
    .slice(0, 4);
  const provinceAscii = normalizeSearchText(province);
  const districtAscii = normalizeSearchText(district);
  const queryCandidates = inputVariants
    .flatMap((inputVariant) => [
      [inputVariant, district, province, "Vietnam"],
      [inputVariant, districtAscii, provinceAscii, "Vietnam"],
      [inputVariant, province, "Vietnam"],
      [inputVariant, provinceAscii, "Vietnam"],
    ])
    .map((parts) => parts.filter(Boolean).join(", "))
    .filter((query, index, queries) => queries.indexOf(query) === index)
    .slice(0, 8);

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
        .sort(
          (left: any, right: any) =>
            scoreByScope(right, province, district, ward) -
            scoreByScope(left, province, district, ward),
        )
        .slice(0, 5),
    );
  } catch (error) {
    console.error("[/api/nominatim/search] Error:", error);
    return NextResponse.json([]);
  }
}
