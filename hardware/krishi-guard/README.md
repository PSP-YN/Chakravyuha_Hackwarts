# KRISHI GUARD — ESP32 storage-monitor node

KRISHI GUARD is the hardware add-on for KRISHI CONNECT 360. It monitors the air around stored grain, grain-core temperature, rain-plate wetness, perimeter movement and insect-trap beam interruptions. Local LED/buzzer alarms work without Wi-Fi. When provisioned with a registered device key, the physical firmware sends authenticated readings to the Storage Guardian Edge Function.

**This is a prototype monitoring aid.** Its condition index is a transparent heuristic, not a spoilage probability, grain-moisture measurement, pest species classifier or food-safety certification. Thresholds require field calibration and validation.

## 1. Bill of materials

| Qty | Component | Requirement / purpose |
|---:|---|---|
| 1 | ESP32 DevKit V1 / ESP32-WROOM-32 development board | 3.3 V GPIO, ADC1 input on GPIO34, USB programming |
| 1 | DHT22 / AM2302 module | Storage-air temperature and relative humidity; use a 10 kΩ data pull-up for a bare sensor |
| 1 | DS18B20 waterproof probe | Grain-core temperature; use a 4.7 kΩ data pull-up |
| 1 | Rain sensor plate + interface board (YL-83 class) | Analogue wetness output; power/interface so AO never exceeds 3.3 V |
| 1 | HC-SR501 PIR or equivalent 3.3 V logic-output PIR | Movement in a defined storage perimeter; not rodent identification |
| 1 | IR break-beam pair / trap counter module | Open-collector or 3.3 V-safe digital output for insect-trap interruption pulses |
| 1 | Normally-open water-leak contact / float switch | Separate contact input to GPIO25; this is not inferred from rain intensity |
| 1 | LED + 220 Ω resistor | Local status / alert indicator |
| 1 | Passive buzzer module | Audible local alert on GPIO18; verify module current and drive requirements |
| 1 | 4.7 kΩ resistor | DS18B20 DATA to 3V3 pull-up |
| 1 | 10 kΩ resistor | DHT22 DATA to 3V3 pull-up when using a bare sensor |
| — | Breadboard / perfboard, jumper wires, USB supply, enclosure, cable glands | Assembly and protected installation |

Use a regulated supply suitable for the ESP32 and sensor modules. Do not expose the breadboard prototype to rain or grain dust. For deployment, use a protected enclosure, strain relief, insulated terminals and an appropriate power supply.

## 2. Pin map

| ESP32 GPIO | Signal | Direction | Wiring |
|---:|---|---|---|
| 15 | DHT22 DATA | Digital bidirectional | DHT DATA; 10 kΩ pull-up to 3V3 for bare sensor |
| 4 | DS18B20 DATA | 1-Wire | Probe DATA; 4.7 kΩ pull-up to 3V3 |
| 34 | Rain plate AO | ADC input only | Analogue output, calibrated dry-to-wet; never apply 5 V |
| 27 | PIR OUT | Digital input | 3.3 V logic HIGH on movement |
| 26 | IR beam-break OUT | Digital input / falling-edge interrupt | Open-collector output; `INPUT_PULLUP`; LOW pulse on interruption |
| 25 | Water-ingress contact | Digital input | Normally-open contact between GPIO25 and GND; `INPUT_PULLUP` |
| 2 | Status LED | Digital output | GPIO2 → 220 Ω → LED anode; cathode → GND (or board LED) |
| 18 | Buzzer signal | PWM/tone output | Buzzer input; GND common |
| 3V3 / GND | Sensor power | Power | Common ground across every module; check each module's supply range |

GPIO34 is input-only and has no internal pull-up. GPIO15 and GPIO2 are ESP32 strapping pins; keep the attached modules from forcing unsafe boot levels. Confirm the exact DevKit pin labels before wiring.

## 3. Circuit and event semantics

