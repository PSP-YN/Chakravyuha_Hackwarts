export type StorageCondition = {
  score: number;
  level: "NORMAL" | "WATCH" | "ACTION" | "URGENT";
  reasons: string[];
  temperatureDeltaC: number;
};

export function assessStorageCondition(input: {
  ambientTemperatureC: number;
  relativeHumidityPct: number;
  grainTemperatureC: number;
  previousGrainTemperatureC?: number | null;
}): StorageCondition {
  const delta = input.grainTemperatureC - input.ambientTemperatureC;
  const trend = input.previousGrainTemperatureC == null
    ? null
    : input.grainTemperatureC - input.previousGrainTemperatureC;

  let score = 0;
  const reasons: string[] = [];

  if (input.relativeHumidityPct >= 80) {
    score += 40;
    reasons.push("Ambient relative humidity is very high");
  } else if (input.relativeHumidityPct >= 75) {
    score += 25;
    reasons.push("Ambient relative humidity is elevated");
  } else if (input.relativeHumidityPct >= 65) {
    score += 10;
    reasons.push("Ambient relative humidity is rising");
  }

  if (delta >= 6) {
    score += 35;
    reasons.push("Grain core is much warmer than surrounding air");
  } else if (delta >= 4) {
    score += 20;
    reasons.push("Grain core is warmer than surrounding air");
  } else if (delta >= 2) {
    score += 10;
    reasons.push("Grain core temperature is above ambient");
  }

  if (trend !== null && trend >= 2) {
    score += 25;
    reasons.push(
      "Grain core temperature rose by at least 2 C in the recent comparison window",
    );
  } else if (trend !== null && trend >= 1) {
    score += 10;
    reasons.push("Grain core temperature is trending upward");
  }

  score = Math.min(100, score);
  const level = score >= 75
    ? "URGENT"
    : score >= 50
    ? "ACTION"
    : score >= 25
    ? "WATCH"
    : "NORMAL";

  if (reasons.length === 0) {
    reasons.push("No configured storage-condition trigger is currently active");
  }

  return {
    score,
    level,
    reasons,
    temperatureDeltaC: Math.round(delta * 100) / 100,
  };
}
