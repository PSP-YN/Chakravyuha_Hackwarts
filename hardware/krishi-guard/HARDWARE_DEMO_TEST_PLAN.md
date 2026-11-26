# KRISHI GUARD — live hardware demo and acceptance test

## What this prototype demonstrates

A standalone ESP32 grain-storage condition monitor. The DHT22 measures storage-air temperature and relative humidity. The DS18B20 measures grain-core temperature. The ESP32 calculates a transparent demonstration risk score and operates a local status LED and buzzer.

This is a simulated prototype, not a certified grain-safety instrument. It does not measure grain moisture, detect mould, or prove that grain is safe.

## Open and prepare the simulator

1. Open https://wokwi.com/projects/481686932424365057.
2. If Wokwi says the project belongs to another user, sign in and use **Save a Copy** to create your own editable copy. Keep it Public only if you are comfortable sharing the source; never put credentials in it.
3. In your copy, open `sketch.ino` and replace its contents with this repository's `hardware/krishi-guard/wokwi-web/sketch.ino`.
4. Open `diagram.json` and make sure it matches this repository's `hardware/krishi-guard/wokwi-web/diagram.json`.
5. Open `libraries.txt` and confirm it contains:
   - DHT sensor library for ESPx
   - OneWire
   - DallasTemperature
6. Start the simulation. Open the Serial Monitor at 115200 baud.
7. Wait for the first sample (about 2.5 seconds). The default values should report NORMAL, score 0/100.

## Circuit wiring checklist

| Part | ESP32 connection | Purpose |
|---|---|---|
| DHT22 VCC / GND / DATA | 3V3 / GND / GPIO15 | Air temperature and RH |
| DS18B20 VCC / GND / DQ | 3V3 / GND / GPIO4 | Grain-core temperature |
| DS18B20 pull-up | 4.7 kΩ from DQ to 3V3 | OneWire data-line pull-up |
| LED | GPIO2 through 220 Ω; cathode to GND | Alert indicator |
| Buzzer | GPIO18 and GND | Audible alert |
| Rain plate AO | GPIO34 (ADC1), 3.3 V-safe output | Rain/wetness at sensor location |
| PIR OUT | GPIO27, 3.3 V logic | Rodent/perimeter movement event |
| IR break-beam receiver OUT | GPIO26, INPUT_PULLUP, active-low falling edge | Insect trap interruption pulse |
| Water-contact switch | GPIO25, INPUT_PULLUP, active-low when wet/contact closes | Physical water presence at the probe location |

## Live test sequence

Prebuilt diagram presets are included in `wokwi-web/scenarios/` so you do not have to edit sensor values manually. For each test, copy the chosen preset over `wokwi-web/diagram.json` in your local project, then use that updated diagram in your Wokwi copy and restart the simulation. Alternatively, edit the DHT22 `temperature` and `humidity` and DS18B20 `temperature` in the Wokwi part inspector. Allow the board to reboot and wait for a serial sample.

| Preset file | Scenario | Air °C | RH % | Grain °C |
|---|---|---:|---:|---:|
| `scenarios/01-baseline.json` | NORMAL | 30 | 55 | 30 |
| `scenarios/02-humidity-watch.json` | WATCH | 30 | 77 | 30 |
| `scenarios/03-delta-watch.json` | WATCH | 30 | 65 | 34 |
| `scenarios/04-action.json` | ACTION | 30 | 80 | 34 |
| `scenarios/05-urgent.json` | URGENT | 29 | 82 | 38 |
| `scenarios/06-sensor-fault.json` | FAULT (DHT22 data disconnected) | 30 | 55 | 30 |

For the fault preset, the DHT22 data wire is intentionally omitted. To recover, restore the standard `diagram.json` wiring and restart.

| Test | DHT22 air °C | DHT22 RH % | DS18B20 grain °C | Expected delta | Expected score/state | Expected outputs |
|---|---:|---:|---:|---:|---|---|
| 1. Baseline | 30 | 55 | 30 | 0 | 0 NORMAL | LED off; buzzer silent |
| 2. Humidity watch | 30 | 77 | 30 | 0 | 25 WATCH | LED on; short low-tone beep |
| 3. Delta-only boundary | 30 | 55 | 34 | 4 | 20 NORMAL | LED off; buzzer silent |
| 4. Action | 30 | 80 | 34 | 4 | 60 ACTION | LED on; medium beep |
| 5. Urgent | 29 | 82 | 38 | 9 | 75 URGENT | LED on; higher/longer beep |
| 6. Sensor fault | Disconnect DHT22 DATA or DS18B20 DQ | — | — | — | FAULT | LED on; fault beep; FAULT line in serial |

