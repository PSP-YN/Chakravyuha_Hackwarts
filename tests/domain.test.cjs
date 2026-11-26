const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const filename = path.resolve(__dirname, '../lib/domain.ts');
const compiled = ts.transpile(fs.readFileSync(filename, 'utf8'), { module: ts.ModuleKind.CommonJS });
const domain = new Module(filename, module);
domain.filename = filename;
domain.paths = Module._nodeModulePaths(path.dirname(filename));
domain._compile(compiled, filename);
const { money, netPaise, toPaise, validateFpoAllocations, canTransitionTransportJob, canMakeOffer } = domain.exports;
const { assessStorageCondition } = require("../supabase/functions/storage-guardian/risk.ts");

const simulationFilename = path.resolve(__dirname, "../lib/krishi-simulation.ts");
const simulationCompiled = ts.transpile(fs.readFileSync(simulationFilename, "utf8"), { module: ts.ModuleKind.CommonJS });
const simulationModule = new Module(simulationFilename, module);
simulationModule.filename = simulationFilename;
simulationModule.paths = Module._nodeModulePaths(path.dirname(simulationFilename));
simulationModule._compile(simulationCompiled, simulationFilename);
const { advanceStorageEnvironment, assessPestChannel, assessStorageScenario, buildEnvironmentalTelemetryContext, getStorageAlertOutputs, parseWokwiSerialOutput } = simulationModule.exports;

test('rupee amounts convert to integer paise without floating point drift', () => {
  assert.equal(toPaise('2400'), 240000);
  assert.equal(toPaise('0.1'), 10);
  assert.equal(toPaise('19.99'), 1999);
});

test('invalid negative and non-finite amounts are rejected', () => {
  assert.throws(() => toPaise('-1'));
  assert.throws(() => toPaise('NaN'));
  assert.throws(() => toPaise('Infinity'));
});

test('formats rupee amounts using Indian grouping', () => {
  assert.equal(money(1795000), '₹17,950');
});

test('net realisation subtracts farmer-borne costs from gross offer value', () => {
  const offer = {
    id: 'test', listing_id: 'listing', buyer_id: 'buyer', owner_id: 'seller',
    offered_price_paise: 240000, accepted_quantity: 8,
    transport_cost_paise: 50000, handling_cost_paise: 25000,
    commission_cost_paise: 30000, other_cost_paise: 20000,
    status: 'completed', created_at: new Date(0).toISOString(),
  };
  assert.equal(netPaise(offer), 1795000);
});

test("FPO aggregate lots require unique active member quantities to equal the lot total", () => {
  const active = new Set(["m1", "m2"]);
  assert.equal(validateFpoAllocations(10, [{ memberId: "m1", quantity: 4 }, { memberId: "m2", quantity: 6 }], active), true);
  assert.equal(validateFpoAllocations(10, [{ memberId: "m1", quantity: 4 }, { memberId: "m2", quantity: 5 }], active), false);
  assert.equal(validateFpoAllocations(10, [{ memberId: "m1", quantity: 4 }, { memberId: "m1", quantity: 6 }], active), false);
  assert.equal(validateFpoAllocations(10, [{ memberId: "inactive", quantity: 10 }], active), false);
});

test("KrishiTransit lifecycle enforces transporter and receiver responsibilities", () => {
  assert.equal(canTransitionTransportJob("confirmed", "pickup_ready", "transporter"), true);
  assert.equal(canTransitionTransportJob("confirmed", "picked_up", "transporter"), false);
  assert.equal(canTransitionTransportJob("in_transit", "delivered_pending_confirmation", "transporter"), true);
  assert.equal(canTransitionTransportJob("delivered_pending_confirmation", "completed", "requester"), true);
  assert.equal(canTransitionTransportJob("delivered_pending_confirmation", "completed", "transporter"), false);
  assert.equal(canTransitionTransportJob("picked_up", "cancelled", "requester"), false);
});

test("storage condition score is transparent and separates advisory levels", () => {
  const normal = assessStorageCondition({ ambientTemperatureC: 28, relativeHumidityPct: 55, grainTemperatureC: 29 });
  assert.equal(normal.score, 0);
  assert.equal(normal.level, "NORMAL");
  const watch = assessStorageCondition({ ambientTemperatureC: 28, relativeHumidityPct: 75, grainTemperatureC: 28 });
  assert.equal(watch.score, 25);
  assert.equal(watch.level, "WATCH");
  const urgent = assessStorageCondition({ ambientTemperatureC: 28, relativeHumidityPct: 80, grainTemperatureC: 34 });
  assert.equal(urgent.score, 75);
  assert.equal(urgent.level, "URGENT");
  const trend = assessStorageCondition({ ambientTemperatureC: 28, relativeHumidityPct: 55, grainTemperatureC: 30, previousGrainTemperatureC: 27.5 });
  assert.equal(trend.level, "WATCH");
});


test("rain exposure only raises indoor humidity gradually when a roof-ingress path is modelled", () => {
  let dry = { air: 29, humidity: 54, grain: 29, rain: 100, roofLeak: false };
  let leaking = { air: 29, humidity: 54, grain: 29, rain: 92, roofLeak: true };
  for (let i = 0; i < 40; i++) {
    dry = advanceStorageEnvironment(dry);
    leaking = advanceStorageEnvironment(leaking);
  }
  assert.ok(dry.humidity < 60, "rain plate alone must not imply indoor ingress");
  assert.ok(leaking.humidity > 78, "roof-ingress model must raise indoor humidity over time");
  assert.ok(leaking.grain > 29.5, "grain temperature should evolve gradually");
});

