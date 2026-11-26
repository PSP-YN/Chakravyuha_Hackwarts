#include <Arduino.h>
#include "DHTesp.h"
#include <OneWire.h>
#include <DallasTemperature.h>
#include <math.h>

constexpr uint8_t DHT_PIN = 15;
constexpr uint8_t DS18B20_PIN = 4;
constexpr uint8_t STATUS_LED = 2;
constexpr uint8_t BUZZER_PIN = 18;
constexpr uint8_t RAIN_SENSOR_PIN = 34;
constexpr uint8_t RODENT_PIR_PIN = 27;
constexpr uint8_t INSECT_BEAM_PIN = 26;
constexpr uint8_t WATER_INGRESS_PIN = 25;
constexpr unsigned long SAMPLE_INTERVAL_MS = 2500;

DHTesp dht;
OneWire oneWire(DS18B20_PIN);
DallasTemperature grainProbe(&oneWire);

float previousGrainC = NAN;
int rainIntensityPct = 0;
bool rodentMotionDetected = false;
bool waterIngressDetected = false;
volatile uint32_t insectTrapPulses = 0;
volatile uint32_t lastInsectEdgeUs = 0;
constexpr uint32_t INSECT_DEBOUNCE_US = 50000;
portMUX_TYPE insectMux = portMUX_INITIALIZER_UNLOCKED;
uint32_t rodentMotionEvents = 0;
uint32_t lastAlertedInsectPulses = 0;
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
unsigned long lastSampleMs = 0;

struct Assessment {
  int score;
  const char *level;
};

Assessment assessStorage(float humidity, float deltaC, float grainRiseC) {
  int score = 0;

  if (humidity >= 80.0f) score += 40;
  else if (humidity >= 75.0f) score += 25;
  else if (humidity >= 65.0f) score += 10;

  if (deltaC >= 6.0f) score += 35;
  else if (deltaC >= 4.0f) score += 20;
  else if (deltaC >= 2.0f) score += 10;

  if (!isnan(grainRiseC)) {
    if (grainRiseC >= 2.0f) score += 25;
    else if (grainRiseC >= 1.0f) score += 10;
  }

  score = min(score, 100);
  const char *level = score >= 75 ? "URGENT"
                    : score >= 50 ? "ACTION"
                    : score >= 25 ? "WATCH" : "NORMAL";
  return {score, level};
}

bool validReadings(const TempAndHumidity &air, float grainC) {
  return !isnan(air.temperature) && !isnan(air.humidity) &&
         grainC != DEVICE_DISCONNECTED_C &&
         air.humidity >= 0.0f && air.humidity <= 100.0f &&
         air.temperature >= -10.0f && air.temperature <= 70.0f &&
         grainC >= -10.0f && grainC <= 80.0f;
}

void sensorFault(bool pestAlert, bool waterAlert, bool rainAlert) {
  digitalWrite(STATUS_LED, HIGH);
  if (waterAlert) tone(BUZZER_PIN, 1500, 250);
  else if (pestAlert) tone(BUZZER_PIN, 1100, 180);
  else if (rainAlert) tone(BUZZER_PIN, 700, 100);
  else tone(BUZZER_PIN, 1200, 250);
  Serial.printf("FAULT | SENSOR_READ_ERROR | RAIN %d%% | WATER_INGRESS %s | RODENT %s | INSECT_PULSES %lu | PEST %s\n", rainIntensityPct, waterAlert ? "ACTIVE" : "CLEAR", rodentMotionDetected ? "MOTION" : "CLEAR", (unsigned long)insectTrapPulses, pestAlert ? "ALERT" : "CLEAR");
}