- `diagram.json` is the PlatformIO/Wokwi CLI circuit.
- `wokwi-web/diagram.json` and `wokwi-web/sketch.ino` are the standalone browser-simulation circuit and sketch.
- Rain plate / potentiometer reports wetness at the plate. It does **not** establish roof leakage.
- GPIO25 is a separate water-contact input. The browser digital twin's roof-ingress scenario is a model assumption and must not be described as a rain sensor measurement.
- PIR reports movement in its field of view. It cannot reliably classify an animal as a rodent.
- The insect channel counts beam interruptions. It does not identify insects or prove that every interruption is an insect.
- Insect pulse ISR includes a 50 ms debounce interval. The condition score and pest-event channel remain separate.

## 4. Firmware build

From the repository root:

```bash
pio run -d hardware/krishi-guard -e wokwi
```

The Wokwi build uses `secrets.example.h`, has telemetry disabled, and contains no production device key. Physical firmware is deliberately gated on a real device registration and credentials:

1. Register a Storage Guardian device in the signed-in KRISHI CONNECT 360 app.
2. Copy the one-time device key securely; it is shown only at registration.
3. Copy `secrets.example.h` to `secrets.h` and fill in the Wi-Fi credentials, Supabase publishable key, endpoint and registered 64-character device key.
4. Build with `pio run -d hardware/krishi-guard -e esp32dev`.
5. Keep `secrets.h` private; it is git-ignored. Never add it to a public Wokwi project or repository.

A physical build without a real `secrets.h` is expected to fail. Do not replace this gate with placeholder credentials. Physical telemetry uses the configured root CA; the TLS verification bypass is restricted to the Wokwi build.

## 5. Wokwi checks

```bash
pio run -d hardware/krishi-guard -e wokwi
wokwi-cli lint hardware/krishi-guard
wokwi-cli hardware/krishi-guard --scenario hardware/krishi-guard/scenarios/01-rain-input.test.yaml
wokwi-cli hardware/krishi-guard --scenario hardware/krishi-guard/scenarios/02-insect-beam.test.yaml
wokwi-cli hardware/krishi-guard --scenario hardware/krishi-guard/scenarios/03-insect-recovery.test.yaml
wokwi-cli hardware/krishi-guard --scenario hardware/krishi-guard/scenarios/04-water-ingress.test.yaml
```

Wokwi CLI scenario execution requires `WOKWI_CLI_TOKEN` from the Wokwi CI dashboard. Diagram lint and local PlatformIO compilation do not require that token. Trigger PIR motion manually in Wokwi and inspect serial output / LED / buzzer.

## 6. Application integration

The physical firmware posts `action: telemetry` with ambient temperature, relative humidity, grain temperature and environmental context. The Edge Function authenticates the one-time device key, checks the registered device, validates ranges and rate limits, calculates the condition index server-side, and stores `source = device` with `DEVICE_SENSOR` provenance. Browser digital-twin readings use the authenticated `simulate` action and are stored as `source = simulator` with `BROWSER_SCENARIO_SIMULATION` provenance.

The migration `20261125212157_storage_guardian_environmental_events.sql` adds the JSONB context column. Apply migrations only after checking the linked Supabase project's migration history and reviewing the pending changes. A local Supabase stack is not assumed to be running.

## 7. Bench acceptance checklist

- Verify DHT22 and DS18B20 readings against a known reference before interpreting the index.
- Move the rain sensor from dry to wet and confirm GPIO34 percentage moves in the expected direction after calibration.
- Trigger PIR movement and confirm one rising-edge event per motion activation.
- Interrupt the IR beam repeatedly and confirm pulses increment without contact bounce duplicates.
- Close the water contact and confirm a separate ingress alert.
- Disconnect each sensor in turn; confirm a sensor fault is raised and trend calculation restarts after recovery.
- Disconnect Wi-Fi; confirm local sampling and LED/buzzer alerts continue.
- Provision a registered key, reconnect Wi-Fi and verify a device-sourced row appears in the Storage Guardian dashboard.
- Confirm browser simulations remain visibly labelled as simulated and never appear as physical device measurements.

Do not claim field readiness until the physical bench tests, real-device registration, authenticated telemetry, enclosure/power safety and field calibration have passed.
