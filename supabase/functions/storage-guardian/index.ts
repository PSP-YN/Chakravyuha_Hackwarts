import { createClient } from "npm:@supabase/supabase-js@2.58.0";
import { assessStorageCondition } from "./risk.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  Deno.env.get("SUPABASE_SECRET_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info, x-device-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

function respond(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function makeAdmin() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error("Storage Guardian server credentials are not configured");
  }
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function randomDeviceKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(
    new Uint8Array(digest),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("");
}

function validNumber(
  value: unknown,
  min: number,
  max: number,
): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= min &&
    value <= max;
}

async function profileIsComplete(
  admin: ReturnType<typeof makeAdmin>,
  userId: string,
) {
  const { data, error } = await admin
    .from("user_profiles")
    .select("profile_completed")
    .eq("user_id", userId)
    .maybeSingle();
  return !error && data?.profile_completed === true;
}

async function authenticatedUser(
  admin: ReturnType<typeof makeAdmin>,
  req: Request,
) {
  const authorization = req.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user || data.user.is_anonymous) return null;
  return data.user;
}

async function registerDevice(
  admin: ReturnType<typeof makeAdmin>,
  userId: string,
  body: Record<string, unknown>,
) {
  if (!(await profileIsComplete(admin, userId))) {
    return respond({
      error:
        "Complete your participant profile before registering a storage device.",
    }, 403);
  }
  const deviceName = String(body.device_name ?? "").trim();
  const cropType = String(body.crop_type ?? "mixed");
  const storageType = String(body.storage_type ?? "bag");
  const location = String(body.location ?? "").trim();

  if (
    deviceName.length < 2 || deviceName.length > 80 || location.length < 2 ||
    location.length > 120
  ) {
    return respond({ error: "Enter a device name and storage location." }, 400);
  }
  if (
    !["paddy", "ragi", "maize", "wheat", "mixed", "other"].includes(cropType)
  ) {
    return respond({ error: "Unsupported crop type." }, 400);
  }
  if (!["bag", "bin", "silo", "room", "other"].includes(storageType)) {
    return respond({ error: "Unsupported storage type." }, 400);
  }

  const deviceKey = randomDeviceKey();
  const tokenHash = await sha256(deviceKey);
  const deviceCode = "KG-" + crypto.randomUUID().slice(0, 8).toUpperCase();

  const { data: device, error: deviceError } = await admin
    .from("storage_guardian_devices")
    .insert({
      owner_id: userId,
      device_code: deviceCode,
      device_name: deviceName,
      crop_type: cropType,
      storage_type: storageType,
      location,
    })
    .select(
      "id,device_code,device_name,crop_type,storage_type,location,is_active,created_at,last_seen_at",
    )
    .single();

  if (deviceError || !device) {
    return respond({ error: "Device registration failed." }, 500);
  }

  const { error: keyError } = await admin
    .from("storage_guardian_device_keys")
    .insert({ device_id: device.id, token_hash: tokenHash });

  if (keyError) {
    await admin.from("storage_guardian_devices").delete().eq("id", device.id);
    return respond({ error: "Device credential could not be created." }, 500);
  }

  return respond({
    device,
    device_key: deviceKey,
    endpoint: SUPABASE_URL + "/functions/v1/storage-guardian",
    message:
      "Copy the device key now. It is stored only as a hash and cannot be shown again.",
  }, 201);
}

async function registerSimulatorDevice(
  admin: ReturnType<typeof makeAdmin>,
  userId: string,
  body: Record<string, unknown>,
) {
  if (!(await profileIsComplete(admin, userId))) {
    return respond({ error: "Complete your participant profile before creating a Wokwi demo node." }, 403);
  }
  const deviceName = String(body.device_name ?? "KRISHI GUARD Wokwi demo").trim();
  const cropType = String(body.crop_type ?? "paddy");
  const storageType = String(body.storage_type ?? "bag");
  const location = String(body.location ?? "").trim();
  if (deviceName.length < 2 || deviceName.length > 80 || location.length < 2 || location.length > 120) {
    return respond({ error: "Enter a demo node name and storage location." }, 400);
  }
  if (!["paddy", "ragi", "maize", "wheat", "mixed", "other"].includes(cropType)) {
    return respond({ error: "Unsupported crop type." }, 400);
  }
  if (!["bag", "bin", "silo", "room", "other"].includes(storageType)) {
    return respond({ error: "Unsupported storage type." }, 400);
  }
  const deviceCode = "SIM-" + crypto.randomUUID().slice(0, 8).toUpperCase();
  const { data: device, error } = await admin
    .from("storage_guardian_devices")
    .insert({
      owner_id: userId,
      device_code: deviceCode,
      device_name: deviceName,
      crop_type: cropType,
      storage_type: storageType,
      location,
    })
    .select("id,device_code,device_name,crop_type,storage_type,location,is_active,created_at,last_seen_at")
    .single();
  if (error || !device) return respond({ error: "Wokwi demo node could not be created." }, 500);
  return respond({
    device,
    mode: "simulator",
    message: "Wokwi demo node created. It accepts signed-in simulator readings and does not require a physical ESP32 or device API key.",
  }, 201);
}

