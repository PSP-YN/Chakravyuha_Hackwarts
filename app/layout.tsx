import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "KRISHI CONNECT 360 — Farm Economy Network",
  description: "A farmer-first agricultural network for produce discovery, machinery sharing, by-product exchange and transparent farm economics.",
  applicationName: "KRISHI CONNECT 360",
  metadataBase: new URL("https://krishi-connect-360.vercel.app"),
  openGraph: {
    title: "KRISHI CONNECT 360 — Farm Economy Network",
    description: "Find better markets, share farm equipment and put agricultural by-products to use.",
    type: "website",
    url: "https://krishi-connect-360.vercel.app",
  },
  robots: { index: true, follow: true },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
