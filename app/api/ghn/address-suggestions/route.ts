import { NextRequest, NextResponse } from "next/server"

const NOMINATIM = "https://nominatim.openstreetmap.org/search"
const JAVA_API_URL = process.env.JAVA_API_URL ?? "http://api:8004/api"

type AddressSuggestion = {
  label: string
  province: string
  district: string
  ward: string
  lat?: number
  lng?: number
}

type Scope = {
  province: string
  district: string
  ward: string
}

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "")

const normalizeScopeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(
      /\b(thanh pho|tp|tp\.|tinh|quan|q|q\.|huyen|h|h\.|phuong|p|p\.|xa|thi tran|thi xa)\b/g,
      " "
    )
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

const hasText = (value: string) => value.trim().length > 0

const matchesScopeValue = (expected: string, ...actualValues: Array<string | undefined>) => {
  if (!hasText(expected)) return true

  const normalizedExpected = normalizeScopeText(expected)
  if (!normalizedExpected) return true

  return actualValues.some((value) => {
    const normalizedActual = normalizeScopeText(value ?? "")
    return (
      normalizedActual.length > 0 &&
      (normalizedActual.includes(normalizedExpected) ||
        normalizedExpected.includes(normalizedActual))
    )
  })
}

const isSuggestionWithinScope = (suggestion: AddressSuggestion, scope: Scope) =>
  matchesScopeValue(scope.province, suggestion.province, suggestion.label) &&
  matchesScopeValue(scope.district, suggestion.district, suggestion.label) &&
  matchesScopeValue(scope.ward, suggestion.ward, suggestion.label)

const dedupeSuggestions = (suggestions: AddressSuggestion[]) => {
  const seen = new Set<string>()
  return suggestions.filter((suggestion) => {
    const key = [
      normalizeScopeText(suggestion.label),
      suggestion.lat?.toFixed(6) ?? "",
      suggestion.lng?.toFixed(6) ?? "",
    ].join("|")

    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const isAddressSuggestion = (
  suggestion: AddressSuggestion | null
): suggestion is AddressSuggestion => suggestion !== null

const sanitizeSuggestions = (raw: unknown, scope: Scope) => {
  if (!Array.isArray(raw)) return []

  const suggestions: AddressSuggestion[] = raw
    .map((item): AddressSuggestion | null => {
      if (!item || typeof item !== "object") return null

      const suggestion = item as Record<string, unknown>
      return {
        label: String(suggestion.label ?? "").trim(),
        province: String(suggestion.province ?? "").trim(),
        district: String(suggestion.district ?? "").trim(),
        ward: String(suggestion.ward ?? "").trim(),
        lat: typeof suggestion.lat === "number" ? suggestion.lat : Number(suggestion.lat ?? NaN),
        lng: typeof suggestion.lng === "number" ? suggestion.lng : Number(suggestion.lng ?? NaN),
      }
    })
    .filter(isAddressSuggestion)
    .filter((suggestion) => Boolean(suggestion.label) && isSuggestionWithinScope(suggestion, scope))
    .slice(0, 8)

  return dedupeSuggestions(suggestions)
}

const mapNominatimResults = (raw: unknown, scope: Scope) => {
  if (!Array.isArray(raw)) return []

  const suggestions: AddressSuggestion[] = raw
    .map((item): AddressSuggestion | null => {
      if (!item || typeof item !== "object") return null

      const suggestion = item as Record<string, any>
      const addr = suggestion.address ?? {}
      const province = addr.state || addr.city || addr.region || ""
      const district =
        addr.city_district || addr.county || addr.state_district || addr.municipality || ""
      const ward =
        addr.suburb ||
        addr.quarter ||
        addr.city_block ||
        addr.neighbourhood ||
        addr.village ||
        addr.hamlet ||
        ""
      const street = [addr.house_number, addr.road, addr.building]
        .filter(Boolean)
        .join(" ")
        .trim()
      const label = [street, ward, district, province].filter(Boolean).join(", ")

      return {
        label,
        province,
        district,
        ward,
        lat: Number(suggestion.lat ?? NaN),
        lng: Number(suggestion.lon ?? NaN),
      }
    })
    .filter(isAddressSuggestion)
    .filter((suggestion) => Boolean(suggestion.label) && isSuggestionWithinScope(suggestion, scope))
    .slice(0, 8)

  return dedupeSuggestions(suggestions)
}

const fetchBackendSuggestions = async (input: string, scope: Scope) => {
  const backendUrl = new URL(
    `${trimTrailingSlash(JAVA_API_URL)}/ghn/address-suggestions`
  )

  backendUrl.searchParams.set("input", input)
  if (hasText(scope.province)) backendUrl.searchParams.set("province", scope.province)
  if (hasText(scope.district)) backendUrl.searchParams.set("district", scope.district)
  if (hasText(scope.ward)) backendUrl.searchParams.set("ward", scope.ward)

  const response = await fetch(backendUrl.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  })

  if (!response.ok) return []

  return sanitizeSuggestions(await response.json(), scope)
}

const fetchNominatimSuggestions = async (input: string, scope: Scope) => {
  const params = new URLSearchParams({
    q: [input, scope.ward, scope.district, scope.province, "Việt Nam"]
      .filter(hasText)
      .join(", "),
    format: "json",
    countrycodes: "vn",
    addressdetails: "1",
    limit: "10",
    "accept-language": "vi",
  })

  const response = await fetch(`${NOMINATIM}?${params.toString()}`, {
    headers: {
      "User-Agent": "AgriShrimp/1.0 (contact@agrishrimp.vn)",
      "Accept-Language": "vi",
    },
    cache: "no-store",
  })

  if (!response.ok) return []

  return mapNominatimResults(await response.json(), scope)
}

export async function GET(request: NextRequest) {
  const input = request.nextUrl.searchParams.get("input")?.trim() ?? ""
  const scope: Scope = {
    province: request.nextUrl.searchParams.get("province")?.trim() ?? "",
    district: request.nextUrl.searchParams.get("district")?.trim() ?? "",
    ward: request.nextUrl.searchParams.get("ward")?.trim() ?? "",
  }

  if (input.length < 2) {
    return NextResponse.json([])
  }

  try {
    const backendSuggestions = await fetchBackendSuggestions(input, scope)
    if (backendSuggestions.length > 0) {
      return NextResponse.json(backendSuggestions)
    }
  } catch {
    // Fall through to Nominatim when backend geocoding is unavailable.
  }

  try {
    const nominatimSuggestions = await fetchNominatimSuggestions(input, scope)
    return NextResponse.json(nominatimSuggestions)
  } catch {
    return NextResponse.json([])
  }
}