async function revokeDevice(
  admin: ReturnType<typeof makeAdmin>,
  userId: string,
  body: Record<string, unknown>,
) {
  const deviceId = String(body.device_id ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(deviceId)) {
    return respond({ error: "Invalid device identifier." }, 400);
  }
  const { data: device, error: lookupError } = await admin
    .from("storage_guardian_devices")
    .select("id,is_active")
    .eq("id", deviceId)
    .eq("owner_id", userId)
    .maybeSingle();
  if (lookupError || !device) {
    return respond({ error: "Device not found." }, 404);
  }

  // Disable ingestion first. Even if key revocation fails, the device cannot submit readings.
  const { error: deactivateError } = await admin
    .from("storage_guardian_devices")
    .update({ is_active: false })
    .eq("id", device.id)
    .eq("owner_id", userId);
  if (deactivateError) {
    return respond(
      { error: "Device could not be deactivated. Try again." },
      500,
    );
  }

  const { error: keyError } = await admin
    .from("storage_guardian_device_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("device_id", device.id)
    .is("revoked_at", null);
  if (keyError) {
    return respond({
      error: "Device was disabled, but key revocation needs a retry.",
    }, 500);
  }
  return respond({
    device_id: device.id,
    is_active: false,
    revoked: true,
    message: "Device disabled and its key revoked.",
  });
}

async function saveReading(
  admin: ReturnType<typeof makeAdmin>,
  deviceId: string,
  body: Record<string, unknown>,
  source: "device" | "simulator",
) {
  const ambient = body.ambient_temperature_c;
  const humidity = body.relative_humidity_pct;
  const grain = body.grain_temperature_c;
  const battery = body.battery_voltage;

  if (
    !validNumber(ambient, -10, 70) ||
    !validNumber(humidity, 0, 100) ||
    !validNumber(grain, -10, 80) ||
    (battery !== undefined && battery !== null && !validNumber(battery, 0, 30))
  ) {
    return respond(
      { error: "Sensor values are outside the accepted ranges." },
      400,
    );
  }

  let telemetryContext: Record<string, unknown> = {};
  const rawContext = body.environmental_context;
  if (rawContext !== undefined) {
    if (!rawContext || typeof rawContext !== "object" || Array.isArray(rawContext)) {
      return respond({ error: "Environmental context must be an object." }, 400);
    }
    const context = rawContext as Record<string, unknown>;
    const rain = context.rain_intensity_pct ?? 0;
    const rodents = context.rodent_motion_events ?? 0;
    const insects = context.insect_trap_pulses ?? 0;
    if (!validNumber(rain, 0, 100) ||
        !Number.isInteger(rodents) || Number(rodents) < 0 || Number(rodents) > 10000 ||
        !Number.isInteger(insects) || Number(insects) < 0 || Number(insects) > 10000 ||
        (context.roof_leak_detected !== undefined && typeof context.roof_leak_detected !== "boolean") ||
        (context.water_ingress_detected !== undefined && typeof context.water_ingress_detected !== "boolean") ||
        (context.pest_status !== undefined && !["CLEAR", "WATCH", "ACTION"].includes(String(context.pest_status))) ||
        (context.scenario !== undefined && (typeof context.scenario !== "string" || context.scenario.length > 80)) ||
        (context.simulation_seconds !== undefined && !validNumber(context.simulation_seconds, 0, 86400)) ||
        (context.provenance !== undefined && !["BROWSER_SCENARIO_SIMULATION", "DEVICE_SENSOR"].includes(String(context.provenance)))) {
      return respond({ error: "Environmental or pest telemetry is outside accepted ranges." }, 400);
    }
    telemetryContext = {
      rain_intensity_pct: rain,
      // Keep a modelled roof-ingress assumption distinct from a physical water-contact input.
      roof_leak_detected: context.roof_leak_detected === true,
      water_ingress_detected: context.water_ingress_detected === true,
      rodent_motion_events: rodents,
      insect_trap_pulses: insects,
      pest_status: context.pest_status ?? "CLEAR",
      scenario: typeof context.scenario === "string" ? context.scenario : "device telemetry",
      simulation_seconds: source === "simulator" ? (context.simulation_seconds ?? null) : null,
      provenance: source === "simulator" ? "BROWSER_SCENARIO_SIMULATION" : "DEVICE_SENSOR",
    };
  }

  const { data: previous } = await admin
    .from("storage_guardian_readings")
    .select("grain_temperature_c,recorded_at")
    .eq("device_id", deviceId)
    .gte("recorded_at", new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (
    previous && Date.now() - new Date(previous.recorded_at).getTime() < 5000
  ) {
    return respond({
      error:
        "Readings are arriving too quickly. Wait at least five seconds between submissions.",
    }, 429);
  }
  const { count: recentCount, error: rateError } = await admin
    .from("storage_guardian_readings")
    .select("id", { count: "exact", head: true })
    .eq("device_id", deviceId)
    .gte("recorded_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());
  if (rateError) {
    return respond({ error: "Telemetry rate could not be checked." }, 500);
  }
  if ((recentCount ?? 0) >= 150) {
    return respond({
      error: "Device telemetry limit reached. Try again later.",
    }, 429);
  }

  const assessment = assessStorageCondition({
    ambientTemperatureC: ambient,
    relativeHumidityPct: humidity,
    grainTemperatureC: grain,
    previousGrainTemperatureC: previous
      ? Number(previous.grain_temperature_c)
      : null,
  });

  const { data: reading, error } = await admin
    .from("storage_guardian_readings")
    .insert({
      device_id: deviceId,
      ambient_temperature_c: ambient,
      relative_humidity_pct: humidity,
      grain_temperature_c: grain,
      temperature_delta_c: assessment.temperatureDeltaC,
      condition_score: assessment.score,
      condition_level: assessment.level,
      reasons: assessment.reasons,
      battery_voltage: battery ?? null,
      source,
      telemetry_context: telemetryContext,
    })
    .select("*")
    .single();

  if (error || !reading) {
    return respond({ error: "Reading could not be saved." }, 500);
  }

  await admin
    .from("storage_guardian_devices")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", deviceId);

  return respond({ reading, assessment });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return respond({ error: "Method not allowed." }, 405);
  }

  try {
    const admin = makeAdmin();
    const declaredLength = Number(req.headers.get("content-length") ?? 0);
    if (declaredLength > 16384) {
      return respond({ error: "Request body is too large." }, 413);
    }
    const rawBody = await req.text();
    if (rawBody.length > 16384) {
      return respond({ error: "Request body is too large." }, 413);
    }
    let body: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(rawBody);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return respond({ error: "Request body must be a JSON object." }, 400);
      }
      body = parsed as Record<string, unknown>;
    } catch {
      return respond({ error: "Invalid JSON body." }, 400);
    }
    const action = String(body.action ?? "");

    if (action === "register" || action === "register_simulator" || action === "simulate" || action === "revoke") {
      const user = await authenticatedUser(admin, req);
      if (!user) {
        return respond({ error: "Sign in to use Storage Guardian." }, 401);
      }

      if (action === "register") {
        return await registerDevice(admin, user.id, body);
      }
      if (action === "register_simulator") {
        return await registerSimulatorDevice(admin, user.id, body);
      }
      if (action === "revoke") {
        return await revokeDevice(admin, user.id, body);
      }

      if (!(await profileIsComplete(admin, user.id))) {
        return respond({
          error:
            "Complete your participant profile before submitting simulated readings.",
        }, 403);
      }
      const deviceId = String(body.device_id ?? "");
      const { data: device, error } = await admin
        .from("storage_guardian_devices")
        .select("id")
        .eq("id", deviceId)
        .eq("owner_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (error || !device) {
        return respond({ error: "Device not found or inactive." }, 404);
      }
      return await saveReading(admin, device.id, body, "simulator");
    }

    if (action === "telemetry") {
      const deviceKey = req.headers.get("x-device-key") ?? "";
      if (!/^[0-9a-f]{64}$/.test(deviceKey)) {
        return respond({ error: "Missing or invalid device key." }, 401);
      }

      const tokenHash = await sha256(deviceKey);
      const { data: credential, error: credentialError } = await admin
        .from("storage_guardian_device_keys")
        .select("device_id")
        .eq("token_hash", tokenHash)
        .is("revoked_at", null)
        .maybeSingle();

      if (credentialError || !credential) {
        return respond({ error: "Device authentication failed." }, 401);
      }

      const { data: device, error: deviceError } = await admin
        .from("storage_guardian_devices")
        .select("id,is_active")
        .eq("id", credential.device_id)
        .maybeSingle();

      if (deviceError || !device || !device.is_active) {
        return respond({ error: "Device is inactive or unavailable." }, 403);
      }

      return await saveReading(admin, device.id, body, "device");
    }

    return respond({ error: "Unsupported action." }, 400);
  } catch (error) {
    console.error("Storage Guardian request failed:", error);
    return respond({
      error: "Storage Guardian service is temporarily unavailable.",
    }, 500);
  }
});
