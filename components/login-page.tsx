"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";
import { LanguageSwitch, useLanguage } from "@/components/language-provider";

type ParticipantRole = "farmer" | "buyer_trader" | "machinery_owner" | "waste_processor" | "municipality" | "transporter" | "fpo_cooperative";
const roles: { value: ParticipantRole; en: string; kn: string }[] = [
  { value: "farmer", en: "Farmer", kn: "ರೈತ" },
  { value: "buyer_trader", en: "Buyer / Trader", kn: "ಖರೀದಿದಾರ / ವ್ಯಾಪಾರಿ" },
  { value: "machinery_owner", en: "Machinery / Equipment owner", kn: "ಯಂತ್ರೋಪಕರಣ ಮಾಲೀಕ" },
  { value: "waste_processor", en: "Agricultural waste processor", kn: "ಕೃಷಿ ತ್ಯಾಜ್ಯ ಸಂಸ್ಕಾರಕ" },
  { value: "municipality", en: "Municipality / Local body", kn: "ಪುರಸಭೆ / ಸ್ಥಳೀಯ ಸಂಸ್ಥೆ" },
  { value: "transporter", en: "Transporter", kn: "ಸಾರಿಗೆದಾರ" },
  { value: "fpo_cooperative", en: "FPO / Cooperative", kn: "ರೈತ ಉತ್ಪಾದಕ ಸಂಸ್ಥೆ / ಸಹಕಾರಿ" },
];

