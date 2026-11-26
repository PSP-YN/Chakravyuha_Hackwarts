import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/components/language-provider";

export const metadata: Metadata = {
  title: "ಕೃಷಿ ಕನೆಕ್ಟ್ 360 — ಕೃಷಿ ಆರ್ಥಿಕ ಜಾಲ",
  description: "ಬೆಳೆ ವ್ಯಾಪಾರ, ಯಂತ್ರೋಪಕರಣ ಹಂಚಿಕೆ, ಉಪಉತ್ಪನ್ನ ವಿನಿಮಯ, ಕೃಷಿ ಸಾರಿಗೆ, FPO ಒಕ್ಕೂಟ ಮತ್ತು ESP32 ಧಾನ್ಯ ಸಂಗ್ರಹಣೆ ಮೇಲ್ವಿಚಾರಣೆಗೆ ಕರ್ನಾಟಕದ ಕೃಷಿ ಜಾಲ.",
  keywords: ["Krishi Connect 360","Karnataka farmer marketplace","agricultural machinery rental","farm by-product exchange","agricultural transport","FPO aggregation","municipal waste coordination","ESP32 grain storage monitor","Kannada farmer platform","mandi reference prices","ಕನ್ನಡ ರೈತ ವೇದಿಕೆ","ಕೃಷಿ ಮಾರುಕಟ್ಟೆ","ಧಾನ್ಯ ಸಂಗ್ರಹಣೆ ಮೇಲ್ವಿಚಾರಣೆ"],
  alternates: { canonical: "/" },
  applicationName: "KRISHI CONNECT 360",
  metadataBase: new URL("https://krishi-connect-360.vercel.app"),
  icons: { icon: "/favicon.png", apple: "/krishi-connect-logo.png" },
  openGraph: {
    title: "ಕೃಷಿ ಕನೆಕ್ಟ್ 360 — ಕೃಷಿ ಆರ್ಥಿಕ ಜಾಲ",
    description: "ಬೆಳೆ ವ್ಯಾಪಾರ ಮಾಡಿ, ಯಂತ್ರೋಪಕರಣ ಹಂಚಿಕೊಳ್ಳಿ, ಕೃಷಿ ಉಪಉತ್ಪನ್ನಗಳನ್ನು ವಿನಿಮಯ ಮಾಡಿ, ಸಾರಿಗೆಯನ್ನು ಸಂಯೋಜಿಸಿ ಮತ್ತು ಸಂಗ್ರಹಿತ ಧಾನ್ಯವನ್ನು ಒಂದೇ ಜಾಲದಲ್ಲಿ ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಿ.",
    locale: "kn_IN",
    type: "website",
    url: "https://krishi-connect-360.vercel.app",
    images: [{ url: "/krishi-connect-logo.png", width: 1254, height: 1254, alt: "ಕೃಷಿ ಕನೆಕ್ಟ್ 360" }]
  },
  robots: { index: true, follow: true },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="kn"><body><LanguageProvider>{children}</LanguageProvider></body></html>;
}
