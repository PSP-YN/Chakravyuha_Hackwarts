"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";
import { LanguageSwitch, useLanguage } from "@/components/language-provider";

const copy = {
  en: {
    eyebrow:"YOUR FARM ECONOMY, CONNECTED",title:"Sign in to your farm network.",
    body:"Use a secure, passwordless email link. No Aadhaar, bank details or payment information is requested.",
    email:"Email address",send:"Send secure sign-in link",sending:"Sending link…",
    sent:"Sign-in link sent. Open the newest email on this device. The link expires; request a new one if needed.",
    failed:"We could not send the sign-in link. Check the email address and try again.",
    noConfig:"Account access is not configured in this deployment. Contact the pilot operator.",
    back:"Back to home",privacy:"Privacy notice",terms:"Terms of use",
    secure:"Supabase Auth · Passwordless email · English / ಕನ್ನಡ",
    tip:"For reliable delivery, the project owner must configure a production SMTP provider in Supabase Auth."
  },
  kn: {
    eyebrow:"ನಿಮ್ಮ ಕೃಷಿ ಆರ್ಥಿಕ ಜಾಲ",title:"ನಿಮ್ಮ ಕೃಷಿ ಜಾಲಕ್ಕೆ ಸೈನ್ ಇನ್ ಮಾಡಿ.",
    body:"ಸುರಕ್ಷಿತ ಪಾಸ್‌ವರ್ಡ್ ರಹಿತ ಇಮೇಲ್ ಲಿಂಕ್ ಬಳಸಿ. ಆಧಾರ್, ಬ್ಯಾಂಕ್ ವಿವರ ಅಥವಾ ಪಾವತಿ ಮಾಹಿತಿ ಕೇಳುವುದಿಲ್ಲ.",
    email:"ಇಮೇಲ್ ವಿಳಾಸ",send:"ಸುರಕ್ಷಿತ ಸೈನ್ ಇನ್ ಲಿಂಕ್ ಕಳುಹಿಸಿ",sending:"ಲಿಂಕ್ ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ…",
    sent:"ಸೈನ್ ಇನ್ ಲಿಂಕ್ ಕಳುಹಿಸಲಾಗಿದೆ. ಈ ಸಾಧನದಲ್ಲಿನ ಹೊಸ ಇಮೇಲ್ ತೆರೆಯಿರಿ. ಲಿಂಕ್ ಅವಧಿ ಮುಗಿದರೆ ಹೊಸದನ್ನು ಕೇಳಿ.",
    failed:"ಸೈನ್ ಇನ್ ಲಿಂಕ್ ಕಳುಹಿಸಲಾಗಲಿಲ್ಲ. ಇಮೇಲ್ ವಿಳಾಸ ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    noConfig:"ಈ ನಿಯೋಜನೆಯಲ್ಲಿ ಖಾತೆ ಪ್ರವೇಶ ಸಂರಚಿಸಲಾಗಿಲ್ಲ. ಪೈಲಟ್ ನಿರ್ವಾಹಕರನ್ನು ಸಂಪರ್ಕಿಸಿ.",
    back:"ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ",privacy:"ಗೌಪ್ಯತಾ ಸೂಚನೆ",terms:"ಬಳಕೆಯ ನಿಯಮಗಳು",
    secure:"Supabase Auth · ಪಾಸ್‌ವರ್ಡ್ ರಹಿತ ಇಮೇಲ್ · English / ಕನ್ನಡ",
    tip:"ವಿಶ್ವಾಸಾರ್ಹ ಇಮೇಲ್ ವಿತರಣೆಗೆ Supabase Auth ನಲ್ಲಿ ಉತ್ಪಾದನಾ SMTP ಸೇವೆಯನ್ನು ಸಂರಚಿಸಬೇಕು."
  }
} as const;

export function LoginPage() {
  const db = getSupabase();
  const router = useRouter();
  const { language } = useLanguage();
  const t = copy[language];
  const [email,setEmail] = useState("");
  const [busy,setBusy] = useState(false);
  const [sent,setSent] = useState(false);
  const [error,setError] = useState("");

  useEffect(() => {
    if (!db) return;
    let alive = true;
    db.auth.getSession().then(({data}) => { if (alive && data.session) router.replace("/workspace"); });
    const {data} = db.auth.onAuthStateChange((event,session) => {
      if (alive && event === "SIGNED_IN" && session) router.replace("/workspace");
    });
    return () => { alive = false; data.subscription.unsubscribe(); };
  },[db,router]);

  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!db) return;
    setBusy(true);setError("");setSent(false);
    try {
      const {error} = await db.auth.signInWithOtp({
        email:email.trim().toLowerCase(),
        options:{emailRedirectTo:process.env.NEXT_PUBLIC_SITE_URL || window.location.origin,shouldCreateUser:true}
      });
      if(error) throw error;
      setSent(true);
    } catch {
      setError(t.failed);
    } finally {
      setBusy(false);
    }
  }

  return <main className="login-page">
    <header className="login-nav">
      <a className="landing-brand" href="/"><img src="/krishi-connect-logo.png" alt="Krishi Connect 360"/><span><b>KRISHI CONNECT 360</b><small>{language==="kn"?"ಕೃಷಿ ಆರ್ಥಿಕ ಜಾಲ":"FARM ECONOMY NETWORK"}</small></span></a>
      <LanguageSwitch/>
    </header>
    <section className="login-layout">
      <div className="login-story">
        <span className="landing-kicker"><i/>{t.eyebrow}</span>
        <h1>{t.title}</h1>
        <p>{t.body}</p>
        <div className="login-modules"><span>01 / KRISHIMARKET 360</span><span>02 / KRISHISHARE</span><span>03 / FARMLOOP</span><span>04 / KRISHITRANSIT</span></div>
        <img src="/krishi-connect-logo.png" alt="Krishi Connect 360"/>
      </div>
      <div className="login-card">
        <span className="landing-section-heading"><span>{language==="kn"?"ಸುರಕ್ಷಿತ ಖಾತೆ ಪ್ರವೇಶ":"SECURE ACCOUNT ACCESS"}</span></span>
        <h2>{language==="kn"?"ಇಮೇಲ್ ಮೂಲಕ ಮುಂದುವರಿಯಿರಿ":"Continue with email"}</h2>
        <p>{language==="kn"?"ನಿಮ್ಮ ಇಮೇಲ್‌ಗೆ ಒಂದು ಬಾರಿ ಬಳಸುವ ಸೈನ್ ಇನ್ ಲಿಂಕ್ ಕಳುಹಿಸುತ್ತೇವೆ.":"We’ll send a one-time sign-in link to your email address."}</p>
        <form onSubmit={submit}>
          <label htmlFor="login-email">{t.email}</label>
          <input id="login-email" type="email" autoComplete="email" inputMode="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/>
          <button className="landing-primary" disabled={!db||busy}>{busy?t.sending:t.send}<span>↗</span></button>
        </form>
        {!db&&<p className="login-error" role="alert">{t.noConfig}</p>}
        {error&&<p className="login-error" role="alert">{error}</p>}
        {sent&&<p className="login-success" role="status">{t.sent}</p>}
        <p className="login-note">{t.tip}</p>
        <div className="login-security">{t.secure}</div>
        <a className="login-back" href="/">{t.back} ←</a>
      </div>
    </section>
    <footer className="login-footer"><span>© 2026 KRISHI CONNECT 360</span><div><a href="/privacy">{t.privacy}</a><a href="/terms">{t.terms}</a></div></footer>
  </main>;
}
