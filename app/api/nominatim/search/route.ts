import { NextRequest, NextResponse } from "next/server";

const OPENMAP_BASE_URL = "https://mapapis.openmap.vn/v1";
const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";
const PHOTON_SEARCH_URL = "https://photon.komoot.io/api/";

async function searchOpenMapForward(query: string, apiKey: string) {
  const params = new URLSearchParams({
    text: query,
    size: "5",
    admin_v2: "true",
    apikey: apiKey,
  });

  const response = await fetch(
    `${OPENMAP_BASE_URL}/geocode/forward?${params.toString()}`,
    {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    return [];
  }

  const results = await response.json();
  return Array.isArray(results?.features) ? results.features : [];
}

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

async function searchPhoton(query: string) {
  const params = new URLSearchParams({
    q: query,
    limit: "5",
  });

  const response = await fetch(`${PHOTON_SEARCH_URL}?${params.toString()}`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "User-Agent": "AgriShrimp/1.0 (branch-address-search)",
    },
  });

  if (!response.ok) {
    return [];
  }

  const results = await response.json();
  return Array.isArray(results?.features) ? results.features : [];
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
      .replace(/\b(noi dai|noi dai\.|nối dài|nối dài\.|extended)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    addVariant(withoutExtension);

    const withoutHouseNumberAndExtension = withoutLeadingHouseNumber
      .replace(/\b(noi dai|noi dai\.|nối dài|nối dài\.|extended)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    addVariant(withoutHouseNumberAndExtension);
  }

  return Array.from(variants).filter((value) => value.length >= 3);
}

function scoreByScope(item: any, province: string, district: string, ward: string) {
  const actualProvince = normalizeSearchText(item.province || "");
  const actualDistrict = normalizeSearchText(item.district || "");
  const actualWard = normalizeSearchText(item.ward || "");
  const expectedProvince = normalizeSearchText(province);
  const expectedDistrict = normalizeSearchText(district);
  const expectedWard = normalizeSearchText(ward);

  let score = 0;
  if (
    expectedProvince &&
    actualProvince &&
    (actualProvince.includes(expectedProvince) ||
      expectedProvince.includes(actualProvince))
  ) {
    score += 1;
  }
  if (expectedDistrict && actualDistrict) {
    score +=
      actualDistrict.includes(expectedDistrict) ||
      expectedDistrict.includes(actualDistrict)
        ? 12
        : -12;
  }
  if (expectedWard && actualWard) {
    score +=
      actualWard.includes(expectedWard) || expectedWard.includes(actualWard)
        ? 16
        : -16;
  }
  return score;
}

