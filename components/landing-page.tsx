"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LanguageSwitch, useLanguage } from "@/components/language-provider";
import { getSupabase } from "@/lib/supabase/client";

const copy = {
  en: {
    eyebrow: "A stronger farm economy starts with better connections",
    title: "Grow more value from every acre.",
    subtitle: "One trusted place to trade produce, share farm machinery, exchange agricultural by-products and coordinate transport.",
    primary: "Get started",
    secondary: "Explore how it works",
    pilot: "Built for local agricultural networks",
    market: "Find a better market",
    marketText: "Compare participant offers with official mandi reference prices. Understand the costs behind your net realisation.",
    share: "Share the right equipment",
    shareText: "Discover tractors, implements and services by operation, availability, location and booking terms.",
    loop: "Put every by-product to use",
    loopText: "Connect crop residues and by-products with processors using clear quantity and material specifications.",
    transport: "Move farm goods",
    transportText: "Publish vehicle capacity, pickup and destination, service radius and availability for agricultural transport.",
    transparent: "Clear information. Real participants. No invented promises.",
    transparentText: "Listings and offers are published by participants. AGMARKNET prices are reference data—not guaranteed buyer offers. Estimates are not settlement receipts.",
    steps: "How Krishi Connect works",
    step1: "Create your account",
    step1Text: "Sign in with a secure email link and set your preferred language.",
    step2: "Discover or publish",
    step2Text: "Find produce, machinery, by-product or transport opportunities—or publish your own listing.",
    step3: "Coordinate with participants",
    step3Text: "Send offers, agree on service windows, record evidence and resolve issues through clear workflows.",
    footer: "A practical digital network for agriculture.",
    login: "Secure email sign-in",
    lang: "ಕನ್ನಡ"
  },
  kn: {
    eyebrow: "ಉತ್ತಮ ಸಂಪರ್ಕಗಳಿಂದ ಬಲವಾದ ಕೃಷಿ ಆರ್ಥಿಕತೆ ಆರಂಭವಾಗುತ್ತದೆ",
    title: "ಪ್ರತಿ ಎಕರೆಯಿಂದ ಹೆಚ್ಚಿನ ಮೌಲ್ಯ ಪಡೆಯಿರಿ.",
    subtitle: "ಬೆಳೆ ವ್ಯಾಪಾರ, ಕೃಷಿ ಯಂತ್ರೋಪಕರಣ ಹಂಚಿಕೆ, ಉಪಉತ್ಪನ್ನ ವಿನಿಮಯ ಮತ್ತು ಕೃಷಿ ಸರಕು ಸಾಗಣೆಯನ್ನು ಸಂಯೋಜಿಸುವ ಒಂದೇ ವೇದಿಕೆ.",
    primary: "ಪ್ರಾರಂಭಿಸಿ",
    secondary: "ಇದು ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ",
    pilot: "ಸ್ಥಳೀಯ ಕೃಷಿ ಜಾಲಗಳಿಗಾಗಿ ನಿರ್ಮಿಸಲಾಗಿದೆ",
    market: "ಉತ್ತಮ ಮಾರುಕಟ್ಟೆ ಹುಡುಕಿ",
    marketText: "ಭಾಗವಹಿಸುವವರ ಕೊಡುಗೆಗಳನ್ನು ಅಧಿಕೃತ ಮಾರುಕಟ್ಟೆ ಉಲ್ಲೇಖ ಬೆಲೆಗಳೊಂದಿಗೆ ಹೋಲಿಸಿ. ನಿಮ್ಮ ನಿವ್ವಳ ಆದಾಯದ ವೆಚ್ಚಗಳನ್ನು ತಿಳಿಯಿರಿ.",
    share: "ಸರಿಯಾದ ಯಂತ್ರೋಪಕರಣ ಹಂಚಿಕೊಳ್ಳಿ",
    shareText: "ಕಾರ್ಯ, ಲಭ್ಯತೆ, ಸ್ಥಳ ಮತ್ತು ಬುಕಿಂಗ್ ನಿಯಮಗಳ ಆಧಾರದ ಮೇಲೆ ಟ್ರ್ಯಾಕ್ಟರ್, ಉಪಕರಣ ಮತ್ತು ಸೇವೆಗಳನ್ನು ಹುಡುಕಿ.",
    loop: "ಪ್ರತಿ ಉಪಉತ್ಪನ್ನಕ್ಕೂ ಮೌಲ್ಯ ನೀಡಿ",
    loopText: "ಸ್ಪಷ್ಟ ಪ್ರಮಾಣ ಮತ್ತು ವಸ್ತು ವಿವರಗಳೊಂದಿಗೆ ಬೆಳೆ ಅವಶೇಷಗಳು ಮತ್ತು ಉಪಉತ್ಪನ್ನಗಳನ್ನು ಸಂಸ್ಕಾರಕರೊಂದಿಗೆ ಸಂಪರ್ಕಿಸಿ.",
    transport: "ಕೃಷಿ ಸರಕು ಸಾಗಣೆ",
    transportText: "ವಾಹನ ಸಾಮರ್ಥ್ಯ, ಪಿಕಪ್, ಗಮ್ಯಸ್ಥಾನ, ಸೇವಾ ವ್ಯಾಪ್ತಿ ಮತ್ತು ಕೃಷಿ ಸಾರಿಗೆ ಲಭ್ಯತೆಯನ್ನು ಪ್ರಕಟಿಸಿ.",
    transparent: "ಸ್ಪಷ್ಟ ಮಾಹಿತಿ. ನೈಜ ಭಾಗವಹಿಸುವವರು. ಕಲ್ಪಿತ ಭರವಸೆಗಳಿಲ್ಲ.",
    transparentText: "ಪಟ್ಟಿಗಳು ಮತ್ತು ಕೊಡುಗೆಗಳನ್ನು ಭಾಗವಹಿಸುವವರೇ ಪ್ರಕಟಿಸುತ್ತಾರೆ. AGMARKNET ಬೆಲೆಗಳು ಉಲ್ಲೇಖ ಮಾಹಿತಿ ಮಾತ್ರ—ಖಚಿತ ಖರೀದಿ ಕೊಡುಗೆಗಳಲ್ಲ. ಅಂದಾಜುಗಳು ಪಾವತಿ ರಸೀದಿಗಳಲ್ಲ.",
    steps: "ಕೃಷಿ ಕನೆಕ್ಟ್ ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ",
    step1: "ನಿಮ್ಮ ಖಾತೆ ರಚಿಸಿ",
    step1Text: "ಸುರಕ್ಷಿತ ಇಮೇಲ್ ಲಿಂಕ್ ಮೂಲಕ ಸೈನ್ ಇನ್ ಮಾಡಿ ಮತ್ತು ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
    step2: "ಹುಡುಕಿ ಅಥವಾ ಪ್ರಕಟಿಸಿ",
    step2Text: "ಬೆಳೆ, ಯಂತ್ರೋಪಕರಣ, ಉಪಉತ್ಪನ್ನ ಅಥವಾ ಸಾರಿಗೆ ಅವಕಾಶಗಳನ್ನು ಹುಡುಕಿ—ಅಥವಾ ನಿಮ್ಮದೇ ಪಟ್ಟಿಯನ್ನು ಪ್ರಕಟಿಸಿ.",
    step3: "ಭಾಗವಹಿಸುವವರೊಂದಿಗೆ ಸಂಯೋಜಿಸಿ",
    step3Text: "ಕೊಡುಗೆಗಳನ್ನು ಕಳುಹಿಸಿ, ಸೇವಾ ಸಮಯವನ್ನು ಒಪ್ಪಿ, ಸಾಕ್ಷ್ಯ ದಾಖಲಿಸಿ ಮತ್ತು ಸ್ಪಷ್ಟ ಕಾರ್ಯವಿಧಾನಗಳ ಮೂಲಕ ಸಮಸ್ಯೆಗಳನ್ನು ಪರಿಹರಿಸಿ.",
    footer: "ಕೃಷಿಗಾಗಿ ಪ್ರಾಯೋಗಿಕ ಡಿಜಿಟಲ್ ಜಾಲ.",
    login: "ಸುರಕ್ಷಿತ ಇಮೇಲ್ ಸೈನ್ ಇನ್",
    lang: "English"
  }
} as const;

