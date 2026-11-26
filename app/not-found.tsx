"use client";

import Link from "next/link";
import { useLanguage } from "@/components/language-provider";

export default function NotFound() {
  const { language } = useLanguage();
  const kn = language === "kn";
  return (
    <main className="min-h-screen grid place-items-center px-6">
      <section className="max-w-xl text-center">
        <p className="text-sm tracking-widest">KRISHI CONNECT 360</p>
        <h1 className="mt-4 text-4xl font-semibold">{kn ? "ಪುಟ ಕಂಡುಬಂದಿಲ್ಲ" : "Page not found"}</h1>
        <p className="mt-4 text-base opacity-70">{kn ? "ಈ ಪುಟದ ವಿಳಾಸ ಬದಲಾಗಿರಬಹುದು ಅಥವಾ ಲಿಂಕ್ ತಪ್ಪಾಗಿರಬಹುದು." : "The page may have moved or the link may be incorrect."}</p>
        <Link className="button button-dark inline-flex mt-8" href="/">{kn ? "ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ" : "Return to home"}</Link>
      </section>
    </main>
  );
}
