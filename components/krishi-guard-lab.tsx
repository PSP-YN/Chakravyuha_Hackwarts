"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase/client";
import { KrishiWokwiSimulator } from "@/components/krishi-wokwi-simulator";
import { AudioGuideButton, LanguageSwitch, Localize } from "@/components/language-provider";
import { advanceStorageEnvironment, assessPestChannel, assessStorageScenario, buildEnvironmentalTelemetryContext, getStorageAlertOutputs, parseWokwiSerialOutput } from "@/lib/krishi-simulation";

type Level = "NORMAL" | "WATCH" | "ACTION" | "URGENT";
type Device = { id: string; device_code: string; device_name: string; is_active: boolean };
type Sample = { at: string; air: number; rh: number; grain: number; rain: number; leak: boolean; waterContact: boolean; sensorFault: boolean; scenario: string; seconds: number; pestStatus: string; pest: number; score: number; level: Level; rodents: number; insects: number };
type PestEvent = { id: number; kind: "RODENT" | "INSECT"; at: string; note: string };

const scenarios = {
  clear: { label: "Clear weather", air: 29, rh: 54, grain: 29, rain: 0, leak: false, waterContact: false, rodent: false, rodentEvents: 0, insects: 0 },
  shower: { label: "Steady rain", air: 29, rh: 70, grain: 31, rain: 48, leak: false, waterContact: false, rodent: false, rodentEvents: 0, insects: 0 },
  roof: { label: "Heavy rain + roof leak", air: 28, rh: 82, grain: 35, rain: 92, leak: true, waterContact: false, rodent: false, rodentEvents: 0, insects: 0 },
  rodents: { label: "Rodent movement", air: 29, rh: 54, grain: 29, rain: 0, leak: false, waterContact: false, rodent: true, rodentEvents: 1, insects: 0 },
  insects: { label: "Insect trap activity", air: 29, rh: 54, grain: 29, rain: 0, leak: false, waterContact: false, rodent: false, rodentEvents: 0, insects: 3 },
  combined: { label: "Storm + pest activity", air: 28, rh: 88, grain: 38, rain: 88, leak: true, waterContact: true, rodent: true, rodentEvents: 1, insects: 3 },
} as const;

