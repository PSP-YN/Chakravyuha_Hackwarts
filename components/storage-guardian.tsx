"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase/client";
import { Localize } from "@/components/language-provider";

type Device = {
  id: string;
  device_code: string;
  device_name: string;
  crop_type: string;
  storage_type: string;
  location: string;
  is_active: boolean;
  created_at: string;
  last_seen_at: string | null;
};

type Reading = {
  id: number;
  device_id: string;
  ambient_temperature_c: number;
  relative_humidity_pct: number;
  grain_temperature_c: number;
  temperature_delta_c: number;
  condition_score: number;
  condition_level: "NORMAL" | "WATCH" | "ACTION" | "URGENT";
  reasons: string[];
  battery_voltage: number | null;
  source: "device" | "simulator";
  recorded_at: string;
};

const fmt = (value: string | null) => value
  ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
  : "Never connected";

export function StorageGuardian() {
  const db = getSupabase();
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [newDeviceKey, setNewDeviceKey] = useState("");
  const [copied, setCopied] = useState(false);

  const [deviceName, setDeviceName] = useState("Main grain store");
  const [cropType, setCropType] = useState("paddy");
  const [storageType, setStorageType] = useState("bag");
  const [location, setLocation] = useState("");

  const [ambientTemp, setAmbientTemp] = useState(30);
  const [humidity, setHumidity] = useState(55);
  const [grainTemp, setGrainTemp] = useState(30);

  const refresh = useCallback(async () => {
    if (!db || !session) return;
    setLoading(true);
    setError("");
    const { data: deviceRows, error: deviceError } = await db
      .from("storage_guardian_devices")
      .select("id,device_code,device_name,crop_type,storage_type,location,is_active,created_at,last_seen_at")
      .order("created_at", { ascending: false });
    if (deviceError) {
      setError(deviceError.message);
      setLoading(false);
      return;
    }
    const rows = (deviceRows ?? []) as Device[];
    setDevices(rows);
    if (!selectedDevice && rows.length) setSelectedDevice(rows[0].id);
    if (!rows.length) {
      setReadings([]);
      setLoading(false);
      return;
    }
    const { data: readingRows, error: readingError } = await db
      .from("storage_guardian_readings")
      .select("id,device_id,ambient_temperature_c,relative_humidity_pct,grain_temperature_c,temperature_delta_c,condition_score,condition_level,reasons,battery_voltage,source,recorded_at")
      .in("device_id", rows.map((row) => row.id))
      .order("recorded_at", { ascending: false })
      .limit(60);
    if (readingError) setError(readingError.message);
    setReadings((readingRows ?? []) as Reading[]);
    setLoading(false);
  }, [db, session, selectedDevice]);

  useEffect(() => {
    if (!db) {
      setAuthReady(true);
      return;
    }
    let alive = true;
    db.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session);
      setAuthReady(true);
    });
    const { data } = db.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthReady(true);
      if (!nextSession) {
        setDevices([]);
        setReadings([]);
      }
    });
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, [db]);

  useEffect(() => { void refresh(); }, [refresh]);

  const selected = devices.find((device) => device.id === selectedDevice) ?? devices[0] ?? null;
  const latest = useMemo(
    () => readings.find((reading) => reading.device_id === selected?.id) ?? null,
    [readings, selected],
  );
  const selectedReadings = readings.filter((reading) => reading.device_id === selected?.id).slice(0, 12);
  const statusClass = latest?.condition_level.toLowerCase() ?? "empty";

  async function registerDevice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!db) return;
    setBusy(true);
    setError("");
    setNotice("");
    setNewDeviceKey("");
    const { data, error: invokeError } = await db.functions.invoke("storage-guardian", {
      body: {
        action: "register",
        device_name: deviceName,
        crop_type: cropType,
        storage_type: storageType,
        location,
      },
    });
    if (invokeError || data?.error) {
      setError(data?.error ?? invokeError?.message ?? "Device registration failed.");
    } else {
      setNewDeviceKey(String(data.device_key ?? ""));
      setSelectedDevice(String(data.device?.id ?? ""));
      setNotice("Device registered. Copy its key now; it will not be displayed again.");
      await refresh();
    }
    setBusy(false);
  }

  async function sendSimulation(values?: { ambient: number; humidity: number; grain: number }) {
    if (!db || !selected) {
      setError("Register a device before sending a simulated reading.");
      return;
    }
    const sample = values ?? { ambient: ambientTemp, humidity, grain: grainTemp };
    setBusy(true);
    setError("");
    setNotice("");
    const { data, error: invokeError } = await db.functions.invoke("storage-guardian", {
      body: {
        action: "simulate",
        device_id: selected.id,
        ambient_temperature_c: sample.ambient,
        relative_humidity_pct: sample.humidity,
        grain_temperature_c: sample.grain,
      },
    });
    if (invokeError || data?.error) {
      setError(data?.error ?? invokeError?.message ?? "Simulation request failed.");
    } else {
      setNotice("Simulated sensor reading saved. This is test data, not a physical sensor measurement.");
      await refresh();
    }
    setBusy(false);
  }

  async function copyDeviceKey() {
    if (!newDeviceKey) return;
    await navigator.clipboard.writeText(newDeviceKey);
    setCopied(true);
  }

  return (
    <Localize>
      <main className="storage-page">
        <div className="storage-topline">
          <Link href="/workspace" className="storage-back">← Back to Krishi Connect 360</Link>
          <span className="storage-live-pill"><i /> HARDWARE ADD-ON / PILOT</span>
        </div>

        <header className="storage-hero">
          <div>
            <span className="kicker">KRISHI CONNECT 360 / STORAGE INTELLIGENCE</span>
            <h1>KRISHI <em>GUARD</em></h1>
            <p>Monitor the microclimate around stored grain. Spot rising humidity and unusual grain-core temperature patterns before storage conditions deteriorate further.</p>
            <div className="storage-hero-tags"><span>ESP32 sensor node</span><span>One API connection</span><span>Local alerts work offline</span></div>
          </div>
          <div className="storage-hero-art" aria-hidden="true">
            <div className="storage-art-ring" />
            <div className="storage-art-grain">KG</div>
            <span className="storage-art-label">STORAGE CONDITION MONITOR</span>
          </div>
        </header>

        {error && <div className="storage-alert error" role="alert">{error}</div>}
        {notice && <div className="storage-alert success" role="status">{notice}</div>}

        {!authReady ? (
          <div className="storage-panel">Checking your Krishi Connect session…</div>
        ) : !session ? (
          <section className="storage-panel storage-signin">
            <h2>Sign in to connect your storage device</h2>
            <p>Device ownership and readings are private to your Krishi Connect account.</p>
            <Link className="button button-primary" href="/login">Sign in to continue ↗</Link>
          </section>
        ) : (
          <>
            <section className="storage-overview">
              <div className="storage-panel storage-stat">
                <span>REGISTERED DEVICES</span><strong>{devices.length}</strong><small>Storage locations monitored</small>
              </div>
              <div className="storage-panel storage-stat">
                <span>LATEST CONDITION</span><strong className={`storage-level-text ${statusClass}`}>{latest?.condition_level ?? "NO DATA"}</strong><small>{latest ? `Condition index ${latest.condition_score}/100` : "Waiting for first reading"}</small>
              </div>
              <div className="storage-panel storage-stat">
                <span>GRAIN-CORE TEMPERATURE</span><strong>{latest ? `${Number(latest.grain_temperature_c).toFixed(1)}°C` : "—"}</strong><small>{latest ? fmt(latest.recorded_at) : "No readings yet"}</small>
              </div>
              <div className="storage-panel storage-stat">
                <span>AMBIENT RELATIVE HUMIDITY</span><strong>{latest ? `${Number(latest.relative_humidity_pct).toFixed(0)}%` : "—"}</strong><small>Air around the stored grain</small>
              </div>
            </section>

            <section className="storage-layout">
              <div className="storage-main-column">
                <section className="storage-panel">
                  <div className="storage-section-heading">
                    <div><span className="kicker">YOUR HARDWARE</span><h2>Registered storage devices</h2></div>
                    <button className="button button-quiet" type="button" onClick={() => void refresh()} disabled={loading}>{loading ? "Refreshing…" : "↻ Refresh"}</button>
                  </div>
                  {devices.length === 0 ? (
                    <div className="storage-empty"><strong>No storage device registered yet.</strong><p>Register the first KRISHI GUARD node. You can test it immediately using the built-in simulator.</p></div>
                  ) : (
                    <div className="storage-device-list">
                      {devices.map((device) => {
                        const deviceLatest = readings.find((reading) => reading.device_id === device.id);
                        return (
                          <button type="button" key={device.id} className={`storage-device-row ${selectedDevice === device.id ? "selected" : ""}`} onClick={() => setSelectedDevice(device.id)}>
                            <span className="storage-device-icon">KG</span>
                            <span className="storage-device-copy"><strong>{device.device_name}</strong><small>{device.device_code} · {device.crop_type.toUpperCase()} · {device.storage_type} · {device.location}</small><small>Last contact: {fmt(device.last_seen_at)}</small></span>
                            <span className={`storage-level-chip ${deviceLatest?.condition_level.toLowerCase() ?? "empty"}`}>{deviceLatest?.condition_level ?? "NO DATA"}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </section>

                <section className="storage-panel">
                  <div className="storage-section-heading">
                    <div><span className="kicker">CONDITION HISTORY</span><h2>{selected?.device_name ?? "Select a device"}</h2></div>
                    {selected && <span className="storage-device-code">{selected.device_code}</span>}
                  </div>
                  {latest ? (
                    <>
                      <div className={`storage-risk-banner ${latest.condition_level.toLowerCase()}`}>
                        <div><span>STORAGE CONDITION INDICATOR</span><strong>{latest.condition_level} · {latest.condition_score}/100</strong></div>
                        <p>This is a transparent prototype heuristic based on ambient humidity, grain-to-air temperature difference and recent temperature trend. It is not a spoilage probability or a direct grain-moisture measurement.</p>
                      </div>
                      <ul className="storage-reasons">{latest.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
                      <div className="storage-reading-grid">
                        <div><small>Ambient temperature</small><strong>{Number(latest.ambient_temperature_c).toFixed(1)}°C</strong></div>
                        <div><small>Ambient RH</small><strong>{Number(latest.relative_humidity_pct).toFixed(1)}%</strong></div>
                        <div><small>Grain core</small><strong>{Number(latest.grain_temperature_c).toFixed(1)}°C</strong></div>
                        <div><small>Core − ambient</small><strong>{Number(latest.temperature_delta_c).toFixed(1)}°C</strong></div>
                      </div>
                    </>
                  ) : (
                    <div className="storage-empty"><strong>No readings for this device.</strong><p>Use the simulator below or connect the physical ESP32 node.</p></div>
                  )}
                  <div className="storage-table-wrap">
                    <table className="storage-table">
                      <thead><tr><th>Recorded</th><th>Core</th><th>Ambient RH</th><th>Index</th><th>Source</th></tr></thead>
                      <tbody>
                        {selectedReadings.map((reading) => <tr key={reading.id}><td>{fmt(reading.recorded_at)}</td><td>{Number(reading.grain_temperature_c).toFixed(1)}°C</td><td>{Number(reading.relative_humidity_pct).toFixed(0)}%</td><td><span className={`storage-level-chip ${reading.condition_level.toLowerCase()}`}>{reading.condition_level} · {reading.condition_score}</span></td><td>{reading.source === "simulator" ? "SIM" : "DEVICE"}</td></tr>)}
                        {selectedReadings.length === 0 && <tr><td colSpan={5}>No readings recorded.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>

              <aside className="storage-side-column">
                <section className="storage-panel">
                  <span className="kicker">ADD A HARDWARE NODE</span>
                  <h2>Register a device</h2>
                  <p className="storage-muted">Create a device identity and generate a one-time API key for its ESP32.</p>
                  <form className="storage-form" onSubmit={registerDevice}>
                    <label>Device name<input value={deviceName} onChange={(event) => setDeviceName(event.target.value)} minLength={2} maxLength={80} required /></label>
                    <label>Stored crop<select value={cropType} onChange={(event) => setCropType(event.target.value)}><option value="paddy">Paddy / rice</option><option value="ragi">Ragi</option><option value="maize">Maize</option><option value="wheat">Wheat</option><option value="mixed">Mixed grain</option><option value="other">Other</option></select></label>
                    <label>Storage type<select value={storageType} onChange={(event) => setStorageType(event.target.value)}><option value="bag">Bag / sack</option><option value="bin">Small bin</option><option value="silo">Silo</option><option value="room">Storage room</option><option value="other">Other</option></select></label>
                    <label>Village / storage location<input value={location} onChange={(event) => setLocation(event.target.value)} minLength={2} maxLength={120} placeholder="Village, taluk, district" required /></label>
                    <button className="button button-primary" type="submit" disabled={busy || !db}>{busy ? "Registering…" : "Register storage device ↗"}</button>
                  </form>
                  {newDeviceKey && <div className="storage-key-box"><strong>Copy this device key now</strong><code>{newDeviceKey}</code><button className="button button-quiet" type="button" onClick={() => void copyDeviceKey()}>{copied ? "Copied" : "Copy device key"}</button><small>The database stores only its SHA-256 hash. If lost, revoke and generate a replacement.</small></div>}
                </section>

                <section className="storage-panel">
                  <span className="kicker">SOFTWARE TEST BENCH</span>
                  <h2>Sensor simulator</h2>
                  <p className="storage-muted">Send clearly labelled test readings through the same backend used by the physical device.</p>
                  <div className="storage-scenarios">
                    <button type="button" onClick={() => { setAmbientTemp(29); setHumidity(52); setGrainTemp(30); }}>Normal</button>
                    <button type="button" onClick={() => { setAmbientTemp(30); setHumidity(70); setGrainTemp(33); }}>Humid</button>
                    <button type="button" onClick={() => { setAmbientTemp(29); setHumidity(82); setGrainTemp(38); }}>Hotspot</button>
                  </div>
                  <label className="storage-slider">Ambient temperature <strong>{ambientTemp}°C</strong><input type="range" min="-10" max="60" value={ambientTemp} onChange={(event) => setAmbientTemp(Number(event.target.value))} /></label>
                  <label className="storage-slider">Ambient relative humidity <strong>{humidity}%</strong><input type="range" min="20" max="100" value={humidity} onChange={(event) => setHumidity(Number(event.target.value))} /></label>
                  <label className="storage-slider">Grain-core temperature <strong>{grainTemp}°C</strong><input type="range" min="-10" max="70" value={grainTemp} onChange={(event) => setGrainTemp(Number(event.target.value))} /></label>
                  <button className="button button-dark" type="button" onClick={() => void sendSimulation()} disabled={busy || !selected}>{busy ? "Sending…" : "Send simulated reading ↗"}</button>
                  <small className="storage-sim-note">SIMULATED DATA · Not a physical sensor measurement</small>
                </section>
              </aside>
            </section>
          </>
        )}

        <section className="storage-panel storage-howto">
          <span className="kicker">LOW-COST HARDWARE</span><h2>One small device. One secure connection.</h2>
          <div className="storage-howto-grid">
            <div><strong>01 · ESP32</strong><p>Reads the sensors and sends one HTTPS telemetry request.</p></div>
            <div><strong>02 · DHT22</strong><p>Measures ambient temperature and relative humidity near the grain store.</p></div>
            <div><strong>03 · DS18B20</strong><p>Measures temperature inside a grain bag or storage core using a protected probe.</p></div>
            <div><strong>04 · KRISHI CONNECT</strong><p>Stores readings, calculates the condition indicator and shows alerts in this workspace.</p></div>
          </div>
          <p className="storage-disclaimer">Storage condition indicators are advisory. They do not certify grain quality, diagnose fungal contamination, measure grain moisture or replace inspection and laboratory testing. Thresholds require local crop and storage validation.</p>
        </section>
      </main>
    </Localize>
  );
}
