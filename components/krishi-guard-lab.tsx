"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase/client";
import { AudioGuideButton, LanguageSwitch, Localize } from "@/components/language-provider";
import { advanceStorageEnvironment, assessPestChannel, assessStorageScenario, buildEnvironmentalTelemetryContext, getStorageAlertOutputs } from "@/lib/krishi-simulation";

type Level = "NORMAL" | "WATCH" | "ACTION" | "URGENT";
type Device = { id: string; device_code: string; device_name: string; is_active: boolean };
type Sample = { at: string; air: number; rh: number; grain: number; rain: number; leak: boolean; waterContact: boolean; scenario: string; seconds: number; pestStatus: string; pest: number; score: number; level: Level; rodents: number; insects: number };
type PestEvent = { id: number; kind: "RODENT" | "INSECT"; at: string; note: string };

const scenarios = {
  clear: { label: "Clear weather", rain: 0, leak: false, rodent: false, insects: false },
  shower: { label: "Steady rain", rain: 48, leak: false, rodent: false, insects: false },
  roof: { label: "Heavy rain + roof leak", rain: 92, leak: true, rodent: false, insects: false },
  rodents: { label: "Rodent movement", rain: 0, leak: false, rodent: true, insects: false },
  insects: { label: "Insect trap activity", rain: 0, leak: false, rodent: false, insects: true },
  combined: { label: "Storm + pest activity", rain: 88, leak: true, rodent: true, insects: true },
} as const;

