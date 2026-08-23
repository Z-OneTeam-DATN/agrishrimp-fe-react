import { NextResponse } from "next/server";

const OSM_TILE_URL = "https://tile.openstreetmap.org";
const TILE_COORDINATE_PATTERN = /^\d+$/;

type TileRouteContext = {
  params: Promise<{
    z: string;
    x: string;
    y: string;
  }>;
};

export async function GET(_request: Request, context: TileRouteContext) {
  const { z, x, y } = await context.params;

  if (
    !TILE_COORDINATE_PATTERN.test(z) ||
    !TILE_COORDINATE_PATTERN.test(x) ||
    !TILE_COORDINATE_PATTERN.test(y) ||
    Number(z) > 19
  ) {
    return NextResponse.json({ error: "Invalid map tile" }, { status: 400 });
  }

  try {
    const tileResponse = await fetch(`${OSM_TILE_URL}/${z}/${x}/${y}.png`, {
      headers: {
        Accept: "image/png,image/*;q=0.8,*/*;q=0.5",
        "User-Agent": "AgriShrimp/1.0 (branch-location-map)",
      },
      next: { revalidate: 86400 },
    });

    if (!tileResponse.ok) {
      return new NextResponse(null, { status: tileResponse.status });
    }

    return new NextResponse(await tileResponse.arrayBuffer(), {
      status: 200,
      headers: {
        "Content-Type": tileResponse.headers.get("content-type") || "image/png",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
