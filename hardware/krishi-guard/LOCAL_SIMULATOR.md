# KRISHI GUARD — local digital twin and cloud-connected simulator

## Launch

From the repository root:

- Run npm install
- Run npm run dev
- Open http://localhost:3000/krishi-guard-simulator

The local digital twin runs without an ESP32, Wokwi account, physical sensors or cloud login. It is part of the KRISHI CONNECT 360 application.

## Event-driven model

- Rain intensity is an explicit 0–100% input and animates the outside weather.
- A roof-ingress toggle models water entering the storage building. Rain alone does not automatically imply a roof leak.
- Indoor humidity changes gradually from the weather/ingress model.
- Grain-core temperature responds gradually to sustained high humidity in the leak scenario.
- Rodent movement is a separate PIR event channel.
- Insect trap activity is a separate beam-break pulse channel.
- Grain-condition scoring and pest severity remain independent.
- The virtual ESP32 panel shows sensor inputs, LED state, buzzer state, serial-style telemetry, a trend chart, sample history and an event journal.

The browser samples the model every three seconds while running. Manual capture is also available. Browser history and event entries are in-memory for the current page session; reloading the page starts a fresh local scenario.

## Application/cloud integration

Cloud sync is optional and disabled by default. To use it:

1. Sign in to KRISHI CONNECT 360.
2. Complete the participant profile.
3. Open Workspace → Storage Guardian and register an active device.
4. Return to this simulator, refresh the device list, select that device and enable cloud sync.

The simulator then sends a reading at most every six seconds to the authenticated Storage Guardian Edge Function. Records are tagged with source simulator and provenance BROWSER_SCENARIO_SIMULATION and include rain, roof-ingress, rodent, insect, pest status, scenario name and simulation elapsed time. The Storage Guardian dashboard refreshes automatically every ten seconds.

Do not use a simulator record as physical sensor evidence. It is explicitly labelled as synthetic. The ESP32 firmware uses the same telemetry endpoint with source device and provenance DEVICE_SENSOR.

## Physical and virtual hardware map

| Sensor/output | ESP32 pin | Meaning |
|---|---:|---|
| DHT22 | GPIO 15 | Storage-air temperature and relative humidity |
| DS18B20 | GPIO 4 | Grain-core temperature |
| Status LED | GPIO 2 | Condition or pest alert |
| Buzzer | GPIO 18 | Local audible alert |
| Rain plate analogue output | GPIO 34 | Wetness at the sensor mounting point |
| Rodent PIR output | GPIO 27 | Movement in monitored perimeter |
| Insect beam-break output | GPIO 26 | Trap beam interruption pulse |

The Wokwi potentiometer is an analogue surrogate for the rain plate. The Wokwi PIR uses its Simulate Motion control. The insect pushbutton creates one repeatable beam-break pulse.

## Validation and limits

- Browser simulation tests cover gradual rain/ingress response, grain temperature response, pest severity separation and scoring parity.
- PlatformIO builds the ESP32 firmware and the standalone Wokwi sketch.
- Wokwi diagram lint validates the circuit structure.
- Automated Wokwi execution requires a Wokwi CI token in WOKWI_CLI_TOKEN. Do not paste or commit the token.
- A successful firmware build does not prove real sensor calibration, wiring, buzzer loudness or field reliability.

All browser scenario values are synthetic. Thresholds are demonstration heuristics, not universal grain-safety limits. The system does not measure grain moisture, detect mould, certify grain quality or diagnose spoilage.
