"use client";

import { useLanguage } from "@/components/language-provider";

export function KrishiWokwiSimulator() {
  const { language } = useLanguage();
  const kn = language === "kn";
  return (
    <section className="kg-wokwi-live">
      <div className="kg-wokwi-heading">
        <div>
          <p className="kg-eyebrow">{kn ? "ಸಾರ್ವಜನಿಕ WOKWI ಸರ್ಕ್ಯೂಟ್ · ಹವಾಮಾನ ಸಂವೇದಕ ಮೂಲ ಮಾದರಿ" : "PUBLIC WOKWI CIRCUIT · CLIMATE SENSOR BASELINE"}</p>
          <h2>{kn ? "ನೇರ Wokwi ಹಾರ್ಡ್‌ವೇರ್ ಸಿಮ್ಯುಲೇಶನ್" : "Live Wokwi hardware simulation"}</h2>
          <p>
            {kn
              ? "ಉಳಿಸಿದ ESP32 ಸರ್ಕ್ಯೂಟ್ ಅನ್ನು ಇಲ್ಲಿ ಚಲಾಯಿಸಿ. ಈ ಪ್ರಕಟಿತ ಮೂಲ ಮಾದರಿಯಲ್ಲಿ DHT22, DS18B20, ಸ್ಥಿತಿ LED ಮತ್ತು ಬಜರ್ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತವೆ. ಮಳೆ, ಕೀಟ, ನೀರಿನ ಸಂಪರ್ಕ ಮತ್ತು ಸಂವೇದಕ ದೋಷಗಳ ಹೆಚ್ಚುವರಿ ಸನ್ನಿವೇಶಗಳಿಗೆ ಮೇಲಿನ ಡಿಜಿಟಲ್-ಟ್ವಿನ್ ನಿಯಂತ್ರಣಗಳನ್ನು ಬಳಸಿ."
              : "Run the saved ESP32 circuit here. This published baseline demonstrates the DHT22, DS18B20, status LED and buzzer. Use the digital-twin controls above for the additional rain, pest, water-contact and fault scenarios."}
          </p>
        </div>
        <span className="kg-wokwi-status normal">{kn ? "ಸಾರ್ವಜನಿಕ ಸಿಮ್ಯುಲೇಟರ್" : "PUBLIC SIMULATOR"}</span>
      </div>
      <iframe
        className="kg-wokwi-frame"
        src="https://wokwi.com/projects/481686932424365057?embed=1"
        title={kn ? "ಕೃಷಿ ಗಾರ್ಡ್ ಸಾರ್ವಜನಿಕ Wokwi ESP32 ಸಿಮ್ಯುಲೇಶನ್" : "KRISHI GUARD public Wokwi ESP32 simulation"}
        loading="lazy"
        allow="clipboard-read; clipboard-write"
        allowFullScreen
      />
      <div className="kg-wokwi-note">
        {kn
          ? "ಸಾರ್ವಜನಿಕ Wokwi ಯೋಜನೆಯು ಪ್ರಸ್ತುತ ಹವಾಮಾನ ಸಂವೇದಕಗಳ ಮೂಲ ಮಾದರಿಯಾಗಿದೆ. ಈ ರೆಪೊಸಿಟರಿಯ ಸಂಪೂರ್ಣ ಬಹು-ಸಂವೇದಕ ಮೂಲ ಕೋಡ್‌ನಲ್ಲಿ ಮಳೆ ಫಲಕದ ತೇವ, PIR ಚಲನೆ, ಕೀಟ-ಕಿರಣ ಅಡಚಣೆ ಮತ್ತು ಪ್ರತ್ಯೇಕ ನೀರಿನ ಸಂಪರ್ಕ ಇನ್‌ಪುಟ್ ಸೇರಿವೆ. ಈ ಹೆಚ್ಚುವರಿ ಫೈಲ್‌ಗಳು ಅಳವಡಿಸಿದ ಸಿಮ್ಯುಲೇಟರ್‌ನಲ್ಲಿ ಕಾಣಲು ಸಾರ್ವಜನಿಕ ಯೋಜನೆಯ ಮಾಲೀಕರು Wokwi ಗೆ ಸೈನ್ ಇನ್ ಮಾಡಿ ಅವನ್ನು ಉಳಿಸಬೇಕು."
          : "The public Wokwi project is currently a climate-only baseline. The complete multi-sensor source in this repository adds rain-plate wetness, PIR movement, insect-beam interruptions and a separate water-contact input. The public project owner must sign in to Wokwi and save those expanded files before they appear in this iframe."}
      </div>
      <div className="kg-wokwi-links">
        <a href="https://wokwi.com/projects/481686932424365057" target="_blank" rel="noreferrer">
          {kn ? "Wokwi ಯೋಜನೆ ತೆರೆಯಿರಿ ↗" : "Open project in Wokwi ↗"}
        </a>
        <a href="https://github.com/PSP-YN/Chakravyuha_Hackwarts/tree/feature/complete-platform/hardware/krishi-guard/wokwi-web" target="_blank" rel="noreferrer">
          {kn ? "ಪೂರ್ಣ ಬಹು-ಸಂವೇದಕ ಸರ್ಕ್ಯೂಟ್ ಮೂಲ ಕೋಡ್ ನೋಡಿ ↗" : "View complete multi-sensor circuit source ↗"}
        </a>
      </div>
    </section>
  );
}