const copy = {
  en: {
    eyebrow: "YOUR FARM ECONOMY, CONNECTED", loginTitle: "Sign in to your farm network.", signupTitle: "Create your participant account.",
    loginBody: "Use a secure, passwordless email link. No Aadhaar, bank details or payment information is requested.",
    signupBody: "Register your role and local service area. You can complete and update your profile after signing in.",
    email: "Email address", send: "Send secure sign-in link", register: "Create account and send link", sending: "Sending link…",
    sentLogin: "Sign-in link sent. Open the newest email on this device. The link expires; request a new one if needed.",
    sentSignup: "Registration link sent. Open the newest email to verify your address and activate your account.",
    failed: "We could not send the email link. Check the details and try again.", noConfig: "Account access is not configured in this deployment. Contact the pilot operator.",
    back: "Back to home", privacy: "Privacy notice", terms: "Terms of use", secure: "Supabase Auth · Passwordless email · English / ಕನ್ನಡ",
    tip: "Email delivery requires a production SMTP provider configured in Supabase Auth.", fullName: "Full name", phone: "Mobile number", role: "I am registering as", district: "District", taluk: "Taluk", village: "Village / Town", organisation: "Organisation name (if applicable)",
    login: "Already have an account? Sign in", signup: "New to Krishi Connect? Create an account", required: "Complete all required fields.",
  },
  kn: {
    eyebrow: "ನಿಮ್ಮ ಕೃಷಿ ಆರ್ಥಿಕ ಜಾಲ", loginTitle: "ನಿಮ್ಮ ಕೃಷಿ ಜಾಲಕ್ಕೆ ಸೈನ್ ಇನ್ ಮಾಡಿ.", signupTitle: "ನಿಮ್ಮ ಭಾಗವಹಿಸುವವರ ಖಾತೆ ರಚಿಸಿ.",
    loginBody: "ಸುರಕ್ಷಿತ ಪಾಸ್‌ವರ್ಡ್ ರಹಿತ ಇಮೇಲ್ ಲಿಂಕ್ ಬಳಸಿ. ಆಧಾರ್, ಬ್ಯಾಂಕ್ ವಿವರ ಅಥವಾ ಪಾವತಿ ಮಾಹಿತಿ ಕೇಳುವುದಿಲ್ಲ.",
    signupBody: "ನಿಮ್ಮ ಪಾತ್ರ ಮತ್ತು ಸ್ಥಳೀಯ ಸೇವಾ ಪ್ರದೇಶವನ್ನು ನೋಂದಾಯಿಸಿ. ಸೈನ್ ಇನ್ ಆದ ನಂತರ ಪ್ರೊಫೈಲ್ ಪೂರ್ಣಗೊಳಿಸಬಹುದು.",
    email: "ಇಮೇಲ್ ವಿಳಾಸ", send: "ಸುರಕ್ಷಿತ ಸೈನ್ ಇನ್ ಲಿಂಕ್ ಕಳುಹಿಸಿ", register: "ಖಾತೆ ರಚಿಸಿ ಮತ್ತು ಲಿಂಕ್ ಕಳುಹಿಸಿ", sending: "ಲಿಂಕ್ ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ…",
    sentLogin: "ಸೈನ್ ಇನ್ ಲಿಂಕ್ ಕಳುಹಿಸಲಾಗಿದೆ. ಈ ಸಾಧನದಲ್ಲಿನ ಹೊಸ ಇಮೇಲ್ ತೆರೆಯಿರಿ. ಲಿಂಕ್ ಅವಧಿ ಮುಗಿದರೆ ಹೊಸದನ್ನು ಕೇಳಿ.",
    sentSignup: "ನೋಂದಣಿ ಲಿಂಕ್ ಕಳುಹಿಸಲಾಗಿದೆ. ಇಮೇಲ್ ಪರಿಶೀಲಿಸಿ ಖಾತೆ ಸಕ್ರಿಯಗೊಳಿಸಲು ಹೊಸ ಸಂದೇಶ ತೆರೆಯಿರಿ.",
    failed: "ಇಮೇಲ್ ಲಿಂಕ್ ಕಳುಹಿಸಲಾಗಲಿಲ್ಲ. ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.", noConfig: "ಈ ನಿಯೋಜನೆಯಲ್ಲಿ ಖಾತೆ ಪ್ರವೇಶ ಸಂರಚಿಸಲಾಗಿಲ್ಲ. ಪೈಲಟ್ ನಿರ್ವಾಹಕರನ್ನು ಸಂಪರ್ಕಿಸಿ.",
    back: "ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ", privacy: "ಗೌಪ್ಯತಾ ಸೂಚನೆ", terms: "ಬಳಕೆಯ ನಿಯಮಗಳು", secure: "Supabase Auth · ಪಾಸ್‌ವರ್ಡ್ ರಹಿತ ಇಮೇಲ್ · English / ಕನ್ನಡ",
    tip: "ಇಮೇಲ್ ವಿತರಣೆಗೆ Supabase Auth ನಲ್ಲಿ ಉತ್ಪಾದನಾ SMTP ಸೇವೆ ಸಂರಚಿಸಬೇಕು.", fullName: "ಪೂರ್ಣ ಹೆಸರು", phone: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ", role: "ನಾನು ನೋಂದಾಯಿಸಿಕೊಳ್ಳುವುದು", district: "ಜಿಲ್ಲೆ", taluk: "ತಾಲೂಕು", village: "ಗ್ರಾಮ / ಪಟ್ಟಣ", organisation: "ಸಂಸ್ಥೆಯ ಹೆಸರು (ಅನ್ವಯಿಸಿದರೆ)",
    login: "ಈಗಾಗಲೇ ಖಾತೆ ಇದೆಯೇ? ಸೈನ್ ಇನ್ ಮಾಡಿ", signup: "Krishi Connect ಗೆ ಹೊಸಬರೇ? ಖಾತೆ ರಚಿಸಿ", required: "ಅಗತ್ಯವಿರುವ ಎಲ್ಲಾ ವಿವರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ.",
  }
} as const;

