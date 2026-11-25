import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/components/language-provider";

export const metadata: Metadata = {
  title: "KRISHI CONNECT 360 — Farm Economy Network",
  description: "Discover produce markets, share agricultural machinery and coordinate by-product exchange in one farmer-first network.",
  applicationName: "KRISHI CONNECT 360",
  metadataBase: new URL("https://krishi-connect-360.vercel.app"),
  icons: { icon: "/favicon.png", apple: "/krishi-connect-logo.png" },
  openGraph: {
    title: "KRISHI CONNECT 360 — Farm Economy Network",
    description: "Find better markets, share farm equipment and put agricultural by-products to use.",
    type: "website",
    url: "https://krishi-connect-360.vercel.app",
    images: [{ url: "/krishi-connect-logo.png", width: 1254, height: 1254, alt: "Krishi Connect 360" }]
  },
  robots: { index: true, follow: true },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><LanguageProvider>{children}</LanguageProvider></body></html>;
}
