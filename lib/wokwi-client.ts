// Wokwi's experimental browser embed uses a MessagePort command/event protocol.
// This client mirrors the public wokwi-embed-example transport and API.

export type WokwiEventPayload = { bytes?: number[]; [key: string]: unknown };
type ApiMessage = {
  type?: string;
  event?: string;
  payload?: unknown;
  id?: string;
  result?: unknown;
  error?: boolean;
};

class MessagePortTransport {
  onMessage: (message: ApiMessage) => void = () => {};
  constructor(private readonly port: MessagePort) {
    this.port.onmessage = (event: MessageEvent<ApiMessage>) => this.onMessage(event.data);
    this.port.start();
  }
  send(message: Record<string, unknown>) {
    this.port.postMessage(message);
  }
  close() {
    this.port.close();
  }
}

export class WokwiClient extends EventTarget {
  private lastId = 0;
  private readonly pendingCommands = new Map<string, { resolve: (value: unknown) => void; reject: (error: Error) => void; timeout: ReturnType<typeof setTimeout> }>();
  private readonly transport: MessagePortTransport;

  constructor(port: MessagePort) {
    super();
    this.transport = new MessagePortTransport(port);
    this.transport.onMessage = (message) => this.processMessage(message);
  }

  private sendCommand<T = unknown>(command: string, params?: Record<string, unknown>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const id = String(this.lastId++);
      const timeout = setTimeout(() => {
        this.pendingCommands.delete(id);
        reject(new Error(`Wokwi command timed out: ${command}`));
      }, 20000);
      this.pendingCommands.set(id, { resolve: resolve as (value: unknown) => void, reject, timeout });
      this.transport.send({ type: "command", command, params, id });
    });
  }

  private processMessage(message: ApiMessage) {
    switch (message.type) {
      case "hello":
        this.dispatchEvent(new CustomEvent("wokwi:connected", { detail: message }));
        break;
      case "event":
        if (message.event) this.dispatchEvent(new CustomEvent(message.event, { detail: message.payload }));
        break;
      case "response": {
        const id = message.id ?? "";
        const pending = this.pendingCommands.get(id);
        if (!pending) break;
        clearTimeout(pending.timeout);
        this.pendingCommands.delete(id);
        if (message.error) {
          const detail = message.result as { code?: number; message?: string } | undefined;
          pending.reject(new Error(`Wokwi ${detail?.code ?? "error"}: ${detail?.message ?? "command failed"}`));
        } else {
          pending.resolve(message.result);
        }
        break;
      }
    }
  }

  fileUpload(name: string, content: string | Uint8Array) {
    if (typeof content === "string") return this.sendCommand("file:upload", { name, text: content });
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < content.length; i += chunkSize) binary += String.fromCharCode(...content.subarray(i, i + chunkSize));
    return this.sendCommand("file:upload", { name, binary: btoa(binary) });
  }

  serialMonitorListen() { return this.sendCommand("serial-monitor:listen"); }
  simStart(params: Record<string, unknown>) { return this.sendCommand("sim:start", params); }
  simPause() { return this.sendCommand("sim:pause"); }
  simStatus() { return this.sendCommand<{ running: boolean; nanos: number }>("sim:status"); }

  dispose() {
    this.pendingCommands.forEach((pending) => {
      clearTimeout(pending.timeout);
      pending.reject(new Error("Wokwi connection closed"));
    });
    this.pendingCommands.clear();
    this.transport.close();
  }
}
