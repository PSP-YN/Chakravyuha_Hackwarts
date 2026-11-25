"use client";

import { useEffect, useMemo, useState } from "react";
import { Localize } from "@/components/language-provider";

type StateOption = string;
type CommodityOption = { id: number; name: string };
type MarketOption = { id: number; name: string; stateId: number; district: string };
type PriceRow = {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  arrivalDate: string;
  price: number;
  unit: string;
};
type FiltersResponse = {
  ok: boolean;
  states: StateOption[];
  commodities: CommodityOption[];
  markets: MarketOption[];
  stateId: number | null;
  source?: string;
  sourceUrl?: string;
  licence?: string;
  message?: string;
};
type PriceResponse = {
  ok: boolean;
  records: PriceRow[];
  source?: string;
  sourceUrl?: string;
  licence?: string;
  retrievedAt?: string;
  latestDate?: string | null;
  state?: string;
  market?: string;
  commodity?: string;
  message?: string;
};
const formatPrice = (value: number) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 0,
}).format(value);

export function MarketPrices() {
  const [state, setState] = useState("Karnataka");
  const [filters, setFilters] = useState<FiltersResponse | null>(null);
  const [marketId, setMarketId] = useState("");
  const [commodityId, setCommodityId] = useState("");
  const [query, setQuery] = useState("");
  const [payload, setPayload] = useState<PriceResponse | null>(null);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setFiltersLoading(true);
    setFilters(null);
    setMarketId("");
    setPayload(null);
    fetch(`/api/market-prices?mode=filters&state=${encodeURIComponent(state)}`, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json() as FiltersResponse;
        if (!response.ok || !body.ok) throw new Error(body.message || "Could not load AGMARKNET filters.");
        setFilters(body);
        const defaultCommodity = body.commodities.find((item) => item.name.toLowerCase() === "tomato") ?? body.commodities[0];
        setCommodityId(defaultCommodity ? String(defaultCommodity.id) : "");
        const defaultMarket = state === "Karnataka"
          ? body.markets.find((item) => item.name.toLowerCase().includes("binny mill"))
          : undefined;
        setMarketId(String(defaultMarket?.id ?? body.markets[0]?.id ?? ""));
      })
      .catch((reason: unknown) => {
        if (reason instanceof Error && reason.name !== "AbortError") setError(reason.message);
      })
      .finally(() => setFiltersLoading(false));
    return () => controller.abort();
  }, [state]);

  useEffect(() => {
    if (!filters?.stateId || !marketId || !commodityId) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setPayload(null);
    fetch(`/api/market-prices?stateId=${filters.stateId}&marketId=${marketId}&commodityId=${commodityId}&v=${reload}`, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json() as PriceResponse;
        if (!response.ok || !body.ok) throw new Error(body.message || "Market price request failed.");
        setPayload(body);
      })
      .catch((reason: unknown) => {
        if (reason instanceof Error && reason.name !== "AbortError") setError(reason.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [filters?.stateId, marketId, commodityId, reload]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (payload?.records ?? []).filter((row) =>
      !needle || [row.commodity, row.variety, row.market, row.district, row.state].join(" ").toLowerCase().includes(needle)
    );
  }, [payload, query]);

  return (
    <Localize><section className="market-prices" id="market-prices">
      <div className="market-prices-head">
        <div>
          <small>PUBLIC MARKET INTELLIGENCE / AGMARKNET 2.0</small>
          <h2>Mandi prices, <em>from the source.</em></h2>
          <p>Official market-reported wholesale prices. Choose a state, mandi and commodity to inspect the latest seven-day variety-wise report. These are reference prices, not buyer offers.</p>
        </div>
        <div className="market-state">
          <label htmlFor="market-state-select">State</label>
          <select id="market-state-select" value={state} onChange={(event) => setState(event.target.value)} disabled={filtersLoading}>
            {(filters?.states ?? ["Karnataka"]).map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>
      </div>

      <div className="market-data-meta">
        <span>Source: AGMARKNET 2.0 · Government of India</span>
        <span>{payload?.latestDate ? `Latest reported date: ${payload.latestDate}` : "Daily market reports · latest available, not guaranteed live"}</span>
        <a href="https://agmarknet.gov.in/home" target="_blank" rel="noreferrer">Open official portal ↗</a>
      </div>

      <div className="market-price-tools market-select-tools">
        <label>Commodity
          <select value={commodityId} onChange={(event) => setCommodityId(event.target.value)} disabled={filtersLoading || !filters}>
            {(filters?.commodities ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label>Mandi / market
          <select value={marketId} onChange={(event) => setMarketId(event.target.value)} disabled={filtersLoading || !filters}>
            {(filters?.markets ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}{item.district ? ` · ${item.district}` : ""}</option>)}
          </select>
        </label>
        <label className="market-filter-search">Filter varieties
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search variety…" aria-label="Filter market price varieties" />
        </label>
        <button className="outline" onClick={() => setReload((current) => current + 1)} disabled={loading || !marketId || !commodityId}>Refresh</button>
      </div>

      {filtersLoading ? <div className="market-empty">Loading states, commodities and market yards from AGMARKNET…</div>
        : !filters?.markets.length ? <div className="market-empty">No markets were listed for this state in the current AGMARKNET filters.</div>
        : loading ? <div className="market-empty">Loading the selected mandi’s last-seven-day report…</div>
        : error ? <div className="market-empty market-error">{error}</div>
        : !payload ? <div className="market-empty">Choose a mandi and commodity to load the latest reported prices.</div>
        : rows.length === 0 ? <div className="market-empty">
            <b>{payload.records.length ? "No rows match this variety filter." : "No price was reported for this commodity at this mandi in the last seven days."}</b>
            <p>{payload.message ?? "AGMARKNET uses NR for not reported. Missing observations are not treated as zero."}</p>
          </div>
        : <div className="market-table-wrap">
            <table className="market-table">
              <thead><tr><th>Arrival date</th><th>Commodity / variety</th><th>Market</th><th>District</th><th>Reported price</th><th>Unit</th></tr></thead>
              <tbody>{rows.slice(0, 250).map((row, index) => <tr key={`${row.market}-${row.commodity}-${row.variety}-${row.arrivalDate}-${index}`}>
                <td>{row.arrivalDate}</td>
                <td><b>{row.commodity}</b><small>{row.variety}</small></td>
                <td>{row.market}<small>{row.state}</small></td>
                <td>{row.district || "—"}</td>
                <td><b>{formatPrice(row.price)}</b></td>
                <td>{row.unit}</td>
              </tr>)}</tbody>
            </table>
            <div className="market-table-foot">Showing {Math.min(rows.length, 250)} of {rows.length} reported variety-day observations · latest seven calendar days · no interpolation of missing reports</div>
          </div>}
      <p className="market-disclaimer">Prices are reproduced from AGMARKNET market reports and can be delayed or missing for closed/non-reporting markets. Verify the grade, variety, quality, weighment, transport and fees with the market before selling. Source data is published under the Government Open Data License - India. <a href="https://www.data.gov.in/godl" target="_blank" rel="noreferrer">Licence ↗</a>.</p>
    </section></Localize>
  );
}
