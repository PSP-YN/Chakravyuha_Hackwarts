#include <Arduino.h>
#include "DHTesp.h"
#include <OneWire.h>
#include <DallasTemperature.h>

#define DHT_PIN 15
#define DS18B20_PIN 4
#define STATUS_LED 2
#define BUZZER_PIN 18

DHTesp dht;
OneWire oneWire(DS18B20_PIN);
DallasTemperature grainProbe(&oneWire);

void setup() {
  Serial.begin(115200);
  pinMode(STATUS_LED, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  dht.setup(DHT_PIN, DHTesp::DHT22);
  grainProbe.begin();
  Serial.println("KRISHI GUARD WOKWI SIMULATION READY");
  Serial.println("Change DHT22 humidity and DS18B20 temperature while running.");
}

void loop() {
  TempAndHumidity air = dht.getTempAndHumidity();
  grainProbe.requestTemperatures();
  float grain = grainProbe.getTempCByIndex(0);

  if (isnan(air.temperature) || isnan(air.humidity) ||
      grain == DEVICE_DISCONNECTED_C) {
    digitalWrite(STATUS_LED, HIGH);
    tone(BUZZER_PIN, 1200, 150);
    Serial.println("SENSOR FAULT");
    delay(2000);
    return;
  }

  float delta = grain - air.temperature;
  bool urgent = air.humidity >= 80.0 && delta >= 6.0;
  bool watch = air.humidity >= 75.0 || delta >= 4.0;

  digitalWrite(STATUS_LED, urgent ? HIGH : LOW);
  if (urgent) tone(BUZZER_PIN, 1800, 350);
  else if (watch) tone(BUZZER_PIN, 900, 100);
  else noTone(BUZZER_PIN);

  Serial.printf("AIR %.1f C | RH %.1f %% | GRAIN %.1f C | DELTA %.1f C | STATUS %s\n",
    air.temperature, air.humidity, grain, delta,
    urgent ? "URGENT" : watch ? "WATCH" : "NORMAL");
  Serial.printf("APP_PAYLOAD {\"ambient_temperature_c\":%.1f,\"relative_humidity_pct\":%.1f,\"grain_temperature_c\":%.1f}\n",
    air.temperature, air.humidity, grain);

  delay(2500);
}