export function KrishiGuardLab() {
  const db = getSupabase();
  const [air, setAir] = useState(29), [rh, setRh] = useState(54), [grain, setGrain] = useState(29);
  const [rain, setRain] = useState(0), [leak, setLeak] = useState(false), [waterContact, setWaterContact] = useState(false), [rodent, setRodent] = useState(false), [dhtFault, setDhtFault] = useState(false), [grainFault, setGrainFault] = useState(false);
  const [insects, setInsects] = useState(0), [rodentEvents, setRodentEvents] = useState(0);
  const [seconds, setSeconds] = useState(0), [running, setRunning] = useState(false);
  const [history, setHistory] = useState<Sample[]>([]), [events, setEvents] = useState<PestEvent[]>([]);
  const [devices, setDevices] = useState<Device[]>([]), [deviceId, setDeviceId] = useState("");
  const [cloudState, setCloudState] = useState("Checking sign-in…"), [cloudError, setCloudError] = useState("");
  const [cloudSent, setCloudSent] = useState(0), [syncEnabled, setSyncEnabled] = useState(false);
  const [scenarioName, setScenarioName] = useState("Live environment");
  const [wokwiPayload, setWokwiPayload] = useState("");
  const [wokwiStatus, setWokwiStatus] = useState("");
  const previousGrain = useRef<number | null>(null), lastCloudAt = useRef(0);
  const sensorFault = dhtFault || grainFault;
  const latest = useRef({ air, rh, grain, rain, leak, waterContact, sensorFault, insects, rodentEvents, scenarioName, pestLevel: "CLEAR" as string, seconds });
  const result = useMemo(() => assessStorageScenario(air, rh, grain, previousGrain.current), [air, rh, grain, seconds]);
  const pestLevel = assessPestChannel(rodentEvents, insects, rodent);
  latest.current = { air, rh, grain, rain, leak, waterContact, sensorFault, insects, rodentEvents, scenarioName, pestLevel, seconds };
  const storageClass = result.level.toLowerCase();
  const alertOutputs = getStorageAlertOutputs(sensorFault ? "NORMAL" : result.level, pestLevel, waterContact, sensorFault, rain >= 25);
  const rainAdc = Math.round(4095 * (1 - rain / 100));
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
  useEffect(() => {
    void loadDevices();
    if (!db) return;
    const { data } = db.auth.onAuthStateChange((_event, session) => {
      if (!session) { setDevices([]); setDeviceId(""); setCloudState("Sign in to connect cloud telemetry"); }
      else void loadDevices();
    });
    return () => data.subscription.unsubscribe();
  }, [db, loadDevices]);

  const addEvent = (kind: "RODENT" | "INSECT", note: string) => {
    setEvents((old) => [{ id: Date.now() + Math.random(), kind, at: new Date().toLocaleTimeString("en-IN"), note }, ...old].slice(0, 30));
    if (kind === "RODENT") setRodentEvents((n) => n + 1); else setInsects((n) => n + 1);
  };
  const applyScenario = (key: keyof typeof scenarios) => {
    const scenario = scenarios[key];
    setRunning(false);
    setScenarioName(scenario.label);
    setAir(scenario.air); setRh(scenario.rh); setGrain(scenario.grain);
    setRain(scenario.rain); setLeak(scenario.leak); setWaterContact(scenario.waterContact);
    setRodent(scenario.rodent); setRodentEvents(scenario.rodentEvents); setInsects(scenario.insects);
    setDhtFault(false); setGrainFault(false);
    previousGrain.current = null;
    const at = new Date().toLocaleTimeString("en-IN");
    const nextEvents: PestEvent[] = [
      ...Array.from({ length: scenario.rodentEvents }, (_, index) => ({ id: Date.now() + index, kind: "RODENT" as const, at, note: "PIR movement event in the storage perimeter" })),
      ...Array.from({ length: scenario.insects }, (_, index) => ({ id: Date.now() + 100 + index, kind: "INSECT" as const, at, note: "IR break-beam interruption pulse" })),
    ];
    setEvents(nextEvents.slice(0, 30));
    setWokwiStatus("");
  };
  const sendCloud = useCallback(async (sample: Sample): Promise<boolean> => {
    if (!db || !deviceId) {
      setCloudError("Sign in and create a Wokwi demo node in Storage Guardian before sending readings.");
      return false;
    }
    const { data, error } = await db.functions.invoke("storage-guardian", { body: {
      action: "simulate", device_id: deviceId,
      ambient_temperature_c: Number(sample.air.toFixed(2)), relative_humidity_pct: Number(sample.rh.toFixed(2)), grain_temperature_c: Number(sample.grain.toFixed(2)),
      environmental_context: buildEnvironmentalTelemetryContext({ rain: sample.rain, roofLeak: sample.leak, waterContact: sample.waterContact, rodentEvents: sample.rodents, insectPulses: sample.insects, pestStatus: sample.pestStatus, seconds: sample.seconds, scenario: sample.scenario })
    }});
    if (error || data?.error) { setCloudError(String(data?.error ?? error?.message ?? "Cloud sync failed")); return false; }
    setCloudSent((n) => n + 1); setCloudError("");
    setCloudState("Latest simulated reading accepted");
    return true;
  }, [db, deviceId]);
  const capture = useCallback((sync = false) => {
    const a = assessStorageScenario(air, rh, grain, previousGrain.current);
    const sample: Sample = { at: new Date().toLocaleTimeString("en-IN"), air, rh, grain, rain, leak, waterContact, sensorFault, scenario: scenarioName, seconds, pestStatus: pestLevel, pest: insects + rodentEvents, score: a.score, level: a.level, rodents: rodentEvents, insects };
    setHistory((old) => [sample, ...old].slice(0, 80)); previousGrain.current = grain;
    if (sync && !sensorFault) void sendCloud(sample);
    else if (sync && sensorFault) setCloudError("Cloud sync paused: climate sensor fault is active; invalid climate readings are not uploaded.");
  }, [air, rh, grain, rain, leak, waterContact, sensorFault, scenarioName, seconds, pestLevel, insects, rodentEvents, sendCloud]);

  async function runScenarioToDashboard(key: keyof typeof scenarios) {
    const scenario = scenarios[key];
    applyScenario(key);
    const pest = assessPestChannel(scenario.rodentEvents, scenario.insects, scenario.rodent);
    const assessment = assessStorageScenario(scenario.air, scenario.rh, scenario.grain, null);
    const sample: Sample = {
      at: new Date().toLocaleTimeString("en-IN"),
      air: scenario.air, rh: scenario.rh, grain: scenario.grain,
      rain: scenario.rain, leak: scenario.leak, waterContact: scenario.waterContact,
      sensorFault: false, scenario: scenario.label, seconds,
      pestStatus: pest, pest: scenario.rodentEvents + scenario.insects,
      score: assessment.score, level: assessment.level,
      rodents: scenario.rodentEvents, insects: scenario.insects,
    };
    setHistory((old) => [sample, ...old].slice(0, 80));
    if (!deviceId) {
      setWokwiStatus("Combined demo ran locally. Create a Wokwi demo node in Storage Guardian to save it to the dashboard.");
      return;
    }
    const accepted = await sendCloud(sample);
    setWokwiStatus(accepted ? "Combined demo scenario saved to Storage Guardian as SIMULATOR data." : "Scenario ran, but dashboard delivery failed. Review the cloud error.");
  }

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
        grain: current.grain, rain: current.rain, leak: current.leak, waterContact: current.waterContact, sensorFault: current.sensorFault,
        scenario: current.scenarioName, seconds: current.seconds,
        pestStatus: current.pestLevel, pest: current.insects + current.rodentEvents,
        score: a.score, level: a.level, rodents: current.rodentEvents, insects: current.insects
      };
      setHistory((old) => [sample, ...old].slice(0, 80));
      previousGrain.current = current.grain;
      if (syncEnabled && deviceId && !current.sensorFault && Date.now() - lastCloudAt.current >= 6000) {
        lastCloudAt.current = Date.now();
        void sendCloud(sample);
      }
    }, 3000);
    return () => window.clearInterval(timer);
  }, [running, syncEnabled, deviceId, sendCloud]);
  const reset = () => { setRunning(false); setSeconds(0); setAir(29); setRh(54); setGrain(29); setRain(0); setLeak(false); setWaterContact(false); setRodent(false); setDhtFault(false); setGrainFault(false); setInsects(0); setRodentEvents(0); setHistory([]); setEvents([]); previousGrain.current = null; setScenarioName("Live environment"); };
  const cloudLabel = syncEnabled && deviceId ? (sensorFault ? "CLOUD SYNC PAUSED · SENSOR FAULT" : "CLOUD SYNC ON") : "LOCAL SIMULATION";

  async function importWokwiSerialOutput() {
    setWokwiStatus("");
    setCloudError("");
    try {
      const imported = parseWokwiSerialOutput(wokwiPayload);
      const importedAir = imported.ambientTemperatureC;
      const importedRh = imported.relativeHumidityPct;
      const importedGrain = imported.grainTemperatureC;
      const importedRain = imported.rainIntensityPct;
      const importedRodents = imported.rodentMotionEvents;
      const importedInsects = imported.insectTrapPulses;
      const water = imported.waterIngressDetected;
      const pest = assessPestChannel(importedRodents, importedInsects, importedRodents > 0);
      const assessment = assessStorageScenario(importedAir, importedRh, importedGrain, previousGrain.current);
      const sample: Sample = {
        at: new Date().toLocaleTimeString("en-IN"), air: importedAir, rh: importedRh, grain: importedGrain,
        rain: importedRain, leak: false, waterContact: water, sensorFault: false,
        scenario: "Wokwi serial monitor import", seconds, pestStatus: pest,
        pest: importedRodents + importedInsects, score: assessment.score, level: assessment.level,
        rodents: importedRodents, insects: importedInsects,
      };
      setAir(importedAir); setRh(importedRh); setGrain(importedGrain); setRain(importedRain);
      setWaterContact(water); setRodentEvents(importedRodents); setRodent(importedRodents > 0); setInsects(importedInsects);
      setScenarioName(sample.scenario); setDhtFault(false); setGrainFault(false); setEvents([]);
      previousGrain.current = importedGrain;
      setHistory((old) => [sample, ...old].slice(0, 80));
      if (!deviceId) {
        setWokwiStatus("Wokwi reading parsed locally. Select a demo node to send it to the dashboard.");
        return;
      }
      const accepted = await sendCloud(sample);
      setWokwiStatus(accepted ? "Wokwi serial sample saved in Storage Guardian as SIMULATOR data." : "Wokwi sample parsed, but dashboard delivery failed. Review the error above.");
    } catch (error) {
      setWokwiStatus(error instanceof Error ? error.message : "Could not parse the Wokwi serial output.");
    }
  }

  return <Localize><main className="kg-lab kg-lab-v2">
    <nav className="kg-nav"><Link href="/">← Krishi Connect 360</Link><div className="kg-nav-actions"><Link className="kg-dashboard-link" href="/workspace/storage-guardian">Storage dashboard ↗</Link><LanguageSwitch/><AudioGuideButton guide="storage_guardian" compact/><span><i/> EVENT-DRIVEN FIELD LAB</span></div></nav>
    <header className="kg-hero kg-hero-v2"><div><p className="kg-eyebrow">KRISHI CONNECT 360 / STORAGE INTELLIGENCE</p><h1>KRISHI <em>GUARD</em></h1><p>Interactive grain-store digital twin. Trigger weather and pest events, watch environmental conditions evolve, inspect virtual sensor inputs and see the alarm logic respond. Scenario data is synthetic; a signed-in Wokwi demo node can receive the same readings in Storage Guardian.</p><div className="kg-tags"><span>WOKWI ESP32 DIGITAL TWIN</span><span>RAIN + LEAK MODEL</span><span>RODENT PIR</span><span>INSECT TRAP PULSE</span></div></div><div className="kg-chip kg-chip-v2"><div className="kg-chip-core">KG</div><span>{running ? "SIMULATION RUNNING" : "SIMULATION PAUSED"}</span><small>{cloudLabel} · {seconds}s elapsed</small></div></header>
    <section className="kg-status-row">
      <article className="kg-stat"><small>STORAGE CONDITION</small><strong className={sensorFault ? "urgent" : storageClass}>{sensorFault ? "FAULT" : result.level}</strong><span>{sensorFault ? "Climate sensors disconnected" : "Heuristic condition indicator"}</span></article>
      <article className="kg-stat"><small>CONDITION INDEX</small><strong>{sensorFault ? "—" : result.score}<i>{sensorFault ? "" : "/100"}</i></strong><span>{sensorFault ? "Score withheld until sensor recovery" : "Air RH + grain/air delta + trend"}</span></article>
      <article className="kg-stat"><small>PEST ACTIVITY</small><strong className={pestLevel.toLowerCase()}>{pestLevel}</strong><span>{rodentEvents} rodent events · {insects} insect pulses</span></article>
      <article className="kg-stat"><small>RAIN AT ROOF</small><strong>{rain}%</strong><span>{rainLabel} · leak {leak ? "OPEN" : "SEALED"}</span></article>
    </section>
    <section className="kg-event-toolbar kg-panel"><div><p className="kg-eyebrow">DEMO SCENARIOS</p><h2>Trigger a real-time event</h2><span>Events alter the simulated environment; readings are not random samples.</span></div><div className="kg-scenario-buttons">
      <button onClick={() => applyScenario("clear")}>Clear day</button><button onClick={() => applyScenario("shower")}>Rain shower</button><button onClick={() => applyScenario("roof")}>Heavy rain + leak</button><button onClick={() => applyScenario("rodents")}>Rodent movement</button><button onClick={() => applyScenario("insects")}>Insect trap</button><button onClick={() => setWaterContact(true)}>Water-contact probe</button><button onClick={() => applyScenario("combined")}>Combined stress test</button>
    </div><div className="kg-run-controls"><button className="kg-primary" onClick={() => void runScenarioToDashboard("combined")}>{deviceId ? "Run full demo → dashboard" : "Run full demo · local preview"}</button><button className="kg-primary" onClick={() => setRunning((v) => !v)}>{running ? "Pause simulation" : "Start live simulation"}</button><button className="kg-secondary" onClick={() => capture(false)}>Capture local reading</button><button className="kg-secondary" onClick={() => capture(true)} disabled={!deviceId || sensorFault}>Send reading to dashboard</button><button className="kg-secondary" onClick={reset}>Reset</button><span>{scenarioName} · {seconds}s</span></div></section>
    <section className="kg-visual-grid">
      <article className={"kg-panel kg-store-scene " + (rain > 0 ? "is-raining" : "")}><div className="kg-heading"><div><p className="kg-eyebrow">LIVE STORAGE VISUAL</p><h2>Grain store · environmental view</h2></div><span className="kg-state">{rainLabel} RAIN</span></div>
        <div className="kg-weather-sky"><div className="kg-cloud"><i/><i/><i/></div><div className="kg-sun"/><div className="kg-rain-layer">{Array.from({length:28},(_,i)=><i key={i} style={{left:(((i*37)%100)+"%"),animationDelay:(((i%7)*-.23)+"s"),animationDuration:((.55+(i%5)*.12)+"s")}}/>)}</div><div className="kg-weather-caption"><b>{rainLabel} RAIN</b><span>GPIO34 · ADC raw {rainAdc}/4095</span></div></div>
        <div className="kg-warehouse"><div className={"kg-roof " + (leak && rain>0 ? "leaking" : "")}><span>ROOF / {leak ? "LEAK PATH OPEN" : "SEALED"}</span>{leak && rain>0 ? <i className="kg-drip"/> : null}</div><div className="kg-store-interior"><div className="kg-store-label">STORAGE BAY A · PADDY</div><div className="kg-grain-sacks"><i/><i/><i/><i/></div><div className="kg-store-sensors"><span className="kg-sensor-dot">DHT22</span><span className="kg-sensor-dot">DS18B20</span></div>{leak && rain>20 ? <div className="kg-water-pool" style={{height:Math.min(48,8+rh*.38)+"px"}}/> : null}{rodent ? <div className="kg-pest-rodent" title="PIR movement event">🐀<small>MOTION</small></div> : null}{insects>0 ? <div className="kg-pest-insects" title="Insect trap pulses">✳ ✳<small>TRAP {insects}</small></div> : null}<div className="kg-floor"/></div></div>
        <div className="kg-scene-legend"><span><i className="rain"/> Rainfall</span><span><i className="water"/> Moisture ingress model</span><span><i className="pest"/> Pest event</span></div><p className="kg-disclaimer">Explanatory simulation. A rain plate detects wetness at its mounting point; it does not prove roof leakage. Roof ingress is a separately controlled scenario assumption.</p>
      </article>
      <article className="kg-panel kg-controls-panel"><div className="kg-heading"><div><p className="kg-eyebrow">ENVIRONMENT CONTROLS</p><h2>Change field conditions</h2></div><span className="kg-live"><i/> LIVE MODEL</span></div>
        <label className="kg-control"><span><b>Rain plate wetness · GPIO34</b><strong>{rain}% · ADC {rainAdc}</strong></span><input aria-label="Rain plate wetness" type="range" min="0" max="100" value={rain} onChange={(e)=>setRain(Number(e.target.value))}/><small>Move this control: the rain visual, ADC input and ESP32 pin readout update immediately. 0% = dry · 100% = wet plate.</small></label>
        <div className="kg-climate-controls"><label className="kg-control"><span><b>DHT22 air temperature · GPIO15</b><strong>{air.toFixed(1)}°C</strong></span><input aria-label="DHT22 air temperature" type="range" min="10" max="50" step="0.5" value={air} onChange={(e)=>setAir(Number(e.target.value))}/></label><label className="kg-control"><span><b>DHT22 relative humidity · GPIO15</b><strong>{rh.toFixed(1)}%</strong></span><input aria-label="DHT22 relative humidity" type="range" min="20" max="100" step="1" value={rh} onChange={(e)=>setRh(Number(e.target.value))}/></label><label className="kg-control"><span><b>DS18B20 grain-core · GPIO4</b><strong>{grain.toFixed(1)}°C</strong></span><input aria-label="DS18B20 grain-core temperature" type="range" min="10" max="50" step="0.5" value={grain} onChange={(e)=>setGrain(Number(e.target.value))}/></label></div>
        <label className="kg-toggle"><input type="checkbox" checked={dhtFault} onChange={(e)=>setDhtFault(e.target.checked)}/><span><b>Disconnect DHT22 · GPIO15</b><small>Simulate missing air temperature / humidity data.</small></span></label>
        <label className="kg-toggle"><input type="checkbox" checked={grainFault} onChange={(e)=>setGrainFault(e.target.checked)}/><span><b>Disconnect DS18B20 · GPIO4</b><small>Simulate a missing grain-core temperature probe.</small></span></label>
        <label className="kg-toggle"><input type="checkbox" checked={leak} onChange={(e)=>setLeak(e.target.checked)}/><span><b>Roof ingress path</b><small>Allow rain exposure to raise indoor humidity gradually</small></span></label>
        <div className="kg-pest-controls"><div><b>Physical water-contact probe (GPIO 25)</b><span>{waterContact ? "WATER CONTACT ACTIVE" : "DRY / OPEN"}</span></div><button onClick={() => setWaterContact(true)}>Trigger contact</button><button onClick={() => setWaterContact(false)}>Clear</button></div>
        <div className="kg-pest-controls"><div><b>Rodent perimeter PIR</b><span>{rodent ? "MOTION ACTIVE" : "NO MOTION"}</span></div><button onClick={()=>{setRodent(true);addEvent("RODENT","PIR motion event in storage perimeter");}}>Trigger motion</button><button onClick={()=>setRodent(false)}>Clear</button></div>
        <div className="kg-pest-controls"><div><b>Insect trap beam</b><span>{insects} interruption pulses</span></div><button onClick={()=>addEvent("INSECT","IR beam-break pulse — insect trap entry")}>Trigger trap pulse</button><button onClick={()=>setInsects(0)}>Reset count</button></div>
        <div className="kg-sensor-values"><div><small>AMBIENT AIR</small><b>{air.toFixed(1)}°C</b></div><div><small>RELATIVE HUMIDITY</small><b>{rh.toFixed(1)}%</b></div><div><small>GRAIN CORE</small><b>{grain.toFixed(1)}°C</b></div></div><p className="kg-disclaimer">PIR is a movement channel, not a species classifier. The insect input models an IR break-beam trap counter. Neither channel identifies a pest species.</p>
      </article>
    </section>
    <KrishiWokwiSimulator />
    <section className="kg-live-grid">
      <article className="kg-panel"><div className="kg-heading"><div><p className="kg-eyebrow">FIRMWARE OUTPUT MODEL</p><h2>ESP32 response</h2></div><span className={"kg-state "+(sensorFault ? "urgent" : storageClass)}>{sensorFault ? "SENSOR FAULT" : result.level}</span></div>
        <div className="kg-hardware-board"><div className="kg-mcu"><b>ESP32</b><small>GPIO INPUT / DECISION</small></div><div className="kg-wire-list"><span>GPIO 34 · Rain ADC <b>{rain}% / {rainAdc} · {rain >= 25 ? "WET" : "DRY"}</b></span><span>GPIO 27 · PIR <b>{rodent?"HIGH":"LOW"}</b></span><span>GPIO 26 · IR beam <b>{insects} pulses</b></span><span>GPIO 25 · Water contact <b>{waterContact ? "ACTIVE" : "CLEAR"}</b></span><span>GPIO 15 · DHT22 <b>{dhtFault ? "FAULT / NO DATA" : air.toFixed(1)+"° / "+rh.toFixed(0)+"%"}</b></span><span>GPIO 4 · DS18B20 <b>{grainFault ? "FAULT / NO DATA" : grain.toFixed(1)+"°C"}</b></span></div><div className="kg-output-leds"><div><i className={alertOutputs.led?"on":"off"}/><b>ALERT LED</b><small>{alertOutputs.led?"ON":"OFF"}</small></div><div><i className={alertOutputs.buzzer!=="SILENT"?"buzzer-on":"off"}/><b>BUZZER</b><small>{alertOutputs.buzzer}</small></div></div></div>
        <div className="kg-meter"><div><span>Storage condition index</span><b>{sensorFault ? "—" : result.score+"/100"}</b></div><div className="kg-meter-track"><i style={{width:(sensorFault ? 0 : result.score)+"%"}}/></div></div><ul className="kg-reasons">{(sensorFault ? ["DHT22 / DS18B20 input marked unavailable", "Condition score withheld; reconnect sensors to resume assessment"] : result.reasons).map((x)=><li key={x}>{x}</li>)}</ul><div className="kg-pest-separate"><b>Pest alert channel: {pestLevel}</b><span>{sensorFault ? "Climate fault is active. " : ""}Water-contact input: {waterContact ? "ACTIVE" : "CLEAR"}. Pest and water alerts are independent of the grain-condition score.</span></div>
      </article>
      <article className="kg-panel"><div className="kg-heading"><div><p className="kg-eyebrow">EVENT JOURNAL</p><h2>Detected activity</h2></div><span>{events.length} events</span></div><div className="kg-event-list">{events.slice(0,10).map((e)=><div key={e.id}><i className={e.kind.toLowerCase()}/><span><b>{e.kind==="RODENT"?"Rodent movement":"Insect trap pulse"}</b><small>{e.note}</small></span><time>{e.at}</time></div>)}{!events.length?<p className="kg-empty">No pest events. Trigger a PIR motion or insect trap pulse to test detection.</p>:null}</div></article>
    </section>
    <section className="kg-panel kg-wokwi-bridge">
      <div className="kg-heading"><div><p className="kg-eyebrow">WOKWI → KRISHI CONNECT 360</p><h2>Import an ESP32 simulation reading</h2><p className="kg-disclaimer">If the embedded Wokwi serial stream is unavailable, open the public Wokwi baseline in a separate tab, copy its APP_PAYLOAD line from Serial Monitor, paste it here, and send it into Storage Guardian history. Imported readings are always labelled SIMULATOR. The full multi-sensor circuit is loaded in the embedded simulator above.</p></div><div className="kg-wokwi-links"><a className="kg-dashboard-link" href="https://wokwi.com/projects/481686932424365057" target="_blank" rel="noreferrer">Open saved Wokwi baseline ↗</a><a className="kg-dashboard-link" href="https://github.com/PSP-YN/Chakravyuha_Hackwarts/tree/feature/complete-platform/hardware/krishi-guard/wokwi-web" target="_blank" rel="noreferrer">Full sensor circuit source ↗</a></div></div>
      <label className="kg-wokwi-input">Wokwi serial output<textarea value={wokwiPayload} onChange={(event)=>setWokwiPayload(event.target.value)} rows={4} placeholder={'APP_PAYLOAD {"ambient_temperature_c":30,"relative_humidity_pct":55,"grain_temperature_c":30,"rain_intensity_pct":0,"water_ingress_detected":0,"rodent_motion_events":0,"insect_trap_pulses":0}'} /></label>
      <div className="kg-run-controls"><button className="kg-primary" onClick={()=>void importWokwiSerialOutput()} disabled={!wokwiPayload.trim()}>{deviceId ? "Import Wokwi reading → dashboard" : "Import Wokwi reading · local preview"}</button><button className="kg-secondary" onClick={()=>setWokwiPayload("")}>Clear</button></div>
      {wokwiStatus && <p className="kg-disclaimer" role="status">{wokwiStatus}</p>}
    </section>
    <section className="kg-panel kg-cloud-panel"><div className="kg-heading"><div><p className="kg-eyebrow">APPLICATION INTEGRATION</p><h2>Send the same scenario to KRISHI CONNECT 360</h2></div><span className="kg-state">{cloudState}</span></div>
      <div className="kg-cloud-row"><label>Registered storage device<select value={deviceId} onChange={(e)=>setDeviceId(e.target.value)}><option value="">Select device</option>{devices.map((d)=><option key={d.id} value={d.id}>{d.device_name} · {d.device_code}</option>)}</select></label><button className="kg-secondary" onClick={()=>void loadDevices()}>Refresh devices</button><label className="kg-sync-toggle"><input type="checkbox" checked={syncEnabled} onChange={(e)=>setSyncEnabled(e.target.checked)} disabled={!deviceId}/> Enable cloud sync</label><span>{cloudSent} cloud readings accepted</span></div>
      {cloudError?<p className="kg-cloud-error">{cloudError}</p>:null}{sensorFault?<p className="kg-disclaimer">Cloud sync is intentionally paused during a simulated climate-sensor fault so invalid values are never represented as valid telemetry.</p>:null}{!devices.length?<p className="kg-disclaimer">Register a device first under <Link href="/workspace/storage-guardian">Workspace → Storage Guardian</Link>. Cloud sync requires a signed-in account and an active registered device. Local simulation works without login.</p>:<p className="kg-disclaimer">When enabled, one simulated reading is sent every six seconds to the authenticated Storage Guardian endpoint. Each record is labelled SIMULATOR and includes rain/pest metadata; it is not physical sensor telemetry.</p>}
    </section>
    <section className="kg-panel kg-history"><div className="kg-heading"><div><p className="kg-eyebrow">TIME SERIES</p><h2>Environmental response over time</h2></div><span>{history.length} samples · {seconds}s</span></div>
      <div className="kg-trend-chart"><div className="kg-chart-labels"><span>RH {rh.toFixed(1)}%</span><span>Grain {grain.toFixed(1)}°C</span><span>Rain {rain}%</span></div><svg viewBox="0 0 720 180" role="img" aria-label="Recent environmental readings"><polyline points={history.slice(0,24).reverse().map((s,i)=>(i*30)+","+(165-(s.rh-35)*2.0)).join(" ")} fill="none" stroke="#4c986d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><polyline points={history.slice(0,24).reverse().map((s,i)=>(i*30)+","+(165-(s.grain-18)*3.2)).join(" ")} fill="none" stroke="#d19a3e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg><div className="kg-chart-legend"><span>Humidity</span><span>Grain-core temperature</span></div></div>
      <div className="kg-table-wrap"><table><thead><tr><th>Time</th><th>Air</th><th>RH</th><th>Grain</th><th>Rain</th><th>Pest events</th><th>Condition</th></tr></thead><tbody>{history.slice(0,15).map((s,i)=><tr key={i}><td>{s.at}</td><td>{s.air.toFixed(1)}°C</td><td>{s.rh.toFixed(1)}%</td><td>{s.grain.toFixed(1)}°C</td><td>{s.rain}%</td><td>{s.pest}</td><td><span className={"kg-state "+(s.sensorFault ? "urgent" : s.level.toLowerCase())}>{s.sensorFault ? "FAULT" : s.level}</span></td></tr>)}{!history.length?<tr><td colSpan={7} className="kg-empty">Start the simulation to generate a time series from changing environmental conditions.</td></tr>:null}</tbody></table></div>
    </section>
    <footer className="kg-footer">KRISHI GUARD · EVENT-DRIVEN PROTOTYPE · SYNTHETIC WEATHER / PEST SCENARIOS · PEST DETECTION DOES NOT IDENTIFY SPECIES · CONDITION THRESHOLDS REQUIRE FIELD VALIDATION</footer>
  </main></Localize>;
}
