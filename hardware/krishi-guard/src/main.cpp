#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <DHTesp.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#if __has_include("../secrets.h")
#include "../secrets.h"
#else
#include "../secrets.example.h"
#endif
#include "../certs.h"

#define DHT_PIN 15
#define DS18B20_PIN 4
#define STATUS_LED 2
#define BUZZER_PIN 18

#ifndef KRISHI_GUARD_ENABLE_TELEMETRY
#define KRISHI_GUARD_ENABLE_TELEMETRY 0
#endif

DHTesp dht;
OneWire oneWire(DS18B20_PIN);
DallasTemperature grainProbe(&oneWire);

constexpr unsigned long SAMPLE_INTERVAL_MS = 2500;
constexpr unsigned long SEND_INTERVAL_MS = 30000;
constexpr float WATCH_HUMIDITY_PCT = 75.0;
constexpr float URGENT_HUMIDITY_PCT = 80.0;
constexpr float WATCH_DELTA_C = 4.0;
constexpr float URGENT_DELTA_C = 6.0;

unsigned long lastSample = 0;
unsigned long lastSend = 0;
unsigned long lastWiFiAttempt = 0;
float ambientTemperatureC = NAN;
float relativeHumidityPct = NAN;
float grainTemperatureC = NAN;
bool sensorFault = false;

void beginWiFi() {
  WiFi.mode(WIFI_STA);
#ifdef KRISHI_GUARD_WOKWI
  WiFi.begin("Wokwi-GUEST", "", 6);
#else
  WiFi.begin(KRISHI_GUARD_WIFI_SSID, KRISHI_GUARD_WIFI_PASSWORD);
#endif
  lastWiFiAttempt = millis();
  Serial.println("Wi-Fi connection started; local monitoring remains active offline.");
}

void maintainWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  if (millis() - lastWiFiAttempt < 10000) return;
#ifdef KRISHI_GUARD_WOKWI
  WiFi.begin("Wokwi-GUEST", "", 6);
#else
  WiFi.begin(KRISHI_GUARD_WIFI_SSID, KRISHI_GUARD_WIFI_PASSWORD);
#endif
  lastWiFiAttempt = millis();
  Serial.println("Retrying Wi-Fi without blocking sensor monitoring.");
}

bool readSensors() {
  const TempAndHumidity air = dht.getTempAndHumidity();
  grainProbe.requestTemperatures();
  const float grain = grainProbe.getTempCByIndex(0);

  if (isnan(air.temperature) || isnan(air.humidity) ||
      grain == DEVICE_DISCONNECTED_C ||
      air.humidity < 0 || air.humidity > 100 ||
      air.temperature < -10 || air.temperature > 70 ||
      grain < -10 || grain > 80) {
    sensorFault = true;
    return false;
  }

  ambientTemperatureC = air.temperature;
  relativeHumidityPct = air.humidity;
  grainTemperatureC = grain;
  sensorFault = false;
  return true;
}

void updateLocalAlarm() {
  const float delta = grainTemperatureC - ambientTemperatureC;
  const bool urgent = relativeHumidityPct >= URGENT_HUMIDITY_PCT &&
                      delta >= URGENT_DELTA_C;
  const bool watch = relativeHumidityPct >= WATCH_HUMIDITY_PCT ||
                     delta >= WATCH_DELTA_C;

  digitalWrite(STATUS_LED, urgent ? HIGH : LOW);
  if (urgent) tone(BUZZER_PIN, 1800, 350);
  else if (watch) tone(BUZZER_PIN, 900, 100);
  else noTone(BUZZER_PIN);
}

bool sendTelemetry() {
#if !KRISHI_GUARD_ENABLE_TELEMETRY
  Serial.println("Telemetry disabled: set KRISHI_GUARD_ENABLE_TELEMETRY=1 in secrets.h");
  return false;
#else
  if (WiFi.status() != WL_CONNECTED) return false;

  WiFiClientSecure tls;
#ifdef KRISHI_GUARD_WOKWI
  // Simulation-only. Never use this TLS bypass in a physical deployment.
  tls.setInsecure();
#else
  tls.setCACert(KRISHI_GUARD_ROOT_CA);
#endif

  HTTPClient http;
  http.setTimeout(8000);
  if (!http.begin(tls, KRISHI_GUARD_ENDPOINT)) return false;

  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_PUBLISHABLE_KEY);
  http.addHeader("x-device-key", KRISHI_GUARD_DEVICE_KEY);

  String payload = "{";
  payload += "\"action\":\"telemetry\",";
  payload += "\"ambient_temperature_c\":" + String(ambientTemperatureC, 2) + ",";
  payload += "\"relative_humidity_pct\":" + String(relativeHumidityPct, 2) + ",";
  payload += "\"grain_temperature_c\":" + String(grainTemperatureC, 2);
  payload += "}";

  const int code = http.POST(payload);
  const String response = http.getString();
  http.end();

  Serial.printf("API HTTP %d | %s\n", code, response.c_str());
  return code >= 200 && code < 300;
#endif
}

void setup() {
  Serial.begin(115200);
  pinMode(STATUS_LED, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(STATUS_LED, LOW);
  noTone(BUZZER_PIN);

  dht.setup(DHT_PIN, DHTesp::DHT22);
  grainProbe.begin();

  beginWiFi();
  Serial.println("KRISHI GUARD READY");
  Serial.println("Storage condition indicator is advisory, not a grain-quality certification.");
}

void loop() {
  maintainWiFi();
  const unsigned long now = millis();
  if (now - lastSample < SAMPLE_INTERVAL_MS) {
    delay(10);
    return;
  }
  lastSample = now;

  if (!readSensors()) {
    Serial.println("SENSOR FAULT - check DHT22 / DS18B20 wiring");
    digitalWrite(STATUS_LED, HIGH);
    tone(BUZZER_PIN, 1200, 150);
    return;
  }

  updateLocalAlarm();
  const float delta = grainTemperatureC - ambientTemperatureC;
  Serial.printf("AIR %.1f C | RH %.1f %% | GRAIN %.1f C | DELTA %.1f C\n",
                ambientTemperatureC, relativeHumidityPct,
                grainTemperatureC, delta);

  if (now - lastSend >= SEND_INTERVAL_MS) {
    lastSend = now;
    const bool ok = sendTelemetry();
    Serial.println(ok ? "TELEMETRY SENT" : "TELEMETRY NOT SENT");
  }
}