export function KrishiGuardLab() {
  const db = getSupabase();
  const [air, setAir] = useState(29), [rh, setRh] = useState(54), [grain, setGrain] = useState(29);
  const [rain, setRain] = useState(0), [leak, setLeak] = useState(false), [waterContact, setWaterContact] = useState(false), [rodent, setRodent] = useState(false);
  const [insects, setInsects] = useState(0), [rodentEvents, setRodentEvents] = useState(0);
  const [seconds, setSeconds] = useState(0), [running, setRunning] = useState(false);
  const [history, setHistory] = useState<Sample[]>([]), [events, setEvents] = useState<PestEvent[]>([]);
  const [devices, setDevices] = useState<Device[]>([]), [deviceId, setDeviceId] = useState("");
  const [cloudState, setCloudState] = useState("Checking sign-in…"), [cloudError, setCloudError] = useState("");
  const [cloudSent, setCloudSent] = useState(0), [syncEnabled, setSyncEnabled] = useState(false);
  const [scenarioName, setScenarioName] = useState("Live environment");
  const previousGrain = useRef<number | null>(null), lastCloudAt = useRef(0);
  const latest = useRef({ air, rh, grain, rain, leak, waterContact, insects, rodentEvents, scenarioName, pestLevel: "CLEAR" as string, seconds });
  const result = useMemo(() => assessStorageScenario(air, rh, grain, previousGrain.current), [air, rh, grain, seconds]);
  const pestLevel = assessPestChannel(rodentEvents, insects, rodent);
  latest.current = { air, rh, grain, rain, leak, waterContact, insects, rodentEvents, scenarioName, pestLevel, seconds };
  const storageClass = result.level.toLowerCase();
  const alertOutputs = getStorageAlertOutputs(result.level, pestLevel, waterContact);
  const rainLabel = rain >= 70 ? "HEAVY" : rain >= 25 ? "MODERATE" : rain > 0 ? "LIGHT" : "DRY";

  const loadDevices = useCallback(async () => {
    if (!db) { setCloudState("Supabase is not configured in this build"); return; }
    const { data: auth } = await db.auth.getSession();
    if (!auth.session) { setCloudState("Sign in to connect cloud telemetry"); return; }
    const { data, error } = await db.from("storage_guardian_devices").select("id,device_code,device_name,is_active").eq("is_active", true).order("created_at", { ascending: false });
    if (error) { setCloudState("Could not load registered devices"); setCloudError(error.message); return; }
    const list = (data ?? []) as Device[]; setDevices(list);
    if (list.length) { setDeviceId((old) => old && list.some((d) => d.id === old) ? old : list[0].id); setCloudState("Registered device available"); }
    else setCloudState("No registered device. Register one in Storage Guardian.");
  }, [db]);
  useEffect(() => { void loadDevices(); }, [loadDevices]);

  const addEvent = (kind: "RODENT" | "INSECT", note: string) => {
    setEvents((old) => [{ id: Date.now() + Math.random(), kind, at: new Date().toLocaleTimeString("en-IN"), note }, ...old].slice(0, 30));
    if (kind === "RODENT") setRodentEvents((n) => n + 1); else setInsects((n) => n + 1);
  };
  const applyScenario = (key: keyof typeof scenarios) => {
    const s = scenarios[key]; setScenarioName(s.label); setRain(s.rain); setLeak(s.leak); setRodent(s.rodent);
    if (s.insects) addEvent("INSECT", "Trap beam interrupted — insect entry event");
    if (s.rodent) addEvent("RODENT", "PIR motion event in the storage perimeter");
    if (!s.rodent && !s.insects) { setInsects(0); setRodentEvents(0); }
    if (key === "clear") { setAir(29); setRh(54); setGrain(29); }
  };
  const sendCloud = useCallback(async (sample: Sample) => {
    if (!db || !deviceId) return;
    const { data, error } = await db.functions.invoke("storage-guardian", { body: {
      action: "simulate", device_id: deviceId,
      ambient_temperature_c: Number(sample.air.toFixed(2)), relative_humidity_pct: Number(sample.rh.toFixed(2)), grain_temperature_c: Number(sample.grain.toFixed(2)),
      environmental_context: buildEnvironmentalTelemetryContext({ rain: sample.rain, roofLeak: sample.leak, waterContact: sample.waterContact, rodentEvents: sample.rodents, insectPulses: sample.insects, pestStatus: sample.pestStatus, seconds: sample.seconds, scenario: sample.scenario })
    }});
    if (error || data?.error) { setCloudError(String(data?.error ?? error?.message ?? "Cloud sync failed")); return; }
    setCloudSent((n) => n + 1); setCloudError("");
  }, [db, deviceId]);
  const capture = useCallback((sync = false) => {
    const a = assessStorageScenario(air, rh, grain, previousGrain.current);
    const sample: Sample = { at: new Date().toLocaleTimeString("en-IN"), air, rh, grain, rain, leak, waterContact, scenario: scenarioName, seconds, pestStatus: pestLevel, pest: insects + rodentEvents, score: a.score, level: a.level, rodents: rodentEvents, insects };
    setHistory((old) => [sample, ...old].slice(0, 80)); previousGrain.current = grain;
    if (sync) void sendCloud(sample);
  }, [air, rh, grain, rain, leak, waterContact, scenarioName, seconds, pestLevel, insects, rodentEvents, sendCloud]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      const current = latest.current;
      setSeconds((s) => s + 1);
      const next = advanceStorageEnvironment({ air: current.air, humidity: current.rh, grain: current.grain, rain: current.rain, roofLeak: current.leak });
      setAir(next.air);
      setRh(next.humidity);
      setGrain(next.grain);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      const current = latest.current;
      const a = assessStorageScenario(current.air, current.rh, current.grain, previousGrain.current);
      const sample: Sample = {
        at: new Date().toLocaleTimeString("en-IN"), air: current.air, rh: current.rh,
        grain: current.grain, rain: current.rain, leak: current.leak, waterContact: current.waterContact,
        scenario: current.scenarioName, seconds: current.seconds,
        pestStatus: current.pestLevel, pest: current.insects + current.rodentEvents,
        score: a.score, level: a.level, rodents: current.rodentEvents, insects: current.insects
      };
      setHistory((old) => [sample, ...old].slice(0, 80));
      previousGrain.current = current.grain;
      if (syncEnabled && deviceId && Date.now() - lastCloudAt.current >= 6000) {
        lastCloudAt.current = Date.now();
        void sendCloud(sample);
      }
    }, 3000);
    return () => window.clearInterval(timer);
  }, [running, syncEnabled, deviceId, sendCloud]);
  const reset = () => { setRunning(false); setSeconds(0); setAir(29); setRh(54); setGrain(29); setRain(0); setLeak(false); setWaterContact(false); setRodent(false); setInsects(0); setRodentEvents(0); setHistory([]); setEvents([]); previousGrain.current = null; setScenarioName("Live environment"); };
  const cloudLabel = syncEnabled && deviceId ? "CLOUD SYNC ON" : "LOCAL SIMULATION";

  return <Localize><main className="kg-lab kg-lab-v2">
    <nav className="kg-nav"><Link href="/">← Krishi Connect 360</Link><div className="kg-nav-actions"><Link className="kg-dashboard-link" href="/workspace/storage-guardian">Storage dashboard ↗</Link><LanguageSwitch/><AudioGuideButton guide="storage_guardian" compact/><span><i/> EVENT-DRIVEN FIELD LAB</span></div></nav>
    <header className="kg-hero kg-hero-v2"><div><p className="kg-eyebrow">KRISHI CONNECT 360 / STORAGE INTELLIGENCE</p><h1>KRISHI <em>GUARD</em></h1><p>Interactive grain-store digital twin. Trigger weather and pest events, watch environmental conditions evolve, inspect sensor inputs and see the alarm logic respond. Scenario data is synthetic; a connected registered device can receive the same simulated readings.</p><div className="kg-tags"><span>ESP32 SENSOR NODE</span><span>RAIN + LEAK MODEL</span><span>RODENT PIR</span><span>INSECT TRAP PULSE</span></div></div><div className="kg-chip kg-chip-v2"><div className="kg-chip-core">KG</div><span>{running ? "SIMULATION RUNNING" : "SIMULATION PAUSED"}</span><small>{cloudLabel} · {seconds}s elapsed</small></div></header>
    <section className="kg-status-row">
      <article className="kg-stat"><small>STORAGE CONDITION</small><strong className={storageClass}>{result.level}</strong><span>Heuristic condition indicator</span></article>
      <article className="kg-stat"><small>CONDITION INDEX</small><strong>{result.score}<i>/100</i></strong><span>Air RH + grain/air delta + trend</span></article>
      <article className="kg-stat"><small>PEST ACTIVITY</small><strong className={pestLevel.toLowerCase()}>{pestLevel}</strong><span>{rodentEvents} rodent events · {insects} insect pulses</span></article>
      <article className="kg-stat"><small>RAIN AT ROOF</small><strong>{rain}%</strong><span>{rainLabel} · leak {leak ? "OPEN" : "SEALED"}</span></article>
    </section>
    <section className="kg-event-toolbar kg-panel"><div><p className="kg-eyebrow">DEMO SCENARIOS</p><h2>Trigger a real-time event</h2><span>Events alter the simulated environment; readings are not random samples.</span></div><div className="kg-scenario-buttons">
      <button onClick={() => applyScenario("clear")}>Clear day</button><button onClick={() => applyScenario("shower")}>Rain shower</button><button onClick={() => applyScenario("roof")}>Heavy rain + leak</button><button onClick={() => applyScenario("rodents")}>Rodent movement</button><button onClick={() => applyScenario("insects")}>Insect trap</button><button onClick={() => setWaterContact(true)}>Water-contact probe</button><button onClick={() => applyScenario("combined")}>Combined stress test</button>
    </div><div className="kg-run-controls"><button className="kg-primary" onClick={() => setRunning((v) => !v)}>{running ? "Pause simulation" : "Start live simulation"}</button><button className="kg-secondary" onClick={() => capture(false)}>Capture reading</button><button className="kg-secondary" onClick={reset}>Reset</button><span>{scenarioName} · {seconds}s</span></div></section>
    <section className="kg-visual-grid">
      <article className={"kg-panel kg-store-scene " + (rain > 0 ? "is-raining" : "")}><div className="kg-heading"><div><p className="kg-eyebrow">LIVE STORAGE VISUAL</p><h2>Grain store · environmental view</h2></div><span className="kg-state">{rainLabel} RAIN</span></div>
        <div className="kg-weather-sky"><div className="kg-cloud"><i/><i/><i/></div><div className="kg-sun"/><div className="kg-rain-layer">{Array.from({length:28},(_,i)=><i key={i} style={{left:(((i*37)%100)+"%"),animationDelay:(((i%7)*-.23)+"s"),animationDuration:((.55+(i%5)*.12)+"s")}}/>)}</div><div className="kg-weather-caption"><b>{rainLabel} RAIN</b><span>Rain sensor · ADC model {Math.round(4095-rain*40.95)}</span></div></div>
        <div className="kg-warehouse"><div className={"kg-roof " + (leak && rain>0 ? "leaking" : "")}><span>ROOF / {leak ? "LEAK PATH OPEN" : "SEALED"}</span>{leak && rain>0 ? <i className="kg-drip"/> : null}</div><div className="kg-store-interior"><div className="kg-store-label">STORAGE BAY A · PADDY</div><div className="kg-grain-sacks"><i/><i/><i/><i/></div><div className="kg-store-sensors"><span className="kg-sensor-dot">DHT22</span><span className="kg-sensor-dot">DS18B20</span></div>{leak && rain>20 ? <div className="kg-water-pool" style={{height:Math.min(48,8+rh*.38)+"px"}}/> : null}{rodent ? <div className="kg-pest-rodent" title="PIR movement event">🐀<small>MOTION</small></div> : null}{insects>0 ? <div className="kg-pest-insects" title="Insect trap pulses">✳ ✳<small>TRAP {insects}</small></div> : null}<div className="kg-floor"/></div></div>
        <div className="kg-scene-legend"><span><i className="rain"/> Rainfall</span><span><i className="water"/> Moisture ingress model</span><span><i className="pest"/> Pest event</span></div><p className="kg-disclaimer">Explanatory simulation. A rain plate detects wetness at its mounting point; it does not prove roof leakage. Roof ingress is a separately controlled scenario assumption.</p>
      </article>
      <article className="kg-panel kg-controls-panel"><div className="kg-heading"><div><p className="kg-eyebrow">ENVIRONMENT CONTROLS</p><h2>Change field conditions</h2></div><span className="kg-live"><i/> LIVE MODEL</span></div>
        <label className="kg-control"><span><b>Rain sensor intensity</b><strong>{rain}%</strong></span><input type="range" min="0" max="100" value={rain} onChange={(e)=>setRain(Number(e.target.value))}/><small>0% dry · 100% heavy wetting (simulated)</small></label>
        <label className="kg-toggle"><input type="checkbox" checked={leak} onChange={(e)=>setLeak(e.target.checked)}/><span><b>Roof ingress path</b><small>Allow rain exposure to raise indoor humidity gradually</small></span></label>
        <div className="kg-pest-controls"><div><b>Physical water-contact probe (GPIO 25)</b><span>{waterContact ? "WATER CONTACT ACTIVE" : "DRY / OPEN"}</span></div><button onClick={() => setWaterContact(true)}>Trigger contact</button><button onClick={() => setWaterContact(false)}>Clear</button></div>
        <div className="kg-pest-controls"><div><b>Rodent perimeter PIR</b><span>{rodent ? "MOTION ACTIVE" : "NO MOTION"}</span></div><button onClick={()=>{setRodent(true);addEvent("RODENT","PIR motion event in storage perimeter");}}>Trigger motion</button><button onClick={()=>setRodent(false)}>Clear</button></div>
        <div className="kg-pest-controls"><div><b>Insect trap beam</b><span>{insects} interruption pulses</span></div><button onClick={()=>addEvent("INSECT","IR beam-break pulse — insect trap entry")}>Trigger trap pulse</button><button onClick={()=>setInsects(0)}>Reset count</button></div>
        <div className="kg-sensor-values"><div><small>AMBIENT AIR</small><b>{air.toFixed(1)}°C</b></div><div><small>RELATIVE HUMIDITY</small><b>{rh.toFixed(1)}%</b></div><div><small>GRAIN CORE</small><b>{grain.toFixed(1)}°C</b></div></div><p className="kg-disclaimer">PIR is a movement channel, not a species classifier. The insect input models an IR break-beam trap counter. Neither channel identifies a pest species.</p>
      </article>
    </section>
    <section className="kg-live-grid">
      <article className="kg-panel"><div className="kg-heading"><div><p className="kg-eyebrow">FIRMWARE OUTPUT MODEL</p><h2>ESP32 response</h2></div><span className={"kg-state "+storageClass}>{result.level}</span></div>
        <div className="kg-hardware-board"><div className="kg-mcu"><b>ESP32</b><small>GPIO INPUT / DECISION</small></div><div className="kg-wire-list"><span>GPIO 34 · Rain ADC <b>{rain}%</b></span><span>GPIO 27 · PIR <b>{rodent?"HIGH":"LOW"}</b></span><span>GPIO 26 · IR beam <b>{insects} pulses</b></span><span>GPIO 25 · Water contact <b>{waterContact ? "ACTIVE" : "CLEAR"}</b></span><span>GPIO 15 · DHT22 <b>{air.toFixed(1)}° / {rh.toFixed(0)}%</b></span><span>GPIO 4 · DS18B20 <b>{grain.toFixed(1)}°C</b></span></div><div className="kg-output-leds"><div><i className={alertOutputs.led?"on":"off"}/><b>ALERT LED</b><small>{alertOutputs.led?"ON":"OFF"}</small></div><div><i className={alertOutputs.buzzer!=="SILENT"?"buzzer-on":"off"}/><b>BUZZER</b><small>{alertOutputs.buzzer}</small></div></div></div>
        <div className="kg-meter"><div><span>Storage condition index</span><b>{result.score}/100</b></div><div className="kg-meter-track"><i style={{width:result.score+"%"}}/></div></div><ul className="kg-reasons">{result.reasons.map((x)=><li key={x}>{x}</li>)}</ul><div className="kg-pest-separate"><b>Pest alert channel: {pestLevel}</b><span>Water-contact input: {waterContact ? "ACTIVE" : "CLEAR"}. Pest and water alerts are independent of the grain-condition score.</span></div>
      </article>
      <article className="kg-panel"><div className="kg-heading"><div><p className="kg-eyebrow">EVENT JOURNAL</p><h2>Detected activity</h2></div><span>{events.length} events</span></div><div className="kg-event-list">{events.slice(0,10).map((e)=><div key={e.id}><i className={e.kind.toLowerCase()}/><span><b>{e.kind==="RODENT"?"Rodent movement":"Insect trap pulse"}</b><small>{e.note}</small></span><time>{e.at}</time></div>)}{!events.length?<p className="kg-empty">No pest events. Trigger a PIR motion or insect trap pulse to test detection.</p>:null}</div></article>
    </section>
    <section className="kg-panel kg-cloud-panel"><div className="kg-heading"><div><p className="kg-eyebrow">APPLICATION INTEGRATION</p><h2>Send the same scenario to KRISHI CONNECT 360</h2></div><span className="kg-state">{cloudState}</span></div>
      <div className="kg-cloud-row"><label>Registered storage device<select value={deviceId} onChange={(e)=>setDeviceId(e.target.value)}><option value="">Select device</option>{devices.map((d)=><option key={d.id} value={d.id}>{d.device_name} · {d.device_code}</option>)}</select></label><button className="kg-secondary" onClick={()=>void loadDevices()}>Refresh devices</button><label className="kg-sync-toggle"><input type="checkbox" checked={syncEnabled} onChange={(e)=>setSyncEnabled(e.target.checked)} disabled={!deviceId}/> Enable cloud sync</label><span>{cloudSent} cloud readings accepted</span></div>
      {cloudError?<p className="kg-cloud-error">{cloudError}</p>:null}{!devices.length?<p className="kg-disclaimer">Register a device first under <Link href="/workspace/storage-guardian">Workspace → Storage Guardian</Link>. Cloud sync requires a signed-in account and an active registered device. Local simulation works without login.</p>:<p className="kg-disclaimer">When enabled, one simulated reading is sent every six seconds to the authenticated Storage Guardian endpoint. Each record is labelled SIMULATOR and includes rain/pest metadata; it is not physical sensor telemetry.</p>}
    </section>
    <section className="kg-panel kg-history"><div className="kg-heading"><div><p className="kg-eyebrow">TIME SERIES</p><h2>Environmental response over time</h2></div><span>{history.length} samples · {seconds}s</span></div>
      <div className="kg-trend-chart"><div className="kg-chart-labels"><span>RH {rh.toFixed(1)}%</span><span>Grain {grain.toFixed(1)}°C</span><span>Rain {rain}%</span></div><svg viewBox="0 0 720 180" role="img" aria-label="Recent environmental readings"><polyline points={history.slice(0,24).reverse().map((s,i)=>(i*30)+","+(165-(s.rh-35)*2.0)).join(" ")} fill="none" stroke="#4c986d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><polyline points={history.slice(0,24).reverse().map((s,i)=>(i*30)+","+(165-(s.grain-18)*3.2)).join(" ")} fill="none" stroke="#d19a3e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg><div className="kg-chart-legend"><span>Humidity</span><span>Grain-core temperature</span></div></div>
      <div className="kg-table-wrap"><table><thead><tr><th>Time</th><th>Air</th><th>RH</th><th>Grain</th><th>Rain</th><th>Pest events</th><th>Condition</th></tr></thead><tbody>{history.slice(0,15).map((s,i)=><tr key={i}><td>{s.at}</td><td>{s.air.toFixed(1)}°C</td><td>{s.rh.toFixed(1)}%</td><td>{s.grain.toFixed(1)}°C</td><td>{s.rain}%</td><td>{s.pest}</td><td><span className={"kg-state "+s.level.toLowerCase()}>{s.level}</span></td></tr>)}{!history.length?<tr><td colSpan={7} className="kg-empty">Start the simulation to generate a time series from changing environmental conditions.</td></tr>:null}</tbody></table></div>
    </section>
    <footer className="kg-footer">KRISHI GUARD · EVENT-DRIVEN PROTOTYPE · SYNTHETIC WEATHER / PEST SCENARIOS · PEST DETECTION DOES NOT IDENTIFY SPECIES · CONDITION THRESHOLDS REQUIRE FIELD VALIDATION</footer>
  </main></Localize>;
}
