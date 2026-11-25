import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "KRISHI CONNECT 360", description: "Farmer-first coordination for produce, machinery services and agricultural by-products." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
