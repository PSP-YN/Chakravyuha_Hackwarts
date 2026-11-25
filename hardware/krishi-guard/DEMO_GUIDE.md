# KRISHI GUARD — problem statement, solution and live demo

## Problem statement

Small and medium grain stores often rely on periodic visual inspection. That can miss changing storage microclimate conditions between inspections. A low-cost, always-on warning node can make ambient humidity and grain-core temperature trends visible sooner.

The prototype addresses a narrow, testable problem: **how can a farmer monitor two useful storage-condition signals at low cost and receive a warning through the existing Krishi Connect 360 application?**

It does not claim to measure grain moisture, detect mould, certify grain quality or predict spoilage.

## Proposed solution

KRISHI GUARD is an ESP32-based grain-storage condition monitor:

- DHT22: air temperature and relative humidity in the storage space.
- DS18B20 waterproof probe: temperature inside the grain mass.
- ESP32: samples sensors, calculates grain-to-air temperature difference and drives a local LED/buzzer advisory.
- Krishi Connect 360: receives readings through one HTTPS Edge Function, calculates a transparent condition index, stores history and displays condition reasons.

### Single application connection

`POST https://zimgkzfahqmenqlfzyqi.supabase.co/functions/v1/storage-guardian`

The device sends JSON containing `ambient_temperature_c`, `relative_humidity_pct` and `grain_temperature_c`, authenticated with its own one-time device key. The service stores only the SHA-256 hash of that key. Never place a Supabase service-role key in firmware.

## Circuit and software

- Board: ESP32 DevKit C V4
- DHT22 data: GPIO 15
- DS18B20 data: GPIO 4, with 4.7 kΩ pull-up to 3.3 V
- Status LED: GPIO 2, with 220 Ω series resistor
- Buzzer: GPIO 18
- Libraries: DHT sensor library for ESPx, OneWire, DallasTemperature

The Wokwi circuit is in `hardware/krishi-guard/wokwi-web/`. The production firmware and PlatformIO project are in the parent folder.

## Demo workflow

### A. Hardware simulation in Wokwi

1. Open https://wokwi.com/projects/new/esp32.
2. Copy `wokwi-web/sketch.ino` into `sketch.ino`.
3. Copy `wokwi-web/diagram.json` into `diagram.json`.
4. In Library Manager add:
   - DHT sensor library for ESPx
   - OneWire
   - DallasTemperature
5. Start the simulation and open the serial monitor.
6. Change the DHT22 and DS18B20 attributes in `diagram.json`, then restart the simulation to replay the scenarios below.
7. Sign in to Wokwi and save the project under your own account if you need a persistent share link. Do not add real device credentials to a public project.

### B. Krishi Connect 360 integration demo

1. Sign in to Krishi Connect 360 and open Workspace → Storage Guardian.
2. Register a demo device (for example, `KG-WOKWI-DEMO`) and select the crop and storage location.
3. Use the built-in Sensor Simulator on the same page to send the matching scenario to the authenticated Edge Function.
4. Show the resulting condition index, reasons, history table and SIM source label.
5. Explain that the Wokwi board demonstrates sensor acquisition and local alarm logic, while the app's simulator sends explicitly labelled test data through the same backend used by physical ESP32 devices.

The Wokwi project is deliberately configured without a real device key. The browser's public gateway may monitor outbound traffic; do not send private credentials through it.

## Reproducible scenarios

| Scenario | Ambient °C | RH % | Grain °C | Grain − air | Expected local state |
|---|---:|---:|---:|---:|---|
| Normal | 30 | 55 | 30 | 0 | NORMAL |
| Watch | 30 | 77 | 34 | 4 | WATCH |
| Urgent hotspot | 29 | 82 | 38 | 9 | URGENT |

These are demonstration thresholds, not crop-independent safety limits. Validate them against reference instruments and local storage conditions before field use.

### Expected app-side examples

- Normal: low condition score and no active configured trigger.
- Watch: humidity and/or grain-to-air temperature difference raises the indicator.
- Urgent hotspot: high humidity plus a large temperature difference raises the indicator and displays the contributing reasons.

The app labels these readings as SIM. Physical firmware readings are labelled DEVICE.

## Research and impact evaluation

For a credible impact claim, compare stores or storage containers with and without the monitor over the same crop and storage period. Record ambient RH, grain-core temperature, inspection findings, grain moisture measured with a reference meter, mass loss, visible spoilage observations, and farmer response time. Use replicates and do not infer reduced spoilage from sensor alerts alone.

## Physical deployment checklist

- Verify DHT22 and DS18B20 readings against reference instruments.
- Place the DHT22 in ventilated headspace, protected from direct water and dust.
- Insert the DS18B20 probe into the grain mass without damaging bags or containers.
- Provision a unique device key privately in an untracked `secrets.h`.
- Enable telemetry only after registering the device.
- Use TLS certificate validation on physical hardware; the Wokwi-only TLS bypass must never be used on the physical node.
- Test Wi-Fi loss, sensor disconnection, power cycling and invalid readings.