test("pest channel severity is independent from the grain-condition score", () => {
  assert.equal(assessPestChannel(0, 0, false), "CLEAR");
  assert.equal(assessPestChannel(1, 0, false), "WATCH");
  assert.equal(assessPestChannel(0, 3, false), "ACTION");
  const grain = assessStorageScenario(29, 54, 29, null);
  assert.equal(grain.level, "NORMAL");
});

test("browser digital twin uses the same grain-condition thresholds as the firmware", () => {
  const action = assessStorageScenario(30, 80, 34, null);
  const urgent = assessStorageScenario(29, 82, 38, null);
  assert.equal(action.score, 60);
  assert.equal(action.level, "ACTION");
  assert.equal(urgent.score, 75);
  assert.equal(urgent.level, "URGENT");
});
test("market offers are limited to role-appropriate modules", () => {
  assert.equal(canMakeOffer("buyer_trader", "produce"), true);
  assert.equal(canMakeOffer("buyer_trader", "transport"), true);
  assert.equal(canMakeOffer("buyer_trader", "machinery"), false);
  assert.equal(canMakeOffer("farmer", "machinery"), true);
  assert.equal(canMakeOffer("fpo_cooperative", "transport"), true);
  assert.equal(canMakeOffer("waste_processor", "byproduct"), false);
  assert.equal(canMakeOffer("transporter", "transport"), false);
  assert.equal(canMakeOffer("municipality", "produce"), false);
});

test("simulator telemetry keeps modelled roof ingress separate from physical water contact", () => {
  const roofLeakOnly = buildEnvironmentalTelemetryContext({ rain: 92, roofLeak: true, waterContact: false, rodentEvents: 0, insectPulses: 0, pestStatus: "CLEAR", seconds: 12, scenario: "Heavy rain + roof leak" });
  assert.equal(roofLeakOnly.roof_leak_detected, true);
  assert.equal(roofLeakOnly.water_ingress_detected, false);
  assert.equal(roofLeakOnly.provenance, "BROWSER_SCENARIO_SIMULATION");
  const probeWet = buildEnvironmentalTelemetryContext({ rain: 0, roofLeak: false, waterContact: true, rodentEvents: 0, insectPulses: 0, pestStatus: "CLEAR", seconds: 15, scenario: "Water-contact probe" });
  assert.equal(probeWet.roof_leak_detected, false);
  assert.equal(probeWet.water_ingress_detected, true);
});

test("water-contact and pest events activate local alert outputs independently of grain score", () => {
  assert.deepEqual(getStorageAlertOutputs("NORMAL", "CLEAR", false), { led: false, buzzer: "SILENT" });
  assert.deepEqual(getStorageAlertOutputs("NORMAL", "CLEAR", true), { led: true, buzzer: "WATER CONTACT" });
  assert.deepEqual(getStorageAlertOutputs("NORMAL", "WATCH", false), { led: true, buzzer: "PEST ALERT" });
  assert.deepEqual(getStorageAlertOutputs("ACTION", "CLEAR", false), { led: true, buzzer: "ACTION" });
});


test("rain wetness activates the simulated ESP32 alarm without asserting roof leakage", () => {
  assert.deepEqual(getStorageAlertOutputs("NORMAL", "CLEAR", false, false, false), { led: false, buzzer: "SILENT" });
  assert.deepEqual(getStorageAlertOutputs("NORMAL", "CLEAR", false, false, true), { led: true, buzzer: "RAIN DETECTED" });
  assert.deepEqual(getStorageAlertOutputs("NORMAL", "CLEAR", false, true, false), { led: true, buzzer: "SENSOR FAULT" });
});


test("Wokwi APP_PAYLOAD lines parse into bounded sensor and event readings", () => {
  const reading = parseWokwiSerialOutput('APP_PAYLOAD {"ambient_temperature_c":30,"relative_humidity_pct":82,"grain_temperature_c":36,"rain_intensity_pct":92,"water_ingress_detected":1,"rodent_motion_events":2,"insect_trap_pulses":4}');
  assert.equal(reading.ambientTemperatureC, 30);
  assert.equal(reading.relativeHumidityPct, 82);
  assert.equal(reading.grainTemperatureC, 36);
  assert.equal(reading.rainIntensityPct, 92);
  assert.equal(reading.waterIngressDetected, true);
  assert.equal(reading.rodentMotionEvents, 2);
  assert.equal(reading.insectTrapPulses, 4);
});

test("Wokwi APP_PAYLOAD rejects malformed and out-of-range sensor data", () => {
  assert.throws(() => parseWokwiSerialOutput("not-json"));
  assert.throws(() => parseWokwiSerialOutput('APP_PAYLOAD {"ambient_temperature_c":99,"relative_humidity_pct":55,"grain_temperature_c":30}'));
  assert.throws(() => parseWokwiSerialOutput('APP_PAYLOAD {"ambient_temperature_c":30,"relative_humidity_pct":55,"grain_temperature_c":30,"insect_trap_pulses":1.5}'));
});
