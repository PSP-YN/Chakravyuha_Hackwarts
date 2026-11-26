"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { WokwiClient, type WokwiEventPayload } from "@/lib/wokwi-client";
import { parseWokwiSerialOutput, type WokwiSerialReading } from "@/lib/krishi-simulation";

type SensorInputs = {
  air: number;
  humidity: number;
  grain: number;
  rain: number;
  waterContact: boolean;
  dhtFault: boolean;
  grainFault: boolean;
};

type Diagram = {
  parts: Array<{ id: string; attrs?: Record<string, string>; [key: string]: unknown }>;
  connections: [string, string, string, string[]][];
  [key: string]: unknown;
};

const CLIENT_ID = "wokwi_client_omf4ejkz6n6twj7d3x2eqmyp";
const EMBED_URL = `https://wokwi.com/experimental/embed?client_id=${CLIENT_ID}`;

function createSensorDiagram(source: Diagram, input: SensorInputs): Diagram {
  const diagram = JSON.parse(JSON.stringify(source)) as Diagram;
  const part = (id: string) => diagram.parts.find((entry) => entry.id === id);
  const rain = part("rainpot");
  const dht = part("dht");
  const grain = part("grain");
  if (!rain || !dht || !grain) throw new Error("The Wokwi circuit is missing a required sensor part.");

  rain.attrs = { ...rain.attrs, value: String(Math.round(1023 * (1 - input.rain / 100))) };
  dht.attrs = { ...dht.attrs, temperature: input.air.toFixed(1), humidity: input.humidity.toFixed(1) };
  grain.attrs = { ...grain.attrs, temperature: input.grain.toFixed(1) };
  // The water-contact input is active-low. The browser control closes the
  // virtual probe by connecting GPIO25 to ground; the Wokwi pushbutton remains
  // available for manual interaction when the browser control is clear.
  diagram.connections = diagram.connections.filter((wire) => !(wire[0] === "esp:25" && wire[1] === "esp:GND.1"));
  if (input.waterContact) diagram.connections.push(["esp:25", "esp:GND.1", "green", []]);

  // Disconnect only the sensor data conductor; keep power and pull-up wiring intact.
  if (input.dhtFault) diagram.connections = diagram.connections.filter((wire) => !(wire[0] === "esp:15" && wire[1] === "dht:SDA"));
  if (input.grainFault) diagram.connections = diagram.connections.filter((wire) => !(wire[0] === "esp:4" && wire[1] === "grain:DQ"));
  return diagram;
}