export function LoginPage({ mode = "login" }: { mode?: "login" | "signup" }) {
  const db = getSupabase();
  const router = useRouter();
  const { language } = useLanguage();
  const t = copy[language];
  const [email,setEmail] = useState("");
  const [fullName,setFullName] = useState("");
  const [phone,setPhone] = useState("");
  const [role,setRole] = useState<ParticipantRole>("farmer");
  const [district,setDistrict] = useState("Tumakuru");
  const [taluk,setTaluk] = useState("");
  const [village,setVillage] = useState("");
  const [organisation,setOrganisation] = useState("");
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
    if (mode === "signup" && (!fullName.trim() || !phone.trim() || !district.trim() || !taluk.trim() || !village.trim())) { setError(t.required); return; }
    setBusy(true);setError("");setSent(false);
    try {
      const options = mode === "signup" ? {
        emailRedirectTo: `${window.location.origin}/workspace`,
        shouldCreateUser: true,
        data: { full_name: fullName.trim(), phone: phone.trim(), participant_type: role, preferred_language: language, district: district.trim(), taluk: taluk.trim(), village: village.trim(), organization_name: organisation.trim() || null }
      } : { emailRedirectTo: `${window.location.origin}/workspace`, shouldCreateUser: false };
      const {error} = await db.auth.signInWithOtp({ email:email.trim().toLowerCase(), options });
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
        <h1>{mode === "signup" ? t.signupTitle : t.loginTitle}</h1>
        <p>{mode === "signup" ? t.signupBody : t.loginBody}</p>
        <div className="login-modules"><span>01 / KRISHIMARKET 360</span><span>02 / KRISHISHARE</span><span>03 / FARMLOOP</span><span>04 / KRISHITRANSIT</span></div>
        <img src="/krishi-connect-logo.png" alt="Krishi Connect 360"/>
      </div>
      <div className="login-card">
        <span className="landing-section-heading"><span>{language==="kn"?"ಸುರಕ್ಷಿತ ಖಾತೆ ಪ್ರವೇಶ":"SECURE ACCOUNT ACCESS"}</span></span>
        <h2>{mode === "signup" ? (language === "kn" ? "ಭಾಗವಹಿಸುವವರ ನೋಂದಣಿ" : "Participant registration") : (language==="kn"?"ಇಮೇಲ್ ಮೂಲಕ ಮುಂದುವರಿಯಿರಿ":"Continue with email")}</h2>
        <p>{mode === "signup" ? t.signupBody : (language==="kn"?"ನಿಮ್ಮ ಇಮೇಲ್‌ಗೆ ಒಂದು ಬಾರಿ ಬಳಸುವ ಸೈನ್ ಇನ್ ಲಿಂಕ್ ಕಳುಹಿಸುತ್ತೇವೆ.":"We’ll send a one-time sign-in link to your email address.")}</p>
        <form onSubmit={submit}>
          {mode === "signup" && <>
            <label>{t.fullName}<input value={fullName} onChange={e=>setFullName(e.target.value)} autoComplete="name" required minLength={2} maxLength={80}/></label>
            <label>{t.phone}<input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} autoComplete="tel" required minLength={7} maxLength={20}/></label>
            <label>{t.role}<select value={role} onChange={e=>setRole(e.target.value as ParticipantRole)}>{roles.map(item=><option key={item.value} value={item.value}>{language === "kn" ? item.kn : item.en}</option>)}</select></label>
            <div className="form-grid"><label>{t.district}<input value={district} onChange={e=>setDistrict(e.target.value)} required maxLength={80}/></label><label>{t.taluk}<input value={taluk} onChange={e=>setTaluk(e.target.value)} required maxLength={80}/></label></div>
            <label>{t.village}<input value={village} onChange={e=>setVillage(e.target.value)} required maxLength={100}/></label>
            {(role === "municipality" || role === "fpo_cooperative") && <label>{t.organisation}<input value={organisation} onChange={e=>setOrganisation(e.target.value)} maxLength={160}/></label>}
          </>}
          <label htmlFor="login-email">{t.email}</label>
          <input id="login-email" type="email" autoComplete="email" inputMode="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/>
          <button className="landing-primary" disabled={!db||busy}>{busy?t.sending:(mode === "signup" ? t.register : t.send)}<span>↗</span></button>
        </form>
        {!db&&<p className="login-error" role="alert">{t.noConfig}</p>}
        {error&&<p className="login-error" role="alert">{error}</p>}
        {sent&&<p className="login-success" role="status">{mode === "signup" ? t.sentSignup : t.sentLogin}</p>}
        <p className="login-note">{t.tip}</p>
        <div className="login-security">{t.secure}</div>
        <a className="login-back" href={mode === "signup" ? "/login" : "/signup"}>{mode === "signup" ? t.login : t.signup}</a>
        <a className="login-back" href="/">{t.back} ←</a>
      </div>
    </section>
    <footer className="login-footer"><span>© 2026 KRISHI CONNECT 360</span><div><a href="/privacy">{t.privacy}</a><a href="/terms">{t.terms}</a></div></footer>
  </main>;
}
