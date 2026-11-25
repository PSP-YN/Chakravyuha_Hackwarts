import { createClient } from "npm:@supabase/supabase-js@2.58.0";
import { assessStorageCondition } from "./risk.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SECRET_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-device-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
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
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function validNumber(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

async function authenticatedUser(admin: ReturnType<typeof makeAdmin>, req: Request) {
  const authorization = req.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user || data.user.is_anonymous) return null;
  return data.user;
}

async function registerDevice(admin: ReturnType<typeof makeAdmin>, userId: string, body: Record<string, unknown>) {
  const deviceName = String(body.device_name ?? "").trim();
  const cropType = String(body.crop_type ?? "mixed");
  const storageType = String(body.storage_type ?? "bag");
  const location = String(body.location ?? "").trim();

  if (deviceName.length < 2 || deviceName.length > 80 || location.length < 2 || location.length > 120) {
    return respond({ error: "Enter a device name and storage location." }, 400);
  }
  if (!["paddy", "ragi", "maize", "wheat", "mixed", "other"].includes(cropType)) {
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
    .select("id,device_code,device_name,crop_type,storage_type,location,is_active,created_at,last_seen_at")
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
    message: "Copy the device key now. It is stored only as a hash and cannot be shown again.",
  }, 201);
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

  if (!validNumber(ambient, -10, 70) ||
      !validNumber(humidity, 0, 100) ||
      !validNumber(grain, -10, 80) ||
      (battery !== undefined && battery !== null && !validNumber(battery, 0, 30))) {
    return respond({ error: "Sensor values are outside the accepted ranges." }, 400);
  }

  const { data: previous } = await admin
    .from("storage_guardian_readings")
    .select("grain_temperature_c,recorded_at")
    .eq("device_id", deviceId)
    .gte("recorded_at", new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const assessment = assessStorageCondition({
    ambientTemperatureC: ambient,
    relativeHumidityPct: humidity,
    grainTemperatureC: grain,
    previousGrainTemperatureC: previous ? Number(previous.grain_temperature_c) : null,
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
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return respond({ error: "Method not allowed." }, 405);

  try {
    const admin = makeAdmin();
    const body = await req.json() as Record<string, unknown>;
    const action = String(body.action ?? "");

    if (action === "register" || action === "simulate") {
      const user = await authenticatedUser(admin, req);
      if (!user) return respond({ error: "Sign in to use Storage Guardian." }, 401);

      if (action === "register") {
        return await registerDevice(admin, user.id, body);
      }

      const deviceId = String(body.device_id ?? "");
      const { data: device, error } = await admin
        .from("storage_guardian_devices")
        .select("id")
        .eq("id", deviceId)
        .eq("owner_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (error || !device) return respond({ error: "Device not found or inactive." }, 404);
      return await saveReading(admin, device.id, body, "simulator");
    }

    if (action === "telemetry") {
      const deviceKey = req.headers.get("x-device-key") ?? "";
      if (deviceKey.length !== 64) return respond({ error: "Missing or invalid device key." }, 401);

      const tokenHash = await sha256(deviceKey);
      const { data: credential, error: credentialError } = await admin
        .from("storage_guardian_device_keys")
        .select("device_id")
        .eq("token_hash", tokenHash)
        .is("revoked_at", null)
        .maybeSingle();

      if (credentialError || !credential) return respond({ error: "Device authentication failed." }, 401);

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
    return respond({ error: "Storage Guardian service is temporarily unavailable." }, 500);
  }
});
