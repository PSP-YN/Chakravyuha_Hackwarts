# KRISHI GUARD — low-cost grain-storage condition monitor

KRISHI GUARD is a hardware add-on for KRISHI CONNECT 360. One ESP32 node reads
ambient temperature/relative humidity and grain-core temperature, raises a
local advisory alarm, and can send one authenticated HTTPS telemetry request
to the existing Supabase Edge Function.

## Prototype BOM

| Part | Qty | Purpose |
|---|---:|---|
| ESP32 DevKit v1 | 1 | Wi-Fi controller |
| DHT22 | 1 | Storage-headspace temperature and RH |
| DS18B20 waterproof probe | 1 | Grain-core temperature |
| 4.7 kΩ resistor | 1 | DS18B20 data pull-up |
| LED + 220 Ω resistor | 1 | Urgent local indicator |
| Active/passive buzzer | 1 | Audible advisory |
| USB 5 V supply | 1 | Prototype power |
| Breadboard and jumper wires | 1 set | Assembly |

Indicative local prototype target: ₹600–₹1,000, excluding enclosure and shipping.
Prices vary by supplier. Start with USB power; add a protected battery only after
the sensor node and API path are validated.

## Wiring

| ESP32 | Component |
|---|---|
| 3V3 | DHT22 VCC, DS18B20 VDD |
| GND | DHT22 GND, DS18B20 GND, LED cathode, buzzer GND |
| GPIO 15 | DHT22 DATA |
| GPIO 4 | DS18B20 DQ |
| 3V3 to DS18B20 DQ | 4.7 kΩ pull-up |
| GPIO 2 through 220 Ω | LED anode |
| GPIO 18 | Buzzer signal |

Check the exact buzzer module pinout. Do not drive a high-current buzzer directly
from a GPIO; use a transistor driver if its current exceeds the ESP32 pin rating.
Keep the sensor electronics outside direct contact with grain and protect the
probe cable from abrasion and moisture ingress.

## Build

Install PlatformIO Core, then from this directory:

```bash
pio run -e esp32dev
pio run -e wokwi
```

The Wokwi project reads `.pio/build/wokwi/firmware.bin` and the matching ELF.
Open this directory in VS Code with the Wokwi extension, or use Wokwi CLI after
configuring a Wokwi CI token.

## Simulation

1. Build `pio run -e wokwi`.
2. Open the project in Wokwi.
3. Start the simulator and inspect the serial monitor.
4. Change DHT22 humidity/temperature and DS18B20 temperature in the part controls.
5. Verify local LED/buzzer behaviour for normal, watch, urgent and sensor-fault cases.

The Wokwi firmware defaults to telemetry disabled. To test a cloud connection,
register a throwaway test device in the Krishi Guard page, copy its one-time key
into an untracked `secrets.h`, set telemetry to 1, and keep the Wokwi project
private. Never publish a production device key.

## Connect to Krishi Connect 360

1. Sign in to the application.
2. Open Workspace → Storage Guardian.
3. Register a device and copy the one-time device key.
4. Copy `secrets.example.h` to `secrets.h`; fill Wi-Fi, publishable key and device key.
5. Set `KRISHI_GUARD_ENABLE_TELEMETRY` to 1.
6. Build `pio run -e esp32dev`, flash the ESP32 and monitor the serial output.
7. Confirm that a new reading appears with source DEVICE in the application.

The firmware posts to the existing `storage-guardian` Edge Function. The browser
never receives the device secret. The Edge Function stores only the SHA-256 hash.

## Condition interpretation

The app's condition score is a transparent prototype heuristic using headspace
relative humidity, grain-to-air temperature difference and recent core-temperature
trend. It is NOT a spoilage probability, direct grain-moisture measurement, mould
diagnosis or grain-quality certification. Validate crop-specific thresholds against
reference instruments and field data before operational use.

## Security

- Physical firmware validates TLS using the included Google Trust Services root CA.
- The Wokwi build uses insecure TLS only when simulation telemetry is explicitly enabled.
- Keep `secrets.h` out of Git and out of public simulator projects.
- Use a unique device key for each node; revoke it if exposed.
- The device uses the Supabase publishable key plus its own one-time device key.
- Never embed the Supabase service-role key in firmware.

The pinned root CA must be reviewed periodically and updated if the endpoint's
certificate chain changes. Google recommends maintaining an up-to-date trust store.
