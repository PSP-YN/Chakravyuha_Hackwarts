import { NextRequest, NextResponse } from "next/server";

const BASE = "https://api.agmarknet.gov.in/v1";
const SOURCE_URL = "https://agmarknet.gov.in/home";
const HEADERS = {
  Accept: "application/json, text/plain, */*",
  Origin: "https://agmarknet.gov.in",
  Referer: "https://agmarknet.gov.in/",
  "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36",
};

type Raw = Record<string, unknown>;
type Filters = {
  state_data?: Array<{ state_id: number; state_name: string }>;
  cmdt_data?: Array<{ cmdt_id: number; cmdt_name: string; cmdt_group_id: number }>;
  market_data?: Array<{ id: number; mkt_name: string; state_id: number; district_id: number }>;
  district_data?: Array<{ id: number; district_name: string }>;
};
const jsonError = (message: string, status = 502) =>
  NextResponse.json({ ok: false, records: [], message, source: "AGMARKNET 2.0", sourceUrl: SOURCE_URL }, { status });

async function getFilters(): Promise<Filters> {
  const response = await fetch(`${BASE}/daily-price-arrival/filters`, {
    headers: HEADERS,
    next: { revalidate: 3600 },
  });
  if (!response.ok) throw new Error(`AGMARKNET filters returned HTTP ${response.status}`);
  const payload = await response.json() as { data?: Filters };
  if (!payload.data?.state_data || !payload.data?.cmdt_data || !payload.data?.market_data) {
    throw new Error("AGMARKNET returned an unexpected filter schema.");
  }
  return payload.data;
}

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("mode");
  try {
    const filters = await getFilters();

    if (mode === "filters") {
      const stateName = request.nextUrl.searchParams.get("state") ?? "Karnataka";
      const state = filters.state_data!.find((item) => item.state_name.toLowerCase() === stateName.toLowerCase());
      const districts = new Map((filters.district_data ?? []).map((item) => [item.id, item.district_name]));
      const markets = (filters.market_data ?? [])
        .filter((item) => !state || item.state_id === state.state_id)
        .map((item) => ({
          id: item.id,
          name: item.mkt_name.trim(),
          stateId: item.state_id,
          district: districts.get(item.district_id) ?? "",
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      return NextResponse.json({
        ok: true,
        source: "AGMARKNET 2.0",
        sourceUrl: SOURCE_URL,
        licence: "Government Open Data License - India (underlying AGMARKNET/OGD data)",
        states: filters.state_data!.filter((item) => item.state_name !== "All States/UTs").map((item) => item.state_name).sort(),
        commodities: filters.cmdt_data!.map((item) => ({ id: item.cmdt_id, name: item.cmdt_name })).sort((a, b) => a.name.localeCompare(b.name)),
        stateId: state?.state_id ?? null,
        markets,
        retrievedAt: new Date().toISOString(),
      }, { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=7200" } });
    }

    const marketId = Number(request.nextUrl.searchParams.get("marketId"));
    const stateId = Number(request.nextUrl.searchParams.get("stateId"));
    const commodityId = Number(request.nextUrl.searchParams.get("commodityId"));
    if (![marketId, stateId, commodityId].every((value) => Number.isInteger(value) && value > 0)) {
      return jsonError("Choose a state, mandi and commodity to load prices.", 400);
    }
    const market = filters.market_data!.find((item) => item.id === marketId && item.state_id === stateId);
    const state = filters.state_data!.find((item) => item.state_id === stateId);
    const commodity = filters.cmdt_data!.find((item) => item.cmdt_id === commodityId);
    if (!market || !state || !commodity) return jsonError("The selected market or commodity is not in the current AGMARKNET filters.", 400);

    const url = new URL(`${BASE}/prices-and-arrivals/market-price/lastweek`);
    url.searchParams.set("marketId", String(marketId));
    url.searchParams.set("stateId", String(stateId));
    url.searchParams.set("commodityId", String(commodityId));
    url.searchParams.set("includeExcel", "false");
    const response = await fetch(url, { headers: HEADERS, next: { revalidate: 900 } });
    if (response.status === 429) {
      return jsonError("AGMARKNET is rate-limiting requests right now. Wait a minute before refreshing.", 429);
    }
    if (!response.ok) return jsonError(`AGMARKNET returned HTTP ${response.status}. Try again later.`, 502);
    const payload = await response.json() as { success?: boolean; message?: string; columns?: Array<{ key: string; title: string }>; data?: Raw[] };
    if (payload.success === false) return jsonError(payload.message ?? "AGMARKNET did not return a report.", 404);

    const dateKeys = (payload.columns ?? [])
      .map((column) => column.key)
      .filter((key) => /^\d{4}-\d{2}-\d{2}$/.test(key))
      .sort((a, b) => b.localeCompare(a));
    const records = (payload.data ?? []).flatMap((row) => dateKeys.flatMap((date) => {
      const value = row[date];
      if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return [];
      return [{
        state: state.state_name,
        district: (filters.district_data ?? []).find((item) => item.id === market.district_id)?.district_name ?? "",
        market: market.mkt_name.trim(),
        commodity: commodity.cmdt_name,
        variety: String(row.variety ?? "Not specified"),
        arrivalDate: date,
        price: value,
        unit: String(row.unitOfPrice ?? "Rs./Quintal"),
      }];
    })).sort((a, b) => b.arrivalDate.localeCompare(a.arrivalDate) || a.variety.localeCompare(b.variety));

    return NextResponse.json({
      ok: true,
      source: "AGMARKNET 2.0",
      sourceUrl: SOURCE_URL,
      licence: "Government Open Data License - India",
      retrievedAt: new Date().toISOString(),
      state: state.state_name,
      market: market.mkt_name.trim(),
      commodity: commodity.cmdt_name,
      latestDate: records[0]?.arrivalDate ?? null,
      records,
      message: records.length ? undefined : "No price was reported for this commodity at this mandi in the last seven days. NR means not reported; it is not zero.",
    }, { headers: { "Cache-Control": "s-maxage=900, stale-while-revalidate=1800" } });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to reach the public AGMARKNET service.", 502);
  }
}
