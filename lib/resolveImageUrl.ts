const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN ?? "https://api.agrishrimp.io.vn";

const FRONTEND_ASSET_PREFIXES = ["/placeholder", "/images/", "/icons/", "/_next/"];

export function resolveImageUrl(
  imagePath?: string | null,
  fallback = "/placeholder.png",
) {
  const normalized = imagePath?.trim();

  if (!normalized) {
    return fallback;
  }

  if (
    normalized.startsWith("data:image") ||
    normalized.startsWith("blob:") ||
    normalized.startsWith("http://") ||
    normalized.startsWith("https://")
  ) {
    return normalized;
  }

  if (FRONTEND_ASSET_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
    return normalized;
  }

  if (normalized.startsWith("//")) {
    return `https:${normalized}`;
  }

  return `${BACKEND_ORIGIN}${normalized.startsWith("/") ? "" : "/"}${normalized}`;
}