Note: test 3 has score 20, which is below the WATCH threshold of 25. It is therefore NORMAL under the current scoring implementation and should be treated as a boundary/negative test, not a WATCH test. For a reliable delta-only WATCH, use air 30°C, RH 65%, grain 34°C: score 30 (10 humidity + 20 delta) = WATCH.

### Exact expected score examples

- Baseline: humidity 55% adds 0; delta 0°C adds 0; first sample has no rise value. Total 0 → NORMAL.
- Humidity watch: RH 77% adds 25; delta 0°C adds 0. Total 25 → WATCH.
- Action: RH 80% adds 40; delta 4°C adds 20. Total 60 → ACTION.
- Urgent: RH 82% adds 40; delta 9°C adds 35. Total 75 → URGENT.

### Test a grain-temperature rise

1. Start with air 30°C, RH 55%, grain 30°C.
2. Let one or more samples appear in Serial Monitor.
3. Change only the DS18B20 grain temperature to 32°C while running, if Wokwi's part inspector supports live attribute changes; otherwise stop, edit the diagram value and restart (the restarted run resets the previous-sample baseline).
4. A live increase of at least 2°C between consecutive valid samples adds 25 points for that sample. Confirm the RISE and SCORE fields in Serial Monitor.
5. If the simulator restarts, the first sample correctly shows RISE N/A because no previous sample exists.

## What to show the judges (3–4 minutes)

1. **Problem (20 seconds):** conditions inside a grain store can change between manual inspections.
2. **Circuit (30 seconds):** identify the ESP32, DHT22 in the storage air, DS18B20 probe in the grain, LED and buzzer.
3. **Normal baseline (30 seconds):** start simulation and show 30°C / 55% RH / 30°C grain, NORMAL, score 0, LED off and no buzzer.
4. **Humidity warning (30 seconds):** set DHT22 humidity to 77%, restart, show WATCH, LED and buzzer.
5. **Action and urgent (45 seconds):** set 80% RH and 34°C grain for ACTION; then 82% RH and 38°C grain with 29°C air for URGENT. Show LED and buzzer responses.
6. **Fault tolerance (30 seconds):** stop simulation, disconnect one sensor data wire in the diagram, restart, and show FAULT in serial output.
7. **Close (20 seconds):** explain that the current unit is an early-warning condition monitor; thresholds are prototype values and need crop/store-specific calibration.


## Rain and pest event demonstration

These inputs are independent of the grain-condition score.

| Input test | How to trigger in Wokwi | Expected serial / output |
|---|---|---|
| Dry baseline | Leave rain potentiometer at its default 1023 position | RAIN 0%; no rain alert |
| Rain plate wet | Rotate rainpot to 0 (or use automation scenario 01) | RAIN near 100%; RAIN_ALERT ACTIVE; LED on and short low-tone chirp; this is plate wetness, not proof of a roof leak |
| Rodent/perimeter motion | Click PIR part and choose Simulate Motion | RODENT MOTION; PEST ALERT; LED and short buzzer indication |
| Insect trap | Press the yellow insect button (or run automation scenario 02) | INSECT_PULSES increments; PEST ALERT; LED and short buzzer indication |
| Insect alert recovery | Release button and wait for the next sample | PEST CLEAR; LED/buzzer return to grain-condition state |
| Water contact | Close the GPIO25 water-contact switch to GND | WATER_INGRESS ACTIVE; LED and water-contact buzzer indication |
| Climate sensor fault + water/pest event | Disconnect DHT22 DATA or DS18B20 DQ, then trigger GPIO25, PIR or insect beam | Climate FAULT remains visible while independent water/pest event is still reported and can activate the alarm outputs |

The browser digital twin at /krishi-guard-simulator provides live controls for rain ADC wetness, DHT22 air temperature and humidity, DS18B20 grain-core temperature, GPIO25 water contact, GPIO27 PIR motion, GPIO26 insect pulses, and climate-sensor fault injection. The pin readout and modeled LED/buzzer respond immediately. It is a digital-twin test bench; use the Wokwi link on that page for actual ESP32 instruction execution against virtual components. The browser digital twin separately models a roof-ingress scenario. It animates rain, a leak path and gradual indoor humidity/grain-temperature response. The physical rain plate only measures wetness where it is installed; it cannot detect a leak elsewhere in the roof.

