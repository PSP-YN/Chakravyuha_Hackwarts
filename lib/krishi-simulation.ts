export type StorageLevel = "NORMAL" | "WATCH" | "ACTION" | "URGENT";

export interface EnvironmentState {
  air: number;
  humidity: number;
  grain: number;
  rain: number;
  roofLeak: boolean;
}

export function assessStorageScenario(air: number, humidity: number, grain: number, previousGrain: number | null) {
  const delta = grain - air;
  let score = 0;
  const reasons: string[] = [];
  if (humidity >= 80) { score += 40; reasons.push("Storage-air relative humidity is very high"); }
  else if (humidity >= 75) { score += 25; reasons.push("Storage-air relative humidity is elevated"); }
  else if (humidity >= 65) { score += 10; reasons.push("Storage-air relative humidity is rising"); }
  if (delta >= 6) { score += 35; reasons.push("Grain core is substantially warmer than storage air"); }
  else if (delta >= 4) { score += 20; reasons.push("Grain core is warmer than storage air"); }
  else if (delta >= 2) { score += 10; reasons.push("Grain core is above ambient temperature"); }
  if (previousGrain !== null && grain - previousGrain >= 2) { score += 25; reasons.push("Grain-core temperature rose by at least 2°C"); }
  else if (previousGrain !== null && grain - previousGrain >= 1) { score += 10; reasons.push("Grain-core temperature is trending upward"); }
  score = Math.min(100, score);
  const level: StorageLevel = score >= 75 ? "URGENT" : score >= 50 ? "ACTION" : score >= 25 ? "WATCH" : "NORMAL";
  if (!reasons.length) reasons.push("No configured storage-condition trigger is active");
  return { score, level, delta, reasons };
}

export function advanceStorageEnvironment(state: EnvironmentState): EnvironmentState {
  const targetHumidity = 54 + state.rain * (state.roofLeak ? 0.42 : 0.12);
  const humidity = Math.min(96, Math.max(42, state.humidity + (targetHumidity - state.humidity) * (state.roofLeak ? 0.03 : 0.006)));
  const air = Math.max(18, Math.min(43, state.air + (state.rain > 20 ? -0.006 : 0.002)));
  const targetGrain = state.air + (state.humidity > 78 ? (state.roofLeak ? 4.5 : 1.8) : 0.2);
  const grain = Math.min(48, Math.max(20, state.grain + (targetGrain - state.grain) * (state.roofLeak && state.rain > 30 ? 0.035 : 0.004)));
  return { ...state, air, humidity, grain };
}

export function assessPestChannel(rodentEvents: number, insectPulses: number, rodentActive: boolean) {
  return rodentEvents >= 3 || insectPulses >= 3 ? "ACTION" : (insectPulses > 0 || rodentEvents > 0 || rodentActive) ? "WATCH" : "CLEAR";
}


export function buildEnvironmentalTelemetryContext(input: {
  rain: number;
  roofLeak: boolean;
  waterContact: boolean;
  rodentEvents: number;
  insectPulses: number;
  pestStatus: string;
  seconds: number;
  scenario: string;
}) {
  return {
    rain_intensity_pct: input.rain,
    // A modelled roof leak is an environmental assumption, not a physical probe reading.
    roof_leak_detected: input.roofLeak,
    water_ingress_detected: input.waterContact,
    rodent_motion_events: input.rodentEvents,
    insect_trap_pulses: input.insectPulses,
    pest_status: input.pestStatus,
    simulation_seconds: input.seconds,
    scenario: input.scenario,
    provenance: "BROWSER_SCENARIO_SIMULATION" as const,
  };
}


export function getStorageAlertOutputs(conditionLevel: StorageLevel, pestStatus: string, waterContact: boolean) {
  const led = conditionLevel !== "NORMAL" || pestStatus !== "CLEAR" || waterContact;
  const buzzer = conditionLevel !== "NORMAL"
    ? conditionLevel
    : waterContact
    ? "WATER CONTACT"
    : pestStatus !== "CLEAR"
    ? "PEST ALERT"
    : "SILENT";
  return { led, buzzer };
}
