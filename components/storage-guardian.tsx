"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase/client";
import { friendlyErrorMessage } from "@/lib/error-message";
import { AudioGuideButton, LanguageSwitch, Localize, useLanguage } from "@/components/language-provider";

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
  telemetry_context?: {
    rain_intensity_pct?: number;
    roof_leak_detected?: boolean;
    water_ingress_detected?: boolean;
    rodent_motion_events?: number;
    insect_trap_pulses?: number;
    pest_status?: string;
    scenario?: string;
    provenance?: string;
  };
  recorded_at: string;
};

const fmt = (value: string | null, locale: string) => value
  ? new Date(value).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" })
  : "No readings yet";

export function StorageGuardian() {
  const db = getSupabase();
  const { language } = useLanguage();
  const locale = language === "kn" ? "kn-IN" : "en-IN";
  const cropLabel = (value: string) => ({paddy:language==="kn"?"ಭತ್ತ":"Paddy / rice",ragi:language==="kn"?"ರಾಗಿ":"Ragi",maize:language==="kn"?"ಮೆಕ್ಕೆಜೋಳ":"Maize",wheat:language==="kn"?"ಗೋಧಿ":"Wheat",mixed:language==="kn"?"ಮಿಶ್ರ ಧಾನ್ಯ":"Mixed grain",other:language==="kn"?"ಇತರೆ":"Other"}[value]??value);
  const storageLabel = (value: string) => ({bag:language==="kn"?"ಚೀಲ":"Bag / sack",bin:language==="kn"?"ಸಣ್ಣ ಸಂಗ್ರಹ ಪೆಟ್ಟಿಗೆ":"Small bin",silo:language==="kn"?"ಸೈಲೋ":"Silo",room:language==="kn"?"ಸಂಗ್ರಹ ಕೊಠಡಿ":"Storage room",other:language==="kn"?"ಇತರೆ":"Other"}[value]??value);
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const [deviceName, setDeviceName] = useState("KRISHI GUARD · Wokwi demo");
  const [cropType, setCropType] = useState("paddy");
  const [storageType, setStorageType] = useState("bag");
  const [location, setLocation] = useState("");

  const [ambientTemp, setAmbientTemp] = useState(30);
  const [humidity, setHumidity] = useState(55);
  const [grainTemp, setGrainTemp] = useState(30);

  const refresh = useCallback(async (silent = false) => {
    if (!db || !session) return;
    if (!silent) setLoading(true);
    setError("");
    const { data: deviceRows, error: deviceError } = await db
      .from("storage_guardian_devices")
      .select("id,device_code,device_name,crop_type,storage_type,location,is_active,created_at,last_seen_at")
      .order("created_at", { ascending: false });
    if (deviceError) {
      setError(friendlyErrorMessage(deviceError, language, "Unable to load storage devices."));
      if (!silent) setLoading(false);
      return;
    }
    const rows = (deviceRows ?? []) as Device[];
    setDevices(rows);
    if (!selectedDevice && rows.length) setSelectedDevice(rows.find((row) => row.is_active)?.id ?? rows[0].id);
    if (!rows.length) {
      setReadings([]);
      if (!silent) setLoading(false);
      return;
    }
    const { data: readingRows, error: readingError } = await db
      .from("storage_guardian_readings")
      .select("id,device_id,ambient_temperature_c,relative_humidity_pct,grain_temperature_c,temperature_delta_c,condition_score,condition_level,reasons,battery_voltage,source,telemetry_context,recorded_at")
      .in("device_id", rows.map((row) => row.id))
      .order("recorded_at", { ascending: false })
      .limit(60);
    if (readingError) setError(friendlyErrorMessage(readingError, language, "Unable to load sensor history."));
    setReadings((readingRows ?? []) as Reading[]);
    setLoading(false);
  }, [db, session, selectedDevice, language]);

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
  useEffect(() => {
    if (!session) return;
    const timer = window.setInterval(() => { void refresh(true); }, 10000);
    return () => window.clearInterval(timer);
  }, [session, refresh]);

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
    const { data, error: invokeError } = await db.functions.invoke("storage-guardian", {
      body: {
        action: "register_simulator",
        device_name: deviceName,
        crop_type: cropType,
        storage_type: storageType,
        location,
      },
    });
    if (invokeError || data?.error) {
      setError(friendlyErrorMessage(data?.error ?? invokeError ?? "Wokwi demo node creation failed.", language, "Wokwi demo node creation failed."));
    } else {
      setSelectedDevice(String(data.device?.id ?? ""));
      setNotice("Wokwi demo node created. No physical ESP32 or device API key is required.");
      await refresh();
    }
    setBusy(false);
  }

  async function revokeDevice(device: Device) {
    if (!db) return;
    const confirmed = window.confirm(language === "kn"
      ? "ಈ Wokwi ಡೆಮೊ ನೋಡ್ ನಿಷ್ಕ್ರಿಯಗೊಳಿಸಬೇಕೇ? ಇದು ಹೊಸ ನೋಡ್ ರಚಿಸುವವರೆಗೆ ಸಿಮ್ಯುಲೇಟರ್ ಓದುಗಳನ್ನು ಸ್ವೀಕರಿಸುವುದಿಲ್ಲ."
      : "Deactivate this demo node? It will stop accepting simulator readings until you create another node.");
    if (!confirmed) return;
    setBusy(true); setError(""); setNotice("");
    const { data, error: invokeError } = await db.functions.invoke("storage-guardian", { body: { action: "revoke", device_id: device.id } });
    if (invokeError || data?.error) setError(friendlyErrorMessage(data?.error ?? invokeError ?? "Device revocation failed.", language, "Device revocation failed."));
    else {
      setNotice(language === "kn" ? "ಸಾಧನ ನಿಷ್ಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ ಮತ್ತು API ಕೀ ರದ್ದುಪಡಿಸಲಾಗಿದೆ." : "Demo node deactivated.");
      if (selectedDevice === device.id) setSelectedDevice(devices.find((row) => row.id !== device.id && row.is_active)?.id ?? "");
      await refresh();
    }
    setBusy(false);
  }

  async function sendSimulation(values?: { ambient: number; humidity: number; grain: number }) {
    if (!db || !selected) {
      setError("Create a Wokwi demo node before sending a simulated reading.");
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
      setError(friendlyErrorMessage(data?.error ?? invokeError ?? "Simulation request failed.", language, "Simulation request failed."));
    } else {
      setNotice("Simulated sensor reading saved. This is test data, not a physical sensor measurement.");
      await refresh();
    }
    setBusy(false);
  }

  return (
    <Localize>
      <main className="storage-page">
        <div className="storage-topline">
          <Link href="/workspace" className="storage-back">← Back to Krishi Connect 360</Link>
          <span className="storage-page-controls"><div className="storage-top-actions"><a href="https://wokwi.com/projects/481686932424365057" target="_blank" rel="noreferrer" className="storage-back">Open saved Wokwi baseline ↗</a><span className="storage-live-pill"><i /> WOKWI DIGITAL TWIN</span></div><LanguageSwitch/><AudioGuideButton guide="storage_guardian" compact/></span>
        </div>

        <header className="storage-hero">
          <div>
            <span className="kicker">KRISHI CONNECT 360 / STORAGE INTELLIGENCE</span>
            <h1>KRISHI <em>GUARD</em></h1>
            <p>Explore a Wokwi-powered grain-store digital twin. Change virtual sensor inputs, inspect the ESP32 alarm response and send clearly labelled simulation readings into your Storage Guardian dashboard.</p>
            <div className="storage-hero-tags"><span>Wokwi ESP32 simulation</span><span>Secure cloud bridge</span><span>Virtual sensor alerts</span></div>
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
            <h2>Sign in to create your Wokwi demo node</h2>
            <p>Your virtual demo nodes and simulated readings are private to your Krishi Connect account.</p>
            <Link className="button button-primary" href="/login">Sign in to continue ↗</Link>
          </section>
        ) : (
          <>
            <section className="storage-overview">
              <div className="storage-panel storage-stat">
                <span>SIMULATOR NODES</span><strong>{devices.length}</strong><small>Virtual storage locations</small>
              </div>
              <div className="storage-panel storage-stat">
                <span>LATEST CONDITION</span><strong className={`storage-level-text ${statusClass}`}>{latest?.condition_level ?? "NO DATA"}</strong><small>{latest ? `Condition index ${latest.condition_score}/100` : "Waiting for first reading"}</small>
              </div>
              <div className="storage-panel storage-stat">
                <span>GRAIN-CORE TEMPERATURE</span><strong>{latest ? `${Number(latest.grain_temperature_c).toFixed(1)}°C` : "—"}</strong><small>{latest ? fmt(latest.recorded_at,locale) : "No readings yet"}</small>
              </div>
              <div className="storage-panel storage-stat">
                <span>AMBIENT RELATIVE HUMIDITY</span><strong>{latest ? `${Number(latest.relative_humidity_pct).toFixed(0)}%` : "—"}</strong><small>Air around the stored grain</small>
              </div>
            </section>

            <section className="storage-layout">
              <div className="storage-main-column">
                <section className="storage-panel">
                  <div className="storage-section-heading">
                    <div><span className="kicker">YOUR WOKWI SIMULATORS</span><h2>Demo storage nodes</h2></div>
                    <button className="button button-quiet" type="button" onClick={() => void refresh()} disabled={loading}>{loading ? "Refreshing…" : "↻ Refresh"}</button>
                  </div>
                  {devices.length === 0 ? (
                    <div className="storage-empty"><strong>No Wokwi demo node yet.</strong><p>Create a virtual KRISHI GUARD node below. You can run scenarios and send readings to this dashboard immediately.</p></div>
                  ) : (
                    <div className="storage-device-list">
                      {devices.map((device) => {
                        const deviceLatest = readings.find((reading) => reading.device_id === device.id);
                        return (
                          <div key={device.id} className={`storage-device-row ${selectedDevice === device.id ? "selected" : ""}`}>
                            <button type="button" className="storage-device-select" onClick={() => setSelectedDevice(device.id)}>
                              <span className="storage-device-icon">KG</span>
                              <span className="storage-device-copy"><strong>{device.device_name}</strong><small>{device.device_code} · {cropLabel(device.crop_type)} · {storageLabel(device.storage_type)} · {device.location}</small><small>Last simulator reading: {fmt(device.last_seen_at,locale)}</small></span>
                              <span className={`storage-level-chip ${deviceLatest?.condition_level.toLowerCase() ?? "empty"}`}>{device.is_active ? (deviceLatest?.condition_level ?? "NO DATA") : (language === "kn" ? "ನಿಷ್ಕ್ರಿಯ" : "INACTIVE")}</span>
                            </button>
                            {device.is_active && <button type="button" className="button button-danger storage-revoke-button" onClick={() => void revokeDevice(device)} disabled={busy}>{language === "kn" ? "ನಿಷ್ಕ್ರಿಯಗೊಳಿಸಿ" : "Deactivate node"}</button>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                <section className="storage-panel">
                  <div className="storage-section-heading">
                    <div><span className="kicker">CONDITION HISTORY · AUTO-REFRESH 10S</span><h2>{selected?.device_name ?? "Select a device"}</h2></div>
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
                      {latest.telemetry_context && Object.keys(latest.telemetry_context).length > 0 && (
                        <div className="storage-reading-grid storage-event-context">
                          <div><small>Rain intensity</small><strong>{Number(latest.telemetry_context.rain_intensity_pct ?? 0)}%</strong></div>
                          <div><small>Roof ingress assumption</small><strong>{latest.telemetry_context.roof_leak_detected ? "ACTIVE" : "OFF"}</strong></div>
                          <div><small>Water contact input</small><strong>{latest.telemetry_context.water_ingress_detected === undefined ? (latest.source === "simulator" && latest.telemetry_context.roof_leak_detected ? "SIMULATED ACTIVE" : "NOT REPORTED") : (latest.telemetry_context.water_ingress_detected ? "ACTIVE" : "CLEAR")}</strong></div>
                          <div><small>Rodent motion events</small><strong>{Number(latest.telemetry_context.rodent_motion_events ?? 0)}</strong></div>
                          <div><small>Insect trap pulses</small><strong>{Number(latest.telemetry_context.insect_trap_pulses ?? 0)}</strong></div>
                          <div><small>Pest channel</small><strong>{latest.telemetry_context.pest_status ?? "CLEAR"}</strong></div>
                          <div><small>Scenario / provenance</small><strong>{latest.telemetry_context.scenario ?? latest.telemetry_context.provenance ?? "Device"}</strong></div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="storage-empty"><strong>No readings for this device.</strong><p>Use the Wokwi demo node and send a scenario from the simulator below.</p></div>
                  )}
                  <div className="storage-table-wrap">
                    <table className="storage-table">
                      <thead><tr><th>Recorded</th><th>Core</th><th>Ambient RH</th><th>Index</th><th>Source</th></tr></thead>
                      <tbody>
                        {selectedReadings.map((reading) => <tr key={reading.id}><td>{fmt(reading.recorded_at,locale)}</td><td>{Number(reading.grain_temperature_c).toFixed(1)}°C</td><td>{Number(reading.relative_humidity_pct).toFixed(0)}%</td><td><span className={`storage-level-chip ${reading.condition_level.toLowerCase()}`}>{reading.condition_level} · {reading.condition_score}</span></td><td>{reading.source === "simulator" ? "SIMULATOR" : "DEVICE"}</td></tr>)}
                        {selectedReadings.length === 0 && <tr><td colSpan={5}>No readings recorded.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>

              <aside className="storage-side-column">
                <section className="storage-panel">
                  <span className="kicker">SIMULATION DEVICE</span>
                  <h2>Create a Wokwi demo node</h2>
                  <p className="storage-muted">Create a virtual storage monitor identity for Wokwi and the browser simulator. No physical ESP32, Wi-Fi credentials or device API key is needed. Complete your participant profile first if prompted.</p>
                  <p className="storage-muted"><Link href="/workspace#operations">Open participant profile setup ↗</Link></p>
                  <form className="storage-form" onSubmit={registerDevice}>
                    <label>Device name<input value={deviceName} onChange={(event) => setDeviceName(event.target.value)} minLength={2} maxLength={80} required /></label>
                    <label>Stored crop<select value={cropType} onChange={(event) => setCropType(event.target.value)}><option value="paddy">Paddy / rice</option><option value="ragi">Ragi</option><option value="maize">Maize</option><option value="wheat">Wheat</option><option value="mixed">Mixed grain</option><option value="other">Other</option></select></label>
                    <label>Storage type<select value={storageType} onChange={(event) => setStorageType(event.target.value)}><option value="bag">Bag / sack</option><option value="bin">Small bin</option><option value="silo">Silo</option><option value="room">Storage room</option><option value="other">Other</option></select></label>
                    <label>Village / storage location<input value={location} onChange={(event) => setLocation(event.target.value)} minLength={2} maxLength={120} placeholder="Village, taluk, district" required /></label>
                    <button className="button button-primary" type="submit" disabled={busy || !db}>{busy ? "Creating demo node…" : "Create Wokwi demo node ↗"}</button>
                  </form>
                </section>

                <section className="storage-panel">
                  <span className="kicker">WOKWI / SOFTWARE TEST BENCH</span>
                  <h2>Send a simulated sensor reading</h2>
                  <p className="storage-muted">Use the quick scenarios here or open the ESP32 circuit in Wokwi. Every reading is stored as SIMULATOR data.</p>
                  <div className="storage-scenarios">
                    <button type="button" onClick={() => { setAmbientTemp(29); setHumidity(52); setGrainTemp(30); }}>Normal</button>
                    <button type="button" onClick={() => { setAmbientTemp(30); setHumidity(70); setGrainTemp(33); }}>Humid</button>
                    <button type="button" onClick={() => { setAmbientTemp(29); setHumidity(82); setGrainTemp(38); }}>Hotspot</button>
                  </div>
                  <label className="storage-slider">Ambient temperature <strong>{ambientTemp}°C</strong><input type="range" min="-10" max="60" value={ambientTemp} onChange={(event) => setAmbientTemp(Number(event.target.value))} /></label>
                  <label className="storage-slider">Ambient relative humidity <strong>{humidity}%</strong><input type="range" min="20" max="100" value={humidity} onChange={(event) => setHumidity(Number(event.target.value))} /></label>
                  <label className="storage-slider">Grain-core temperature <strong>{grainTemp}°C</strong><input type="range" min="-10" max="70" value={grainTemp} onChange={(event) => setGrainTemp(Number(event.target.value))} /></label>
                  <button className="button button-dark" type="button" onClick={() => void sendSimulation()} disabled={busy || !selected || !selected.is_active}>{busy ? "Sending…" : "Send simulated reading ↗"}</button>
                  <a className="button button-light" href="/krishi-guard-simulator">Open live rain & pest simulation ↗</a>
                  <small className="storage-sim-note">SIMULATED DATA · Not a physical sensor measurement</small>
                  <a className="button button-light" href="https://wokwi.com/projects/481686932424365057" target="_blank" rel="noreferrer">Open saved Wokwi baseline ↗</a>
                  <a className="button button-light" href="https://github.com/PSP-YN/Chakravyuha_Hackwarts/tree/feature/complete-platform/hardware/krishi-guard/wokwi-web" target="_blank" rel="noreferrer">View complete multi-sensor Wokwi source ↗</a>
                </section>
              </aside>
            </section>
          </>
        )}

        <section className="storage-panel storage-howto">
          <span className="kicker">DEMO ARCHITECTURE</span><h2>Wokwi circuit → simulator bridge → Storage Guardian</h2>
          <div className="storage-howto-grid">
            <div><strong>01 · WOKWI ESP32</strong><p>Runs the ESP32 firmware against virtual DHT22, DS18B20, rain, PIR, insect-beam and water-contact inputs.</p></div>
            <div><strong>02 · DHT22</strong><p>Measures ambient temperature and relative humidity near the grain store.</p></div>
            <div><strong>03 · DS18B20</strong><p>Measures temperature inside a grain bag or storage core using a protected probe.</p></div>
            <div><strong>04 · RAIN SENSOR</strong><p>Analogue wetness input estimates rain exposure at the sensor mounting point; it does not independently prove roof leakage.</p></div>
            <div><strong>05 · RODENT PIR</strong><p>Detects movement in a monitored storage perimeter. It is not an insect detector or a species classifier.</p></div>
            <div><strong>06 · INSECT BEAM</strong><p>An infrared break-beam counter records trap interruptions. It does not identify insect species.</p></div>
            <div><strong>07 · WATER CONTACT</strong><p>A separate contact switch reports water at its probe location. It is not inferred from rain intensity or the modelled roof-leak path.</p></div>
            <div><strong>08 · KRISHI CONNECT</strong><p>Receives the simulator reading through the authenticated Edge Function, calculates the condition indicator and displays SIMULATOR provenance, history and alerts.</p></div>
          </div>
          <p className="storage-disclaimer">Storage condition indicators are advisory. They do not certify grain quality, diagnose fungal contamination, measure grain moisture or replace inspection and laboratory testing. Thresholds require local crop and storage validation.</p>
        </section>
      </main>
    </Localize>
  );
}
