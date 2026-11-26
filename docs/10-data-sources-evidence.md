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

## Municipality and local-body directory

The pilot directory covers Bengaluru Urban, Mysuru and Tumakuru; it is not a statewide directory and does not imply a formal government partnership.

- BBMP Solid Waste Management contacts: https://apps.bbmp.gov.in/SWM/Home/Forms/Home.aspx
- Mysuru District Administration municipality directory: https://mysore.nic.in/en/public-utility-category/municipality/
- Mysuru District Administration Kannada municipality directory (including the Sargur contact number): https://mysore.nic.in/public-utility-category/%E0%B2%AA%E0%B3%81%E0%B2%B0%E0%B2%B8%E0%B2%AD%E0%B3%86%E0%B2%97%E0%B2%B3%E0%B3%81/
- Tumakuru District Administration municipality directory: https://tumkur.nic.in/en/public-utility-category/municipality/

Existing directory records were source-checked on 25 November 2026; the Tumakuru directory expansion and refreshed BBMP/Sargur contacts were checked on 26 November 2026. Phone and email fields remain NULL where the official directory does not publish them. The application must not invent missing contact details. A directory entry is a contact route, not proof that the office provides a particular crop-residue collection service. Participants must confirm local service availability directly.

## Storage Guardian sensor provenance

- DHT22 provides ambient temperature and relative humidity.
- DS18B20 provides a temperature reading at the installed grain-core probe location.
- Physical telemetry is stored with source=device; simulator input is stored with source=simulator. The UI labels these as physical hardware and simulated readings respectively.
- The condition index is a deterministic heuristic based on ambient relative humidity, grain-to-air temperature difference and recent grain-core temperature trend.
- The system does not measure grain moisture content, detect mycotoxins, identify pests, certify grain quality or estimate spoilage probability.
- Sensor placement, calibration, enclosure, ventilation, condensation and electrical safety materially affect readings. Validate these in the intended storage environment before operational use.
- Reference documentation: https://www.analog.com/en/products/ds18b20.html and https://www.aosong.com/en/products-22.html (DHT22/AM2302 family).