export function KrishiWokwiSimulator(props: SensorInputs & { onReading?: (reading: WokwiSerialReading) => void }) {
  const [status, setStatus] = useState("Connecting to the virtual ESP32…");
  const [serial, setSerial] = useState("");
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const clientRef = useRef<WokwiClient | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const serialBufferRef = useRef("");
  const onReadingRef = useRef(props.onReading);
  onReadingRef.current = props.onReading;
  const diagramRef = useRef<Diagram | null>(null);
  const readyRef = useRef(false);
  const busyRef = useRef(false);
  const queuedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const applyInputsRef = useRef<() => Promise<void>>(async () => {});
  const firmwareNameRef = useRef<string>("");
  const valuesRef = useRef(props);
  valuesRef.current = props;

  const applyInputs = useCallback(async () => {
    const client = clientRef.current;
    const baseDiagram = diagramRef.current;
    if (!client || !baseDiagram || !readyRef.current) return;
    if (busyRef.current) {
      queuedRef.current = true;
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setError("");
    setStatus("Updating virtual sensor inputs and restarting ESP32…");
    try {
      const nextDiagram = createSensorDiagram(baseDiagram, valuesRef.current);
      await client.simPause();
      const firmwareFile = firmwareNameRef.current;
      if (!firmwareFile) throw new Error("ESP32 firmware has not been loaded into Wokwi yet.");
      await client.fileUpload("diagram.json", JSON.stringify(nextDiagram));
      await client.simStart({ firmware: firmwareFile });
      const input = valuesRef.current;
      const adc = Math.round(4095 * (1 - input.rain / 100));
      setStatus(`ESP32 restarted · GPIO34 ADC ${adc}/4095 · ${input.air.toFixed(1)}°C / ${input.humidity.toFixed(0)}% RH · grain ${input.grain.toFixed(1)}°C · water ${input.waterContact ? "ACTIVE" : "CLEAR"}`);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Unknown Wokwi error";
      setError(message);
      setStatus("ESP32 input update failed");
    } finally {
      busyRef.current = false;
      setBusy(false);
      if (queuedRef.current) {
        queuedRef.current = false;
        void applyInputsRef.current();
      }
    }
  }, []);
  applyInputsRef.current = applyInputs;

  useEffect(() => {
    let mounted = true;
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== "https://wokwi.com" || event.source !== iframeRef.current?.contentWindow || !event.data?.port || clientRef.current) return;
      const client = new WokwiClient(event.data.port as MessagePort);
      clientRef.current = client;
      client.addEventListener("serial-monitor:data", (event) => {
        const payload = (event as CustomEvent<WokwiEventPayload>).detail;
        const bytes = payload?.bytes ?? [];
        const text = new TextDecoder().decode(new Uint8Array(bytes));
        setSerial((previous) => (previous + text).slice(-16000));
        const lines = (serialBufferRef.current + text).split(/\r?\n/);
        serialBufferRef.current = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.includes("APP_PAYLOAD")) continue;
          try {
            onReadingRef.current?.(parseWokwiSerialOutput(line));
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Invalid Wokwi serial payload");
          }
        }
      });
      client.addEventListener("wokwi:connected", async () => {
        try {
          setStatus("Loading circuit and ESP32 firmware…");
          const [diagramResponse, manifestResponse] = await Promise.all([
            fetch("/krishi-guard/diagram.json", { cache: "no-store" }),
            fetch("/krishi-guard/manifest.json", { cache: "no-store" }),
          ]);
          if (!diagramResponse.ok || !manifestResponse.ok) throw new Error("Wokwi firmware assets are unavailable. Run npm run sync:krishi-wokwi and rebuild.");
          const manifest = await manifestResponse.json() as { firmwareFile?: string };
          if (!manifest.firmwareFile) throw new Error("Wokwi firmware manifest is missing its binary filename.");
          const firmwareResponse = await fetch(`/krishi-guard/${manifest.firmwareFile}`, { cache: "no-store" });
          if (!firmwareResponse.ok) throw new Error("The compiled ESP32 firmware binary could not be downloaded.");
          const diagram = await diagramResponse.json() as Diagram;
          const firmware = new Uint8Array(await firmwareResponse.arrayBuffer());
          if (!mounted) return;
          diagramRef.current = diagram;
          firmwareNameRef.current = manifest.firmwareFile;
          await client.serialMonitorListen();
          await client.fileUpload("diagram.json", JSON.stringify(createSensorDiagram(diagram, valuesRef.current)));
          await client.fileUpload(manifest.firmwareFile, firmware);
          await client.simStart({ firmware: manifest.firmwareFile });
          if (!mounted) return;
          readyRef.current = true;
          setConnected(true);
          setStatus("ESP32 firmware running · compiled binary loaded · circuit synced");
        } catch (cause) {
          const message = cause instanceof Error ? cause.message : "Unknown Wokwi initialization error";
          setError(message);
          setStatus("Wokwi could not start the ESP32 firmware");
        }
      });
    };
    window.addEventListener("message", handleMessage);
    return () => {
      mounted = false;
      window.removeEventListener("message", handleMessage);
      if (timerRef.current) clearTimeout(timerRef.current);
      readyRef.current = false;
      clientRef.current?.dispose();
      clientRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!readyRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void applyInputs(), 700);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [props.air, props.humidity, props.grain, props.rain, props.waterContact, props.dhtFault, props.grainFault, applyInputs]);

  return (
    <section className="kg-panel kg-wokwi-live">
      <div className="kg-heading">
        <div>
          <p className="kg-eyebrow">COMPILED ESP32 FIRMWARE · VIRTUAL CIRCUIT</p>
          <h2>Live Wokwi hardware simulation</h2>
          <p className="kg-disclaimer">The simulator runs the compiled ESP32 firmware, not a second UI-only model. Rain, DHT22, DS18B20, water-contact and climate-fault controls above are pushed into the circuit; each update restarts the MCU with those sensor values. GPIO26 insect pulses can be triggered with the yellow button (I key), and GPIO27 motion with the PIR sensor’s “Simulate Motion” popup.</p>
        </div>
        <span className={"kg-state " + (error ? "urgent" : connected ? "normal" : "watch")}>{error ? "SIMULATOR ERROR" : connected ? "VIRTUAL ESP32 RUNNING" : "CONNECTING"}</span>
      </div>
      <div className="kg-wokwi-status"><span className={connected ? "kg-wokwi-dot on" : "kg-wokwi-dot"}/><span>{status}</span><button className="kg-secondary" onClick={() => void applyInputs()} disabled={!connected || busy}>{busy ? "Updating…" : "Sync current controls"}</button><a href="https://wokwi.com/projects/481686932424365057" target="_blank" rel="noreferrer">Open public Wokwi baseline (climate-only) ↗</a></div>
      {error ? <p className="kg-cloud-error">{error}</p> : null}
      <iframe ref={iframeRef} className="kg-wokwi-frame" src={EMBED_URL} title="KRISHI GUARD live ESP32 hardware simulator" allow="clipboard-read; clipboard-write" />
      <div className="kg-wokwi-serial"><div><b>ESP32 Serial Monitor</b><small>Firmware serial output · 115200 baud · if blank, open Serial Monitor in the Wokwi toolbar and use the manual APP_PAYLOAD importer below</small></div><pre>{serial || "Open Serial Monitor inside the Wokwi circuit to view the real firmware trace."}</pre></div>
      <p className="kg-disclaimer">GPIO26 insect pulses and GPIO27 PIR motion are also interactive circuit parts. The Wokwi embed API is experimental and may not stream serial output in every browser. If the serial panel remains blank, use the public Wokwi Serial Monitor and the manual APP_PAYLOAD importer below. This is a virtual ESP32, not a physical board.</p>
    </section>
  );
}