Automated Wokwi scenarios live in hardware/krishi-guard/scenarios. The Wokwi CI token is required to execute them from the CLI. The diagram lint and PlatformIO firmware build can be run without that token.

## Acceptance checklist

- [ ] Wokwi project opens and the simulation starts.
- [ ] Serial Monitor shows boot banner and pin mapping.
- [ ] DHT22 values change when its attributes change.
- [ ] DS18B20 values change when its attribute changes.
- [ ] Normal scenario gives score 0 and no alert.
- [ ] Humidity warning gives WATCH and buzzer.
- [ ] Action scenario gives ACTION, LED and buzzer.
- [ ] Urgent scenario gives URGENT, LED and stronger buzzer.
- [ ] Disconnected sensor produces FAULT instead of a fabricated valid reading.
- [ ] Restoring the sensor and restarting returns to valid readings.
- [ ] Rain potentiometer changes the ADC-derived rain percentage and triggers the rain LED/chirp at 25% wetness.
- [ ] PIR motion produces a distinct rodent/perimeter event.
- [ ] Insect beam-break input increments its pulse counter and clears after the event.
- [ ] GPIO25 water-contact switch is reported independently from the roof-ingress simulation assumption.
- [ ] Water-contact and pest alarms remain available when DHT22 or DS18B20 reports a sensor fault.
- [ ] Pest events do not change the grain-condition score.
- [ ] No production credentials are present in the public project.

## Risk model caveat

These scores and thresholds are for repeatable demonstration only. They are not validated safe-storage limits, a grain-moisture measurement, or a prediction of mould/spoilage. Before field use, calibrate against reference instruments and local agronomic guidance, test multiple sensors and storage conditions, and validate alert thresholds with grain-storage specialists.

## Browser demo sequence (repeatable judge walkthrough)

Open `/krishi-guard-simulator` in the deployed/local app. The page is an interactive digital-twin bench; every control updates the corresponding GPIO readout and firmware-output model immediately.

1. **Clear baseline:** choose `Clear day`. Expect GPIO34 dry / ADC 4095, GPIO27 LOW, GPIO25 clear, no insect pulses, condition NORMAL, LED OFF and buzzer SILENT.
2. **Rain input:** move `Rain plate wetness · GPIO34` to 65%. Expect ADC about 1433/4095, MODERATE RAIN, GPIO34 WET, LED ON and `RAIN DETECTED`. This is plate wetness, not a roof-leak measurement.
3. **Climate threshold:** set DHT22 humidity to 82% and DS18B20 grain-core temperature to 38°C while air is 29°C. Expect condition score 75/100 and URGENT; LED ON and urgent buzzer output.
4. **Water contact:** return climate values to 29°C / 54% RH / 29°C and rain to 0%; trigger GPIO25. Expect `WATER CONTACT ACTIVE`, LED ON and `WATER CONTACT` buzzer while grain condition remains NORMAL.
5. **PIR:** clear GPIO25 and trigger the GPIO27 motion control. Expect a perimeter movement event and PEST WATCH without changing the grain-condition score.
6. **Insect beam:** trigger GPIO26 three times. Expect three pulses and PEST ACTION; the grain-condition score remains independent.
7. **Fault handling:** enable `Disconnect DHT22`, then `Disconnect DS18B20` in turn. Expect condition `FAULT`, score withheld, the relevant pin marked `FAULT / NO DATA`, and a sensor-fault alarm. Water and pest channels remain available during the fault.
8. **Firmware execution:** use the embedded `Live hardware execution` panel. It boots the compiled standalone ESP32 firmware. Changing rain, air temperature, humidity, grain temperature, water contact or either climate-fault control uploads a revised circuit and restarts the MCU. Confirm the GPIO34 ADC and the actual firmware's LED/buzzer response. Inside the Wokwi circuit, click the PIR sensor and choose `Simulate Motion`; click the insect-beam button (or press `I`) to generate pulses. Open Wokwi's Serial Monitor toolbar and copy an `APP_PAYLOAD` line into `Import an ESP32 simulation reading` if automatic serial streaming is unavailable. Import it locally or send it to a registered Storage Guardian demo node. The resulting record is marked SIMULATOR, never DEVICE.

The browser bench and Wokwi simulator are virtual hardware. A physical ESP32 demonstration additionally requires the assembled board and sensors wired to the pin map in this document; the web sliders cannot electrically actuate an unconnected physical board.
