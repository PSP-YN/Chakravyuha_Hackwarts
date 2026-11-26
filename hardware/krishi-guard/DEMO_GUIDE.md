# KRISHI GUARD — simulation-first demo guide

## What the demo proves

KRISHI GUARD demonstrates how a grain store can monitor storage-air temperature, relative humidity and grain-core temperature, then surface transparent advisory alerts inside KRISHI CONNECT 360.

**This is a simulation-first prototype.** There is no physical ESP32 in this demo. The ESP32, sensors, LED and buzzer are virtual components in Wokwi. Browser-generated scenarios are also synthetic and are always stored with **source = simulator**.

The prototype does not measure grain moisture, identify mould, certify grain quality, identify pest species or predict spoilage. The condition index is an explainable heuristic, not a crop-independent safety threshold.

## End-to-end architecture

~~~text
Wokwi browser simulator
  ├─ Virtual ESP32 DevKit
  ├─ DHT22: ambient temperature + RH
  ├─ DS18B20: grain-core temperature
  ├─ Rain potentiometer: plate wetness / ADC
  ├─ PIR: perimeter movement event
  ├─ IR break-beam: insect-trap pulse count
  ├─ Water-contact switch: independent contact input
  └─ Virtual LED + buzzer: local alarm logic
             |
             | Serial Monitor: APP_PAYLOAD {...}
             v
Krishi Guard web simulator
  ├─ Validates and parses the Wokwi JSON
  ├─ Replays values in the digital-twin UI
  └─ Sends the reading as a signed-in simulator action
             |
             | HTTPS + Supabase user session
             v
Supabase Edge Function: storage-guardian
  ├─ Authenticates the signed-in owner
  ├─ Verifies demo-node ownership and active state
  ├─ Validates sensor ranges and event counters
  ├─ Calculates the storage-condition index server-side
  └─ Stores source=simulator + provenance/context
             |
             v
Storage Guardian dashboard
  ├─ Latest condition + reasons
  ├─ Ambient / grain temperature and RH
  ├─ Rain, roof-ingress assumption, water contact and pest events
  ├─ Timestamped history with SIMULATOR source label
  └─ Auto-refresh and manual refresh
~~~

The website embeds the saved public Wokwi project using Wokwi's standard project embed. The published project is currently a climate-sensor baseline. The repository also contains a complete multi-sensor Wokwi source project that compiles locally; the Wokwi project owner must sign in and save those files before they appear in the public embed. The website's manual APP_PAYLOAD import path connects Wokwi readings to the authenticated Storage Guardian workflow.

## 1. Open and run the Wokwi circuit

1. Open the Krishi Guard simulator page. The embedded Wokwi project runs the currently published climate-sensor baseline.
2. The complete source is in **wokwi-web/sketch.ino**, **wokwi-web/diagram.json** and **wokwi-web/libraries.txt**. It includes DHT22, DS18B20, rain-plate wetness, PIR movement, IR beam-break, water contact, LED and buzzer.
3. To publish the expanded circuit, sign in to Wokwi, replace the public project's **sketch.ino** and **diagram.json** with the repository files, confirm the required libraries, then save.
4. The website digital twin independently provides rain, roof-leak, pest, water-contact and sensor-fault scenarios. These controls are not wired into the public baseline circuit until its owner saves the expanded diagram.
5. Inspect the virtual LED and buzzer in Wokwi. The complete firmware prints an **APP_PAYLOAD** JSON line containing climate and event-context fields.
6. Copy the APP_PAYLOAD line from Wokwi Serial Monitor and paste it into the website's manual importer. The website validates it and sends it to Storage Guardian when a signed-in demo node is selected.

The full Wokwi sketch compiles as a separate PlatformIO project and its diagram passes Wokwi lint. The standard project embed works on the deployed website; the public circuit remains climate-only until the Wokwi project owner saves the expanded files.

## 2. Create the website demo node

