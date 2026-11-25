import { NextRequest, NextResponse } from "next/server";

const RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";
const SOURCE_URL = "https://data.gov.in/resource/current-daily-price-various-commodities-various-markets-mandi";

type RawRecord = Record<string, string | number | null | undefined>;

const field = (row: RawRecord, ...keys: string[]) => {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") return String(value).trim();
  }
  return "";
};

export async function GET(request: NextRequest) {
  const apiKey = process.env.DATA_GOV_IN_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      configured: false,
      source: "AGMARKNET via data.gov.in",
      sourceUrl: SOURCE_URL,
      records: [],
      message: "Market data connector is not configured. Add DATA_GOV_IN_API_KEY as a server-only Vercel environment variable."
    }, { status: 503 });
  }

  const state = request.nextUrl.searchParams.get("state")?.trim() ?? "";
  const commodity = request.nextUrl.searchParams.get("commodity")?.trim() ?? "";
  const limit = Math.min(1000, Math.max(1, Number(request.nextUrl.searchParams.get("limit") ?? 100)));
  const url = new URL(`https://api.data.gov.in/resource/${RESOURCE_ID}`);
  url.searchParams.set("api-key", apiKey);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", String(limit));
  if (state && state !== "All India") url.searchParams.set("filters[state]", state);
  if (commodity) url.searchParams.set("filters[commodity]", commodity);

  try {
    const response = await fetch(url, { next: { revalidate: 1800 } });
    if (!response.ok) {
      return NextResponse.json({
        configured: true,
        source: "AGMARKNET via data.gov.in",
        sourceUrl: SOURCE_URL,
        records: [],
        message: `Government data service returned HTTP ${response.status}. Try again later.`
      }, { status: 502 });
    }
    const payload = await response.json() as { records?: RawRecord[]; total?: number; count?: number };
    const records = (payload.records ?? []).map((row) => ({
      state: field(row, "state"),
      district: field(row, "district"),
      market: field(row, "market"),
      commodity: field(row, "commodity"),
      variety: field(row, "variety"),
      arrivalDate: field(row, "arrival_date", "date"),
      minPrice: field(row, "min_price", "min_price_per_quintal"),
      maxPrice: field(row, "max_price", "max_price_per_quintal"),
      modalPrice: field(row, "modal_price", "modal_price_per_quintal"),
      unit: "₹ / quintal"
    })).filter((row) => row.state && row.market && row.commodity && row.arrivalDate);

    return NextResponse.json({
      configured: true,
      source: "AGMARKNET via data.gov.in",
      sourceUrl: SOURCE_URL,
      licence: "Government Open Data License - India",
      retrievedAt: new Date().toISOString(),
      total: payload.total ?? records.length,
      records
    }, { headers: { "Cache-Control": "s-maxage=1800, stale-while-revalidate=3600" } });
  } catch {
    return NextResponse.json({
      configured: true,
      source: "AGMARKNET via data.gov.in",
      sourceUrl: SOURCE_URL,
      records: [],
      message: "Unable to reach the government market data service."
    }, { status: 502 });
  }
}
