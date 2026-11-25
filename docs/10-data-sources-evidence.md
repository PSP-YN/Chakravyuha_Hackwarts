# Data Sources and Evidence Policy

## Live mandi price source

- Primary source: AGMARKNET 2.0 public reporting backend, linked from the official portal: https://agmarknet.gov.in/home
- Public filter metadata: `GET /daily-price-arrival/filters`
- Public seven-day variety-wise prices: `GET /prices-and-arrivals/market-price/lastweek`
- No API key, user token, captcha, paid feed or secret is used for these two public endpoints.
- The Vercel route is a server-side proxy. It sends the same public-site origin and referer headers used by the AGMARKNET frontend and caches metadata for one hour and price reports for 15 minutes.
- The UI lets users choose from the upstream state, commodity and mandi lists. It requests one selected mandi/commodity report at a time; it does not fan out thousands of requests. This is intentional because AGMARKNET rate-limits bursts.
- The report provides variety-wise prices for the last seven calendar days. The current public endpoint does not provide min/max for this report; the UI does not fabricate those values.
- `NR` and missing rows are omitted from numeric prices and described as not reported, never converted to zero.
- Source prices are shown in the unit returned by AGMARKNET (normally Rs./Quintal). The app preserves the upstream unit.
- Licence/attribution: Government Open Data License - India for the underlying public data. The app links the official source and licence.

## Sources evaluated but not used as the live feed

- data.gov.in catalogue exposes a CSV download and a separate API. Its downloadable XML resource was tested, but the file retrieved from the public file URL contained only one historical arrival date (18 October 2023), so it is not suitable as a current price feed.
- MandiLens publishes prepared AGMARKNET-derived JSON artifacts for six South Indian states and 14 commodities. Its inspected manifest was generated 28 September 2026. It is useful for historical analysis but too stale to label as current on 25 November 2026.
- Third-party archives and aggregators may improve history/coverage but must be checked for actual freshness, completeness, licence and source provenance before use.

## Provenance required

source name, source URL/record ID, published_at, observed_at, retrieved_at, geography/market, commodity/material, grade, unit, currency, value, licence, parser version and freshness status.

## Display rules

Label reference price; show market/date/grade/unit; show data age; never imply it is a buyer offer; do not interpolate silently; do not compare unlike units or grades; show stale/unavailable state.

## Claims

Public statistics require publication date, reference period, unit and caveat. Historical estimates must be called historical. Pilot outcomes require documented baseline and reproducible calculation.

## Privacy and other product integrations

- No Aadhaar, bank passwords, government Farmer IDs or land records in MVP. Future AgriStack access requires authorised integration and consent/legal review.
- Machinery listings support optional GPS coordinates and a provider service radius. Buyers can grant browser location access, filter by search radius, sort providers by distance and open an OpenStreetMap directions link.
- Provider coordinates are rounded to two decimal places before storage to avoid exposing an exact farm/home location in public listing reads.
- Machinery booking remains a request/accept workflow with availability-window and overlap guards. It is not live vehicle tracking, dispatch telemetry or a guaranteed arrival-time service.
