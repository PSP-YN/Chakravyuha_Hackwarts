#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <DHTesp.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#if defined(KRISHI_GUARD_PHYSICAL_BUILD)
  #if __has_include("../secrets.h")
    #include "../secrets.h"
  #else
    #error "Physical firmware requires hardware/krishi-guard/secrets.h. Copy secrets.example.h and provision a real registered device key."
  #endif
#else
  #include "../secrets.example.h"
#endif
#include "../certs.h"

#ifndef KRISHI_GUARD_ENABLE_TELEMETRY
#define KRISHI_GUARD_ENABLE_TELEMETRY 0
#endif

#if defined(KRISHI_GUARD_PHYSICAL_BUILD) && !KRISHI_GUARD_ENABLE_TELEMETRY
  #error "Physical builds must enable authenticated device telemetry."
#endif
#if defined(KRISHI_GUARD_PHYSICAL_BUILD)
  #ifndef KRISHI_GUARD_DEVICE_KEY
    #error "Physical builds require a registered device key."
  #endif
  static_assert(sizeof(KRISHI_GUARD_DEVICE_KEY) == 65,
    "KRISHI_GUARD_DEVICE_KEY must be the 64-character one-time device key.");
#endif
#if defined(KRISHI_GUARD_WOKWI) && KRISHI_GUARD_ENABLE_TELEMETRY
  #error "Public Wokwi simulations must not contain production device credentials."
#endif

#define DHT_PIN 15
#define DS18B20_PIN 4
#define STATUS_LED 2
#define BUZZER_PIN 18
#define RAIN_SENSOR_PIN 34
#define RODENT_PIR_PIN 27
#define INSECT_BEAM_PIN 26
#define WATER_INGRESS_PIN 25

DHTesp dht;
OneWire oneWire(DS18B20_PIN);
DallasTemperature grainProbe(&oneWire);

constexpr unsigned long SAMPLE_INTERVAL_MS = 2500;
constexpr unsigned long SEND_INTERVAL_MS = 30000;

unsigned long lastSample = 0;
unsigned long lastSend = 0;
unsigned long lastWiFiAttempt = 0;
float ambientTemperatureC = NAN;
float relativeHumidityPct = NAN;
float grainTemperatureC = NAN;
float previousGrainTemperatureC = NAN;
bool sensorFault = false;
int rainIntensityPct = 0;
bool rodentMotionDetected = false;
bool waterIngressDetected = false;
volatile uint32_t insectTrapPulses = 0;
volatile uint32_t lastInsectEdgeUs = 0;
constexpr uint32_t INSECT_DEBOUNCE_US = 50000;
portMUX_TYPE insectMux = portMUX_INITIALIZER_UNLOCKED;
uint32_t lastAlertedInsectPulses = 0;
uint32_t rodentMotionEvents = 0;
uint32_t lastAlertedRodentEvents = 0;
bool previousRodentMotion = false;

void IRAM_ATTR onInsectBeamBreak() {
  const uint32_t nowUs = micros();
  if (nowUs - lastInsectEdgeUs < INSECT_DEBOUNCE_US) return;
  lastInsectEdgeUs = nowUs;
  portENTER_CRITICAL_ISR(&insectMux);
  insectTrapPulses = insectTrapPulses + 1;
  portEXIT_CRITICAL_ISR(&insectMux);
}

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

int assessConditionScore() {
  const float delta = grainTemperatureC - ambientTemperatureC;
  const float trend = isnan(previousGrainTemperatureC)
      ? NAN
      : grainTemperatureC - previousGrainTemperatureC;
  int score = 0;

  if (relativeHumidityPct >= 80.0) score += 40;
  else if (relativeHumidityPct >= 75.0) score += 25;
  else if (relativeHumidityPct >= 65.0) score += 10;

  if (delta >= 6.0) score += 35;
  else if (delta >= 4.0) score += 20;
  else if (delta >= 2.0) score += 10;

  if (!isnan(trend)) {
    if (trend >= 2.0) score += 25;
    else if (trend >= 1.0) score += 10;
  }
  return min(score, 100);
}