void applyAlarm(const char *level, bool pestAlert, bool waterIngressAlert, bool rainAlert) {
  const bool action = strcmp(level, "ACTION") == 0;
  const bool urgent = strcmp(level, "URGENT") == 0;

  digitalWrite(STATUS_LED, (action || urgent || strcmp(level, "WATCH") == 0 || pestAlert || waterIngressAlert || rainAlert) ? HIGH : LOW);
  if (urgent) tone(BUZZER_PIN, 1800, 500);
  else if (action) tone(BUZZER_PIN, 1200, 180);
  else if (strcmp(level, "WATCH") == 0) tone(BUZZER_PIN, 800, 90);
  else if (waterIngressAlert) tone(BUZZER_PIN, 1500, 250);
  else if (pestAlert) tone(BUZZER_PIN, 1100, 180);
  else if (rainAlert) tone(BUZZER_PIN, 700, 100);
  else noTone(BUZZER_PIN);
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

  Serial.println();
  Serial.println("KRISHI GUARD | GRAIN STORAGE MONITOR");
  Serial.println("Standalone ESP32 simulation - no cloud connection required");
  Serial.println("DHT22: GPIO15 | DS18B20: GPIO4 | LED: GPIO2 | BUZZER: GPIO18");
  Serial.println("Risk score uses humidity, grain-air delta and sample-to-sample grain rise.");
}

void loop() {
  const unsigned long now = millis();
  if (now - lastSampleMs < SAMPLE_INTERVAL_MS) {
    delay(10);
    return;
  }
  lastSampleMs = now;

  // Read all independent GPIO/ADC channels before climate validation.
  rainIntensityPct = constrain(map(analogRead(RAIN_SENSOR_PIN), 4095, 0, 0, 100), 0, 100);
  rodentMotionDetected = digitalRead(RODENT_PIR_PIN) == HIGH;
  waterIngressDetected = digitalRead(WATER_INGRESS_PIN) == LOW;
  if (rodentMotionDetected && !previousRodentMotion) rodentMotionEvents++;
  previousRodentMotion = rodentMotionDetected;
  uint32_t pulseSnapshot;
  portENTER_CRITICAL(&insectMux);
  pulseSnapshot = insectTrapPulses;
  portEXIT_CRITICAL(&insectMux);
  const bool pestAlert = rodentMotionDetected || pulseSnapshot > lastAlertedInsectPulses || rodentMotionEvents > lastAlertedRodentEvents;
  lastAlertedInsectPulses = pulseSnapshot;
  lastAlertedRodentEvents = rodentMotionEvents;

  const TempAndHumidity air = dht.getTempAndHumidity();
  grainProbe.requestTemperatures();
  const float grainC = grainProbe.getTempCByIndex(0);
  if (!validReadings(air, grainC)) {
    previousGrainC = NAN;  // Do not compare against stale data after a sensor fault.
    sensorFault(pestAlert, waterIngressDetected, rainIntensityPct >= 25);
    return;
  }

  const float deltaC = grainC - air.temperature;
  const float riseC = isnan(previousGrainC) ? NAN : grainC - previousGrainC;
  const Assessment result = assessStorage(air.humidity, deltaC, riseC);
  applyAlarm(result.level, pestAlert, waterIngressDetected, rainIntensityPct >= 25);

  Serial.printf("AIR %.1f C | RH %.1f %% | GRAIN %.1f C | DELTA %.1f C | RISE ",
                air.temperature, air.humidity, grainC, deltaC);
  if (isnan(riseC)) Serial.print("N/A");
  else Serial.printf("%.1f C", riseC);
  Serial.printf(" | SCORE %d/100 | STATUS %s | RAIN %d%% | WATER_INGRESS %s | RODENT %s | INSECT_PULSES %lu | PEST %s | RAIN_ALERT %s\n",
                result.score, result.level, rainIntensityPct,
                waterIngressDetected ? "ACTIVE" : "CLEAR",
                rodentMotionDetected ? "MOTION" : "CLEAR",
                (unsigned long)pulseSnapshot, pestAlert ? "ALERT" : "CLEAR", rainIntensityPct >= 25 ? "ACTIVE" : "CLEAR");
  Serial.printf("APP_PAYLOAD {\"ambient_temperature_c\":%.1f,\"relative_humidity_pct\":%.1f,\"grain_temperature_c\":%.1f,\"temperature_delta_c\":%.1f,\"risk_score\":%d,\"risk_level\":\"%s\",\"rain_intensity_pct\":%d,\"water_ingress_detected\":%d,\"rodent_motion_events\":%d,\"insect_trap_pulses\":%lu}\n",
                air.temperature, air.humidity, grainC, deltaC, result.score, result.level,
                rainIntensityPct, waterIngressDetected ? 1 : 0, (int)rodentMotionEvents, (unsigned long)pulseSnapshot);
  previousGrainC = grainC;
}
