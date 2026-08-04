import { NextRequest, NextResponse } from "next/server";
import type { PlaceResult } from "@/lib/places";

export type { PlaceResult };

type NominatimItem = {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  type?: string;
  class?: string;
  address?: {
    amenity?: string;
    building?: string;
    leisure?: string;
    tourism?: string;
    theatre?: string;
    stadium?: string;
    name?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    "ISO3166-2-lvl4"?: string;
  };
};

function extractVenueName(item: NominatimItem): string {
  const a = item.address;
  return (
    item.name ||
    a?.amenity ||
    a?.stadium ||
    a?.theatre ||
    a?.leisure ||
    a?.tourism ||
    a?.building ||
    a?.name ||
    item.display_name.split(",")[0]?.trim() ||
    "Selected place"
  );
}

function extractCity(item: NominatimItem): string {
  const a = item.address;
  return a?.city || a?.town || a?.village || a?.municipality || a?.county || "";
}

function extractState(item: NominatimItem): string {
  const a = item.address;
  const iso = a?.["ISO3166-2-lvl4"];
  if (iso && iso.includes("-")) {
    return iso.split("-")[1] || "";
  }
  return a?.state || "";
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ results: [] as PlaceResult[] });
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "6");
  url.searchParams.set("countrycodes", "us,ca");

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": "ConcertCostTracker/1.0 (localhost student project)",
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Venue search is temporarily unavailable. Try again in a moment." },
      { status: 502 }
    );
  }

  const data = (await response.json()) as NominatimItem[];

  const results: PlaceResult[] = data.map((item) => ({
    id: String(item.place_id),
    name: extractVenueName(item),
    displayName: item.display_name,
    city: extractCity(item),
    state: extractState(item),
    lat: Number(item.lat),
    lon: Number(item.lon),
  }));

  return NextResponse.json({ results });
}