void updateLocalAlarm(int score, bool pestAlert, bool waterIngressAlert, bool sensorFaultAlert = false, bool rainAlert = false) {
  const bool urgent = score >= 75;
  const bool action = score >= 50;
  const bool watch = score >= 25;
  digitalWrite(STATUS_LED, (watch || pestAlert || waterIngressAlert || sensorFaultAlert || rainAlert) ? HIGH : LOW);
  if (urgent) tone(BUZZER_PIN, 1800, 350);
  else if (action) tone(BUZZER_PIN, 1300, 220);
  else if (watch) tone(BUZZER_PIN, 900, 100);
  else if (waterIngressAlert) tone(BUZZER_PIN, 1500, 250);
  else if (sensorFaultAlert) tone(BUZZER_PIN, 1200, 150);
  else if (pestAlert) tone(BUZZER_PIN, 1100, 180);
  else if (rainAlert) tone(BUZZER_PIN, 700, 100);
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

  uint32_t pulseSnapshot;
  portENTER_CRITICAL(&insectMux);
  pulseSnapshot = insectTrapPulses;
  portEXIT_CRITICAL(&insectMux);
  const char *pestStatus = (rodentMotionEvents >= 3 || pulseSnapshot >= 3)
      ? "ACTION" : (pulseSnapshot > 0 || rodentMotionEvents > 0) ? "WATCH" : "CLEAR";
  String payload = "{";
  payload += "\"action\":\"telemetry\",";
  payload += "\"ambient_temperature_c\":" + String(ambientTemperatureC, 2) + ",";
  payload += "\"relative_humidity_pct\":" + String(relativeHumidityPct, 2) + ",";
  payload += "\"grain_temperature_c\":" + String(grainTemperatureC, 2) + ",";
  payload += "\"environmental_context\":{";
  payload += "\"rain_intensity_pct\":" + String(rainIntensityPct) + ",";
  // A contact at the sensor location confirms water presence, not a roof leak.
  payload += "\"water_ingress_detected\":" + String(waterIngressDetected ? "true" : "false") + ",";
  payload += "\"rodent_motion_events\":" + String(rodentMotionEvents) + ",";
  payload += "\"insect_trap_pulses\":" + String(pulseSnapshot) + ",";
  payload += "\"pest_status\":\"";
  payload += pestStatus;
  payload += "\",";
  payload += "\"scenario\":\"physical sensor node\"}}";

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
  pinMode(RAIN_SENSOR_PIN, INPUT);
  pinMode(RODENT_PIR_PIN, INPUT);
  pinMode(INSECT_BEAM_PIN, INPUT_PULLUP);
  pinMode(WATER_INGRESS_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(INSECT_BEAM_PIN), onInsectBeamBreak, FALLING);
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

  // Read independent environmental and pest channels even when a climate sensor fails.
  // A failed DHT22/DS18B20 must never suppress a water-contact or pest alarm.
  rainIntensityPct = constrain(map(analogRead(RAIN_SENSOR_PIN), 4095, 0, 0, 100), 0, 100);
  rodentMotionDetected = digitalRead(RODENT_PIR_PIN) == HIGH;
  waterIngressDetected = digitalRead(WATER_INGRESS_PIN) == LOW;
  if (rodentMotionDetected && !previousRodentMotion) rodentMotionEvents++;
  previousRodentMotion = rodentMotionDetected;
  uint32_t pulseSnapshot;
  portENTER_CRITICAL(&insectMux);
  pulseSnapshot = insectTrapPulses;
  portEXIT_CRITICAL(&insectMux);
  const bool newInsectPulse = pulseSnapshot > lastAlertedInsectPulses;
  const bool newRodentEvent = rodentMotionEvents > lastAlertedRodentEvents;
  const bool pestAlert = rodentMotionDetected || newInsectPulse || newRodentEvent;
  lastAlertedInsectPulses = pulseSnapshot;
  lastAlertedRodentEvents = rodentMotionEvents;

  if (!readSensors()) {
    // Break the trend chain across a sensor fault; never compare against stale data.
    // Preserve independent water-ingress and pest alarms while climate data is unavailable.
    previousGrainTemperatureC = NAN;
    updateLocalAlarm(0, pestAlert, waterIngressDetected, true, rainIntensityPct >= 25);
    Serial.printf("SENSOR FAULT - check DHT22 / DS18B20 wiring | RAIN %d%% (%s) | WATER_INGRESS %s | RODENT %s | INSECT_PULSES %lu | PEST %s\n",
                  rainIntensityPct, rainIntensityPct >= 25 ? "WET" : "DRY",
                  waterIngressDetected ? "ACTIVE" : "CLEAR",
                  rodentMotionDetected ? "MOTION" : "CLEAR",
                  (unsigned long)pulseSnapshot,
                  pestAlert ? "ALERT" : "CLEAR");
    return;
  }

  const float delta = grainTemperatureC - ambientTemperatureC;
  const int conditionScore = assessConditionScore();
  updateLocalAlarm(conditionScore, pestAlert, waterIngressDetected, false, rainIntensityPct >= 25);
  const float trend = isnan(previousGrainTemperatureC)
      ? 0.0
      : grainTemperatureC - previousGrainTemperatureC;
  const char *conditionLevel = conditionScore >= 75 ? "URGENT"
      : conditionScore >= 50 ? "ACTION"
      : conditionScore >= 25 ? "WATCH" : "NORMAL";
  Serial.printf("AIR %.1f C | RH %.1f %% | GRAIN %.1f C | DELTA %.1f C | TREND %.1f C | SCORE %d | %s | RAIN %d%% (%s) | WATER_INGRESS %s | RODENT %s\n",
                ambientTemperatureC, relativeHumidityPct, grainTemperatureC, delta, trend,
                conditionScore, conditionLevel, rainIntensityPct, rainIntensityPct >= 25 ? "WET" : "DRY",
                waterIngressDetected ? "ACTIVE" : "CLEAR", rodentMotionDetected ? "MOTION" : "CLEAR");
  Serial.printf("INSECT_PULSES %lu | PEST %s | RAIN_ALERT %s\n",
                (unsigned long)pulseSnapshot, pestAlert ? "ALERT" : "CLEAR", rainIntensityPct >= 25 ? "ACTIVE" : "CLEAR");
#if defined(KRISHI_GUARD_WOKWI)
  // Public Wokwi simulation bridge: copy this serial JSON into the website importer.
  Serial.printf("APP_PAYLOAD {\"ambient_temperature_c\":%.1f,\"relative_humidity_pct\":%.1f,\"grain_temperature_c\":%.1f,\"temperature_delta_c\":%.1f,\"risk_score\":%d,\"risk_level\":\"%s\",\"rain_intensity_pct\":%d,\"water_ingress_detected\":%d,\"rodent_motion_events\":%lu,\"insect_trap_pulses\":%lu}\n",
                ambientTemperatureC, relativeHumidityPct, grainTemperatureC, delta, conditionScore,
                conditionLevel, rainIntensityPct, waterIngressDetected ? 1 : 0,
                (unsigned long)rodentMotionEvents, (unsigned long)pulseSnapshot);
#endif
  previousGrainTemperatureC = grainTemperatureC;

  if (now - lastSend >= SEND_INTERVAL_MS) {
    lastSend = now;
    const bool ok = sendTelemetry();
    Serial.println(ok ? "TELEMETRY SENT" : "TELEMETRY NOT SENT");
  }
}
