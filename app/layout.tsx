import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/components/language-provider";

export const metadata: Metadata = {
  title: "KRISHI CONNECT 360 — Farm Economy Network",
  description: "Farmer-first Karnataka agriculture network for produce, machinery, by-product exchange, transport, FPO aggregation and municipal coordination, with optional ESP32 storage monitoring and English/Kannada support.",
  keywords: ["Krishi Connect 360","Karnataka farmer marketplace","agricultural machinery rental","farm by-product exchange","agricultural transport","FPO aggregation","municipal waste coordination","ESP32 grain storage monitor","Kannada farmer platform","mandi reference prices"],
  alternates: { canonical: "/" },
  applicationName: "KRISHI CONNECT 360",
  metadataBase: new URL("https://krishi-connect-360.vercel.app"),
  icons: { icon: "/favicon.png", apple: "/krishi-connect-logo.png" },
  openGraph: {
    title: "KRISHI CONNECT 360 — Farm Economy Network",
    description: "Trade produce, share machinery, exchange agricultural by-products, coordinate transport and monitor stored grain in one network.",
    locale: "en_IN",
    type: "website",
    url: "https://krishi-connect-360.vercel.app",
    images: [{ url: "/krishi-connect-logo.png", width: 1254, height: 1254, alt: "Krishi Connect 360" }]
  },
  robots: { index: true, follow: true },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><LanguageProvider>{children}</LanguageProvider></body></html>;
}
