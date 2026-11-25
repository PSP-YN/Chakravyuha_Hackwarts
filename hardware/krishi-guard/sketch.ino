// KRISHI GUARD Wokwi circuit simulation.
// For public Wokwi gateway tests, use a throwaway demo device key only.
// Never paste a production device key into a publicly shared simulator project.
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include "DHTesp.h"
#include <OneWire.h>
#include <DallasTemperature.h>
#include "secrets.h"

#define DHT_PIN 15
#define DS18B20_PIN 4
#define STATUS_LED 2
#define BUZZER_PIN 18

DHTesp dht;
OneWire oneWire(DS18B20_PIN);
DallasTemperature grainProbe(&oneWire);

const unsigned long SEND_INTERVAL_MS = 30000;
unsigned long lastSend = 0;

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  WiFi.begin("Wokwi-GUEST", "", 6);
  Serial.print("Connecting to Wokwi-GUEST");
  unsigned long started = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - started < 15000) {
    delay(250);
    Serial.print(".");
  }
  Serial.println(WiFi.status() == WL_CONNECTED ? " connected" : " offline");
}

void updateLocalAlarm(float humidity, float ambient, float grain) {
  const float delta = grain - ambient;
  const bool urgent = humidity >= 80.0 && delta >= 6.0;
  const bool watch = humidity >= 75.0 || delta >= 4.0;
  digitalWrite(STATUS_LED, urgent ? HIGH : LOW);
  if (urgent) tone(BUZZER_PIN, 1800, 350);
  else if (watch) tone(BUZZER_PIN, 900, 100);
  else noTone(BUZZER_PIN);
}

bool sendTelemetry(float ambient, float humidity, float grain) {
  if (WiFi.status() != WL_CONNECTED) return false;
  WiFiClientSecure tls;
  // Simulation-only TLS bypass. Physical firmware must validate the CA.
  tls.setInsecure();
  HTTPClient http;
  if (!http.begin(tls, KRISHI_GUARD_ENDPOINT)) return false;
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_PUBLISHABLE_KEY);
  http.addHeader("x-device-key", KRISHI_GUARD_DEVICE_KEY);
  String payload = "{";
  payload += "\"action\":\"telemetry\",";
  payload += "\"ambient_temperature_c\":" + String(ambient, 2) + ",";
  payload += "\"relative_humidity_pct\":" + String(humidity, 2) + ",";
  payload += "\"grain_temperature_c\":" + String(grain, 2);
  payload += "}";
  int code = http.POST(payload);
  String response = http.getString();
  http.end();
  Serial.printf("API HTTP %d | %s\n", code, response.c_str());
  return code >= 200 && code < 300;
}

void setup() {
  Serial.begin(115200);
  pinMode(STATUS_LED, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(STATUS_LED, LOW);
  dht.setup(DHT_PIN, DHTesp::DHT22);
  grainProbe.begin();
  connectWiFi();
  Serial.println("KRISHI GUARD READY");
}

void loop() {
  TempAndHumidity air = dht.getTempAndHumidity();
  grainProbe.requestTemperatures();
  float grain = grainProbe.getTempCByIndex(0);
  if (isnan(air.temperature) || isnan(air.humidity) || grain == DEVICE_DISCONNECTED_C) {
    Serial.println("SENSOR FAULT - check DHT22 / DS18B20 wiring");
    digitalWrite(STATUS_LED, HIGH);
    tone(BUZZER_PIN, 1200, 150);
    delay(2000);
    return;
  }
  updateLocalAlarm(air.humidity, air.temperature, grain);
  Serial.printf("AIR %.1f C | RH %.1f %% | GRAIN %.1f C | DELTA %.1f C\n",
    air.temperature, air.humidity, grain, grain - air.temperature);
  if (millis() - lastSend >= SEND_INTERVAL_MS) {
    lastSend = millis();
    connectWiFi();
    const bool ok = sendTelemetry(air.temperature, air.humidity, grain);
    Serial.println(ok ? "TELEMETRY SENT" : "TELEMETRY NOT SENT");
  }
  delay(2500);
}
