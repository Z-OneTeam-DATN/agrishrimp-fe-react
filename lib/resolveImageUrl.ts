const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN ?? "https://api.agrishrimp.io.vn";

const FRONTEND_ASSET_PREFIXES = ["/placeholder", "/images/", "/icons/", "/_next/"];

function getFirstImageUrl(imagePath?: string | null) {
  return String(imagePath ?? "")
    .split(",")
    .map((item) => item.trim())
    .find(Boolean);
}

export function resolveImageUrl(
  imagePath?: string | null,
  fallback = "/placeholder.png",
) {
  const normalized = getFirstImageUrl(imagePath);

  if (!normalized) {
    return fallback;
  }

  if (
    normalized.startsWith("data:image") ||
    normalized.startsWith("blob:")
  ) {
    return normalized;
  }

  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    try {
      const imageUrl = new URL(normalized);
      const backendUrl = new URL(BACKEND_ORIGIN);

      if (
        imageUrl.hostname === "api" ||
        imageUrl.hostname === "host.docker.internal"
      ) {
        return `${backendUrl.origin}${imageUrl.pathname}${imageUrl.search}${imageUrl.hash}`;
      }
    } catch {
      return normalized;
    }

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
