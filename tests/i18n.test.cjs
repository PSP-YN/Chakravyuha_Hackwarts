const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(
  path.join(__dirname, "../components/krishi-extra-translations.ts"),
  "utf8",
);
const entries = [...source.matchAll(/^\s*"([^"]+)":\s*"([^"]*)",?$/gm)];
const translations = new Map(entries.map(([, key, value]) => [key, value]));
const hasKannada = (value) => /[\u0C80-\u0CFF]/u.test(value);

test("critical Storage Guardian UI copy has Kannada translations", () => {
  const required = [
    "Explore a Wokwi-powered grain-store digital twin. Change virtual sensor inputs, inspect the ESP32 alarm response and send clearly labelled simulation readings into your Storage Guardian dashboard.",
    "Sign in to create your Wokwi demo node",
    "Create a Wokwi demo node",
    "DEMO ARCHITECTURE",
    "Wokwi circuit → simulator bridge → Storage Guardian",
    "Storage condition indicators are advisory. They do not certify grain quality, diagnose fungal contamination, measure grain moisture or replace inspection and laboratory testing. Thresholds require local crop and storage validation.",
    "Rain plate wetness",
    "DHT22 air temperature",
    "DHT22 relative humidity",
    "DS18B20 grain-core temperature",
    "Ambient relative humidity is very high",
    "Grain core is much warmer than surrounding air",
    "Search marketplace listings",
    "Recent environmental readings",
    "Primary navigation",
    "If the embedded Wokwi serial stream is unavailable, open the public Wokwi baseline in a separate tab, copy its APP_PAYLOAD line from Serial Monitor, paste it here, and send it into Storage Guardian history. Imported readings are always labelled SIMULATOR. The full multi-sensor circuit is loaded in the embedded simulator above.",
    "Receives the simulator reading through the authenticated Edge Function, calculates the condition indicator and displays SIMULATOR provenance, history and alerts.",
    "Wokwi reading parsed locally. Select a demo node to send it to the dashboard.",
    "Wokwi serial sample saved in Storage Guardian as SIMULATOR data.",
  ];
  for (const key of required) {
    assert.ok(translations.has(key), "Missing Kannada key: " + key);
    assert.ok(hasKannada(translations.get(key)), "Translation is not Kannada: " + key);
  }
  const wokwiInstructions = "If the embedded Wokwi serial stream is unavailable, open the public Wokwi baseline in a separate tab, copy its APP_PAYLOAD line from Serial Monitor, paste it here, and send it into Storage Guardian history. Imported readings are always labelled SIMULATOR. The full multi-sensor circuit is loaded in the embedded simulator above.";
  const edgeFunctionArchitecture = "Receives the simulator reading through the authenticated Edge Function, calculates the condition indicator and displays SIMULATOR provenance, history and alerts.";
  assert.doesNotMatch(translations.get(wokwiInstructions), /Serial Monitor|SIMULATOR/);
  assert.doesNotMatch(translations.get(edgeFunctionArchitecture), /Edge Function|SIMULATOR/);
});

test("new Kannada dictionary keys are unique", () => {
  const counts = new Map();
  for (const [, key] of entries) counts.set(key, (counts.get(key) ?? 0) + 1);
  const duplicates = [...counts].filter(([, count]) => count > 1).map(([key]) => key);
  assert.deepEqual(duplicates, []);
});

test("document and Storage Guardian metadata default to Kannada", () => {
  const layout = fs.readFileSync(path.join(__dirname, "../app/layout.tsx"), "utf8");
  const storage = fs.readFileSync(path.join(__dirname, "../app/workspace/storage-guardian/page.tsx"), "utf8");
  assert.match(layout, /<html lang="kn">/);
  assert.match(layout, /locale: "kn_IN"/);
  assert.match(layout, /description: "ಬೆಳೆ ವ್ಯಾಪಾರ/);
  assert.match(storage, /title: "ಕೃಷಿ ಗಾರ್ಡ್ — ಸಂಗ್ರಹಣೆ ಮಾಹಿತಿ/);
  assert.match(storage, /description: "ಕಡಿಮೆ ವೆಚ್ಚದ ಸಂಪರ್ಕಿತ ಸಂವೇದಕ/);
});