export function LandingPage() {
  const { language } = useLanguage();
  const router = useRouter();
  useEffect(() => {
    const db = getSupabase();
    if (!db) return;
    let alive = true;
    db.auth.getSession().then(({ data }) => { if (alive && data.session) router.replace("/workspace"); });
    const { data } = db.auth.onAuthStateChange((event, session) => { if (alive && event === "SIGNED_IN" && session) router.replace("/workspace"); });
    return () => { alive = false; data.subscription.unsubscribe(); };
  }, [router]);
  const t = copy[language];
  return (
    <main className="landing">
      <header className="landing-nav">
        <a href="/" className="landing-brand" aria-label="Krishi Connect home">
          <img src="/krishi-connect-logo.png" alt="Krishi Connect 360" />
          <span><b>KRISHI CONNECT 360</b><small>FARM ECONOMY NETWORK</small></span>
        </a>
        <nav>
          <a href="#markets">{language === "en" ? "Markets" : "ಮಾರುಕಟ್ಟೆಗಳು"}</a>
          <a href="#how">{language === "en" ? "How it works" : "ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ"}</a>
          <LanguageSwitch />
          <a className="landing-login" href="/login">{language === "en" ? "Sign in" : "ಸೈನ್ ಇನ್"}</a>
        </nav>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <span className="landing-kicker"><i /> {t.pilot}</span>
          <p className="landing-eyebrow">{t.eyebrow}</p>
          <h1>{t.title}</h1>
          <p className="landing-lead">{t.subtitle}</p>
          <div className="landing-cta">
            <a className="landing-primary" href="/login">{t.primary} <span>↗</span></a>
            <a className="landing-secondary" href="#how">{t.secondary} ↓</a>
          </div>
          <div className="landing-trust"><span>●</span> {t.login} <span className="landing-separator">·</span> Supabase secured <span className="landing-separator">·</span> English / ಕನ್ನಡ</div>
        </div>
        <div className="landing-visual">
          <img src="/krishi-connect-logo.png" alt="Krishi Connect 360 agricultural brand mark" />
          <div className="landing-visual-caption"><b>360°</b><span>LOCAL FARM<br/>NETWORK</span></div>
        </div>
      </section>

      <section className="landing-markets" id="markets">
        <div className="landing-section-heading"><span>01 — 04 / CONNECTED SERVICES</span><h2>{language === "en" ? "One network. Four ways to create value." : "ಒಂದೇ ಜಾಲ. ಮೌಲ್ಯ ಸೃಷ್ಟಿಸಲು ನಾಲ್ಕು ಮಾರ್ಗಗಳು."}</h2></div>
        <div className="landing-market-grid">
          <article className="landing-market market-produce"><span>01 / TRADE PRODUCE</span><div className="landing-market-icon">↗</div><h3>KrishiMarket 360</h3><p>{t.marketText}</p><a href="/workspace?module=produce">{t.market} ↗</a></article>
          <article className="landing-market market-machinery"><span>02 / SHARE EQUIPMENT</span><div className="landing-market-icon">⚙</div><h3>KrishiShare</h3><p>{t.shareText}</p><a href="/workspace?module=machinery">{t.share} ↗</a></article>
          <article className="landing-market market-byproduct"><span>03 / CIRCULAR VALUE</span><div className="landing-market-icon">⟳</div><h3>FarmLoop</h3><p>{t.loopText}</p><a href="/workspace?module=byproduct">{t.loop} ↗</a></article>
          <article className="landing-market market-machinery"><span>04 / MOVE GOODS</span><div className="landing-market-icon">⇄</div><h3>KrishiTransit</h3><p>{t.transportText}</p><a href="/workspace?module=transport">{t.transport} ↗</a></article>
        </div>
      </section>

      <section className="landing-transparency">
        <div className="landing-transparency-mark">✓</div>
        <div><span>BUILT AROUND TRUST</span><h2>{t.transparent}</h2><p>{t.transparentText}</p></div>
      </section>

      <section className="landing-how" id="how">
        <div className="landing-section-heading"><span>THE WORKFLOW</span><h2>{t.steps}</h2></div>
        <div className="landing-steps">
          <article><b>01</b><h3>{t.step1}</h3><p>{t.step1Text}</p></article>
          <article><b>02</b><h3>{t.step2}</h3><p>{t.step2Text}</p></article>
          <article><b>03</b><h3>{t.step3}</h3><p>{t.step3Text}</p></article>
        </div>
      </section>

      <section className="landing-bottom-cta">
        <img src="/krishi-connect-logo.png" alt="" />
        <div><span>KRISHI CONNECT 360</span><h2>{language === "en" ? "Make your next farm decision with better information." : "ಉತ್ತಮ ಮಾಹಿತಿಯೊಂದಿಗೆ ನಿಮ್ಮ ಮುಂದಿನ ಕೃಷಿ ನಿರ್ಧಾರ ಕೈಗೊಳ್ಳಿ."}</h2></div>
        <a href="/login">{t.primary} ↗</a>
      </section>

      <footer className="landing-footer"><span>© 2026 KRISHI CONNECT 360</span><span>{t.footer}</span><span>AGMARKNET reference data · Participant-led coordination</span><div><a href="/privacy">{language==="kn"?"ಗೌಪ್ಯತೆ":"Privacy"}</a><a href="/terms">{language==="kn"?"ನಿಯಮಗಳು":"Terms"}</a></div></footer>
    </main>
  );
}
