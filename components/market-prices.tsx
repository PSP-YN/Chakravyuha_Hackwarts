"use client";

import { useEffect, useMemo, useState } from "react";

type PriceRow = {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  arrivalDate: string;
  minPrice: string;
  maxPrice: string;
  modalPrice: string;
  unit: string;
};

type PriceResponse = {
  configured: boolean;
  source?: string;
  sourceUrl?: string;
  licence?: string;
  retrievedAt?: string;
  total?: number;
  records: PriceRow[];
  message?: string;
};

const inr = (value: string) => {
  const number = Number(value);
  return Number.isFinite(number)
    ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(number)
    : "—";
};

export function MarketPrices() {
  const [state, setState] = useState("Karnataka");
  const [query, setQuery] = useState("");
  const [payload, setPayload] = useState<PriceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch(`/api/market-prices?state=${encodeURIComponent(state)}&limit=1000`, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json() as PriceResponse;
        if (!response.ok && response.status !== 503) throw new Error(body.message || "Market data request failed.");
        setPayload(body);
      })
      .catch((reason: unknown) => {
        if (reason instanceof Error && reason.name !== "AbortError") setError(reason.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [state, reload]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (payload?.records ?? []).filter((row) =>
      !needle || [row.commodity, row.variety, row.market, row.district, row.state].join(" ").toLowerCase().includes(needle)
    );
  }, [payload, query]);

  return (
    <section className="market-prices" id="market-prices">
      <div className="market-prices-head">
        <div>
          <small>PUBLIC MARKET INTELLIGENCE / AGMARKNET</small>
          <h2>Mandi prices, <em>with provenance.</em></h2>
          <p>Daily wholesale reference prices reported by agricultural markets. These are not buyer offers or guaranteed sale prices.</p>
        </div>
        <label className="market-state">Coverage
          <select value={state} onChange={(event) => setState(event.target.value)}>
            <option value="Karnataka">Karnataka</option>
            <option value="All India">All India</option>
          </select>
        </label>
      </div>

      <div className="market-data-meta">
        <span>{payload?.source ?? "AGMARKNET / data.gov.in"}</span>
        <span>{payload?.retrievedAt ? `Retrieved ${new Date(payload.retrievedAt).toLocaleString("en-IN")}` : "Daily observations · not real-time"}</span>
        <a href={payload?.sourceUrl ?? "https://data.gov.in/catalog/current-daily-price-various-commodities-various-markets-mandi"} target="_blank" rel="noreferrer">Source & licence ↗</a>
      </div>

      <div className="market-price-tools">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter commodity, variety, mandi or district…" aria-label="Filter market prices" />
        <button className="outline" onClick={() => setReload((current) => current + 1)}>Refresh</button>
      </div>

      {loading ? <div className="market-empty">Loading reported market observations…</div>
        : error ? <div className="market-empty market-error">{error}</div>
        : !payload?.configured ? <div className="market-empty">
            <b>Government market feed is not connected yet.</b>
            <p>{payload?.message}</p>
            <small>Configure DATA_GOV_IN_API_KEY in Vercel as a server-only secret. Do not put the key in a NEXT_PUBLIC variable.</small>
            <a href="https://data.gov.in/" target="_blank" rel="noreferrer">Get a data.gov.in API key ↗</a>
          </div>
        : rows.length === 0 ? <div className="market-empty">
            <b>{payload?.records.length ? "No rows match this filter." : "The source returned no observations."}</b>
            <p>{payload?.message ?? "Try another commodity or state, or check the source again later."}</p>
          </div>
        : <div className="market-table-wrap">
            <table className="market-table">
              <thead><tr><th>Commodity / variety</th><th>Market</th><th>District</th><th>Date</th><th>Min</th><th>Modal</th><th>Max</th></tr></thead>
              <tbody>{rows.slice(0, 250).map((row, index) => <tr key={`${row.state}-${row.market}-${row.commodity}-${row.arrivalDate}-${index}`}>
                <td><b>{row.commodity}</b><small>{row.variety || "Variety not specified"}</small></td>
                <td>{row.market}<small>{row.state}</small></td>
                <td>{row.district || "—"}</td>
                <td>{row.arrivalDate}</td>
                <td>{inr(row.minPrice)}</td>
                <td><b>{inr(row.modalPrice)}</b></td>
                <td>{inr(row.maxPrice)}</td>
              </tr>)}</tbody>
            </table>
            <div className="market-table-foot">Showing {Math.min(rows.length, 250)} of {rows.length} matching observations · prices per quintal (100 kg) · source data may be delayed</div>
          </div>}
      <p className="market-disclaimer">Reference data only. Verify grade, variety, weighing, transport, fees and current mandi conditions before making a sale decision. Licence: {payload?.licence ?? "Government Open Data License — India"}.</p>
    </section>
  );
}
