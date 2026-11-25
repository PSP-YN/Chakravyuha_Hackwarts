# Data Sources and Evidence Policy

## Sources to evaluate
AGMARKNET, data.gov.in, e-NAM, Agriculture Statistics at a Glance, local FPOs/markets/processors. Use authorised access and comply with licence/attribution.

## Provenance required
source name, source URL/record ID, published_at, observed_at, retrieved_at, geography/market, commodity/material, grade, unit, currency, value, licence, parser version and freshness status.

## Display rules
Label reference price; show market/date/grade/unit; show data age; never imply it is a buyer offer; do not interpolate silently; do not compare unlike units or grades; show stale/unavailable state.

## Claims
Public statistics require publication date, reference period, unit and caveat. Historical estimates must be called historical. Pilot outcomes require documented baseline and reproducible calculation.

## Privacy
No Aadhaar, bank passwords, government Farmer IDs or land records in MVP. Future AgriStack access requires authorised integration and consent/legal review.

## Implemented connector and location-aware service discovery

- The application includes a server-side AGMARKNET/data.gov.in adapter for the current daily mandi-price resource. The API key is read only from `DATA_GOV_IN_API_KEY`; it must never be exposed as a `NEXT_PUBLIC_*` variable.
- The UI distinguishes daily wholesale reference observations from participant offers and shows the source and retrieval time. It must not describe these observations as guaranteed prices or real-time quotes.
- The data.gov.in key is not present in the current local or Vercel environment. Until the project owner provisions it, the API returns an explicit configuration response and the UI shows no fabricated records.
- The market-price schema stores source identity, source URL, licence, observation date, geography, commodity, variety/grade, price range, arrival quantity, retrieval timestamp, parser version and freshness classification. Public roles have read-only access; ingestion writes must use a trusted server-side process.
- Machinery listings now support optional GPS coordinates and a provider service radius. Buyers can grant browser location access, filter by search radius, sort providers by distance and open an OpenStreetMap directions link. Location is opt-in; listings without coordinates are not included in proximity results.
- Machinery booking remains a request/accept workflow with availability-window and overlap guards. It is not live vehicle tracking, dispatch telemetry or a guaranteed arrival-time service.
- Provider coordinates are rounded to two decimal places before storage to avoid exposing an exact farm/home location in public listing reads.
