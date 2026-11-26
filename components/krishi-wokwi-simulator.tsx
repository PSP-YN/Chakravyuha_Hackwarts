export function KrishiWokwiSimulator() {
  return (
    <section className="kg-wokwi-live">
      <div className="kg-wokwi-heading">
        <div>
          <p className="kg-eyebrow">PUBLIC WOKWI CIRCUIT · CLIMATE SENSOR BASELINE</p>
          <h2>Live Wokwi hardware simulation</h2>
          <p>
            Run the saved ESP32 circuit here. This published baseline demonstrates the DHT22,
            DS18B20, status LED and buzzer. Use the digital-twin controls above for the additional
            rain, pest, water-contact and fault scenarios.
          </p>
        </div>
        <span className="kg-wokwi-status normal">PUBLIC SIMULATOR</span>
      </div>
      <iframe
        className="kg-wokwi-frame"
        src="https://wokwi.com/projects/481686932424365057?embed=1"
        title="KRISHI GUARD public Wokwi ESP32 simulation"
        loading="lazy"
        allow="clipboard-read; clipboard-write; fullscreen"
        allowFullScreen
      />
      <div className="kg-wokwi-note">
        The public Wokwi project is currently a climate-only baseline. The complete multi-sensor
        source in this repository adds rain-plate wetness, PIR movement, insect-beam interruptions
        and a separate water-contact input. The public project owner must sign in to Wokwi and save
        those expanded files before they appear in this iframe.
      </div>
      <div className="kg-wokwi-links">
        <a href="https://wokwi.com/projects/481686932424365057" target="_blank" rel="noreferrer">
          Open project in Wokwi ↗
        </a>
        <a href="https://github.com/PSP-YN/Chakravyuha_Hackwarts/tree/feature/complete-platform/hardware/krishi-guard/wokwi-web" target="_blank" rel="noreferrer">
          View complete multi-sensor circuit source ↗
        </a>
      </div>
    </section>
  );
}