1. Open [Krishi Connect 360](https://krishi-connect-360-lby3wgxsf-pspyn.vercel.app/workspace/storage-guardian).
2. Sign in and complete the participant profile if the app asks.
3. Under **Create a Wokwi demo node**, enter a name and storage location, choose crop and storage type, then create it.
4. This creates a virtual node identity with a **SIM-** code. It does not create a physical device credential and does not require Wi-Fi details or an ESP32 API key.
5. Select the new node in the device list.

## 3. Send actual Wokwi serial values to the website

1. Open [KRISHI GUARD simulator](https://krishi-connect-360-lby3wgxsf-pspyn.vercel.app/krishi-guard-simulator).
2. Scroll to **Import an ESP32 simulation reading**.
3. Paste the full APP_PAYLOAD JSON line from the embedded or external Wokwi Serial Monitor.
4. Select **Import Wokwi reading → dashboard**.
5. The browser validates the JSON and sensor ranges, updates the digital-twin display, then sends the reading to the authenticated Edge Function.
6. Return to Storage Guardian. The new row should appear with source **SIMULATOR** and the matching timestamp, values and condition reasons.

If you do not have Wokwi open, use **Run full demo → dashboard** in the simulator. It applies the combined storm/pest scenario and sends a deterministic test reading to the selected demo node in one action.

## 4. Recommended live presentation sequence

| Step | Presenter action | Expected result |
|---|---|---|
| 1 | Select **Clear day** | Normal baseline; rain plate dry; no pest events |
| 2 | Select **Rain shower** | Rain ADC and humidity rise; no roof leak is inferred |
| 3 | Select **Heavy rain + leak** | High RH and grain/air temperature delta; urgent advisory |
| 4 | Trigger **Water-contact probe** | Independent water-contact alert |
| 5 | Trigger **Rodent movement** | PIR movement event and pest-channel update |
| 6 | Trigger **Insect trap** | IR interruption count and pest-channel update |
| 7 | Toggle DHT22 / DS18B20 disconnect | Sensor fault shown; invalid climate readings are not uploaded |
| 8 | Select **Run full demo → dashboard** | Combined scenario saved to Storage Guardian |
| 9 | Paste Wokwi APP_PAYLOAD | The exact MCU simulation reading is imported and saved as SIMULATOR |
| 10 | Return to Storage Guardian | Show latest condition, reasons, event context and history |

## 5. Sensor semantics and limitations

- DHT22 measures air temperature and relative humidity in the virtual storage space.
- DS18B20 measures virtual grain-core temperature.
- Rain potentiometer models rain-plate wetness at its mounting point. It does not prove a roof leak.
- Roof-ingress path is a separate model assumption that can raise indoor humidity over time.
- Water-contact switch is an independent contact input; it is not inferred from rain intensity.
- PIR reports movement in its field of view; it does not identify rodents or other species.
- IR beam-break counts interruptions; it does not identify insects or prove every pulse is an insect.
- LED and buzzer outputs are local virtual MCU outputs.
- Every website reading created through this demo is marked **SIMULATOR**; it must not be described as a physical measurement.

## 6. Reproducible climate examples

| Scenario | Ambient °C | RH % | Grain °C | Grain − air | Expected condition |
|---|---:|---:|---:|---:|---|
| Normal | 30 | 55 | 30 | 0 | NORMAL |
| Watch | 30 | 77 | 34 | 4 | WATCH |
| Urgent hotspot | 29 | 82 | 38 | 9 | URGENT |

These are demonstration inputs, not field-validated thresholds. A high condition score indicates configured triggers, not confirmed spoilage.

## 7. Local engineering checks

From the repository root:

~~~bash
npm run typecheck
npm test
npm run build
pio run -d hardware/krishi-guard -e wokwi
pio run -d hardware/krishi-guard/wokwi-web
wokwi-cli lint hardware/krishi-guard/wokwi-web
~~~

The Wokwi CLI's headless scenario runner requires a WOKWI_CLI_TOKEN from the Wokwi CI dashboard. Diagram lint and PlatformIO compilation do not require this token. The public Wokwi project can be run manually in the browser; saving the expanded multi-sensor source requires the project owner's Wokwi sign-in.

## 8. Future physical deployment (not part of this demo)

A physical deployment would require an ESP32 DevKit, DHT22, DS18B20, rain sensor, PIR, IR beam-break, water-contact switch, LED, buzzer, suitable resistors, enclosure and power supply. It also requires private device-key provisioning, TLS validation, sensor calibration and bench tests. Do not claim physical flashing, physical sensor validation or field readiness for this simulation-only demonstration.