function stripAdministrativePrefix(value: string) {
  return value
    .replace(
      /\b(phường|phuong|xã|xa|thị trấn|thi tran|quận|quan|huyện|huyen|thành phố|thanh pho|tp)\b\.?/gi,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();
}

function scoreInputVariant(value: string) {
  const normalizedValue = normalizeSearchText(value);
  let penalty = value.length;
  if (/^\d/.test(normalizedValue)) penalty += 80;
  if (/\b(noi dai|nối dài|extended)\b/i.test(value)) penalty += 40;
  if (value === normalizedValue) penalty += 8;
  return penalty;
}

function mapNominatimItem(item: any, fallbackLabel: string, accuracy = "address") {
  const address = item?.address ?? {};
  return {
    label: item?.display_name || fallbackLabel,
    province: address.city || address.state || address.province || "",
    district: address.city_district || address.county || address.district || "",
    ward: address.suburb || address.quarter || address.village || address.hamlet || "",
    lat: item?.lat ? Number(item.lat) : undefined,
    lng: item?.lon ? Number(item.lon) : undefined,
    source: "nominatim",
    accuracy,
  };
}

function mapPhotonItem(item: any, fallbackLabel: string, accuracy = "address") {
  const properties = item?.properties ?? {};
  const coordinates = item?.geometry?.coordinates ?? [];
  const label = [
    properties.name,
    properties.housenumber
      ? `${properties.housenumber} ${properties.street || ""}`.trim()
      : properties.street,
    properties.district,
    properties.city,
    properties.state,
    properties.country,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    label: label || fallbackLabel,
    province: properties.state || properties.city || "",
    district: properties.district || properties.county || "",
    ward: properties.locality || properties.suburb || "",
    lat: Number(coordinates[1]),
    lng: Number(coordinates[0]),
    source: "photon",
    accuracy,
  };
}

function mapOpenMapItem(item: any, fallbackLabel: string, accuracy = "address") {
  const properties = item?.properties ?? {};
  const coordinates = item?.geometry?.coordinates ?? [];
  return {
    label: properties.label || properties.name || fallbackLabel,
    province: properties.region || "",
    district: properties.county || "",
    ward: properties.locality || "",
    lat: Number(coordinates[1]),
    lng: Number(coordinates[0]),
    source: "openmapvn",
    accuracy,
    placeId: properties.id || "",
  };
}

function isResultInExpectedProvince(item: any, province: string) {
  const expectedProvince = normalizeSearchText(province);
  const actualProvince = normalizeSearchText(item.province || "");
  const label = normalizeSearchText(item.label || "");
  return (
    !expectedProvince ||
    actualProvince.includes(expectedProvince) ||
    expectedProvince.includes(actualProvince) ||
    label.includes(expectedProvince)
  );
}

function isResultInExpectedWard(item: any, ward: string) {
  const expectedWard = normalizeSearchText(ward);
  const expectedWardName = normalizeSearchText(stripAdministrativePrefix(ward));
  if (!expectedWard && !expectedWardName) return true;

  const actualWard = normalizeSearchText(item.ward || "");
  const label = normalizeSearchText(item.label || "");
  const scopes = [expectedWard, expectedWardName].filter(Boolean);

  return scopes.some(
    (scope) =>
      (actualWard &&
        (actualWard.includes(scope) || scope.includes(actualWard))) ||
      label.includes(scope),
  );
}

function isResultInExpectedScope(item: any, province: string, ward: string) {
  return (
    isResultInExpectedProvince(item, province) &&
    isResultInExpectedWard(item, ward)
  );
}

export async function GET(request: NextRequest) {
  const input = request.nextUrl.searchParams.get("input")?.trim() ?? "";
  const province = request.nextUrl.searchParams.get("province")?.trim() ?? "";
  const district = request.nextUrl.searchParams.get("district")?.trim() ?? "";
  const ward = request.nextUrl.searchParams.get("ward")?.trim() ?? "";
  const openMapApiKey = process.env.OPENMAP_API_KEY?.trim() ?? "";

  if (input.length < 3 || !province) {
    return NextResponse.json([]);
  }

  const inputVariants = buildInputVariants(input)
    .sort((left, right) => scoreInputVariant(left) - scoreInputVariant(right))
    .slice(0, 4);
  const provinceAscii = normalizeSearchText(province);
  const districtAscii = normalizeSearchText(district);
  const wardAscii = normalizeSearchText(ward);
  const provinceName = stripAdministrativePrefix(province);
  const districtName = stripAdministrativePrefix(district);
  const wardName = stripAdministrativePrefix(ward);
  const queryCandidates = inputVariants
    .flatMap((inputVariant) => [
      [inputVariant, wardName, districtName, provinceName, "Vietnam"],
      [inputVariant, districtName, provinceName, "Vietnam"],
      [inputVariant, province, "Vietnam"],
      [inputVariant, wardAscii, districtAscii, provinceAscii, "Vietnam"],
      [inputVariant, provinceAscii, "Vietnam"],
      [inputVariant, districtAscii, provinceAscii, "Vietnam"],
    ])
    .map((parts) => parts.filter(Boolean).join(", "))
    .filter((query, index, queries) => queries.indexOf(query) === index)
    .slice(0, 6);
  const photonQueryCandidates = inputVariants
    .flatMap((inputVariant) => [
      [inputVariant, wardAscii, districtAscii, provinceAscii, "vietnam"],
      [inputVariant, districtAscii, provinceAscii, "vietnam"],
      [inputVariant, provinceAscii, "vietnam"],
    ])
    .map((parts) => normalizeSearchText(parts.filter(Boolean).join(" ")))
    .filter((query, index, queries) => query && queries.indexOf(query) === index)
    .slice(0, 4);
  const openMapQueryCandidates = [
    [input, ward, district, province],
    ...inputVariants.flatMap((inputVariant) => [
      [inputVariant, ward, district, province],
      [inputVariant, district, province],
      [inputVariant, province],
    ]),
  ]
    .map((parts) => parts.filter(Boolean).join(", "))
    .filter((query, index, queries) => query && queries.indexOf(query) === index)
    .slice(0, 8);

  try {
    const openMapResults: any[] = [];
    if (openMapApiKey) {
      for (const query of openMapQueryCandidates) {
        const results = await searchOpenMapForward(query, openMapApiKey);
        const scopedResults = results.filter((item: any) =>
          isResultInExpectedScope(
            mapOpenMapItem(item, openMapQueryCandidates[0]),
            province,
            ward,
          ),
        );
        openMapResults.push(...scopedResults);
        if (scopedResults.length > 0) {
          break;
        }
      }
    }

    let mappedResults: any[] = openMapResults
      .map((item: any) => mapOpenMapItem(item, openMapQueryCandidates[0]))
      .filter((item: any) => Number.isFinite(item.lat) && Number.isFinite(item.lng))
      .filter((item: any) => isResultInExpectedScope(item, province, ward))
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
      );

    const photonResults: any[] = [];
    if (mappedResults.length === 0) {
      for (const query of photonQueryCandidates) {
        const results = await searchPhoton(query);
        photonResults.push(...results);
        if (photonResults.length > 0) {
          break;
        }
      }
    }

    if (mappedResults.length === 0) {
      mappedResults = photonResults
        .map((item: any) => mapPhotonItem(item, photonQueryCandidates[0]))
        .filter((item: any) => Number.isFinite(item.lat) && Number.isFinite(item.lng))
        .filter((item: any) => isResultInExpectedScope(item, province, ward))
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
        );
    }

    if (mappedResults.length === 0) {
      const mergedResults: any[] = [];
      for (const query of queryCandidates) {
        const results = await searchNominatim(query);
        mergedResults.push(...results);
        if (mergedResults.length > 0) {
          break;
        }
      }

      mappedResults = mergedResults
        .map((item: any) => mapNominatimItem(item, queryCandidates[0]))
        .filter((item: any) => Number.isFinite(item.lat) && Number.isFinite(item.lng))
        .filter((item: any) => isResultInExpectedScope(item, province, ward));
    }

    if (mappedResults.length === 0) {
      const fallbackQueries = [
        [ward, district, province, "Vietnam"],
        [wardName, districtName, provinceName, "Vietnam"],
        [district, province, "Vietnam"],
        [districtName, provinceName, "Vietnam"],
        [province, "Vietnam"],
        [provinceName, "Vietnam"],
      ]
        .map((parts) => parts.filter(Boolean).join(", "))
        .filter((query, index, queries) => query && queries.indexOf(query) === index);

      for (const query of fallbackQueries) {
        const fallbackResults = await searchNominatim(query);
        mappedResults.push(
          ...fallbackResults.map((item: any) =>
            mapNominatimItem(item, query, ward ? "ward" : "district"),
          ),
        );
        mappedResults = mappedResults.filter((item: any) =>
          isResultInExpectedScope(item, province, ward),
        );
        if (mappedResults.length > 0) break;
      }
    }

    return NextResponse.json(mappedResults.slice(0, 5));
  } catch (error) {
    console.error("[/api/nominatim/search] Error:", error);
    return NextResponse.json([]);
  }
}
