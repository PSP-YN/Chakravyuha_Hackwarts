"use client";

import { Fragment, createContext, useContext, useEffect, useMemo, useState, isValidElement, cloneElement, type ReactNode, type ReactElement } from "react";
import { krishiExtraKannada } from "@/components/krishi-extra-translations";
import { getSupabase } from "@/lib/supabase/client";

type Language = "en" | "kn";
type LanguageContextValue = { language: Language; setLanguage: (language: Language) => void };
const LanguageContext = createContext<LanguageContextValue>({ language: "en", setLanguage: () => {} });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  useEffect(() => {
    const saved = window.localStorage.getItem("krishi-language");
    if (saved === "kn" || saved === "en") { setLanguageState(saved); document.documentElement.lang = saved; }
    const db = getSupabase();
    if (!db) return;
    let alive = true;
    const loadProfileLanguage = async (userId: string) => {
      const { data, error } = await db.from("user_profiles").select("preferred_language").eq("user_id", userId).maybeSingle();
      if (!alive || error) return;
      const preferred = data?.preferred_language;
      if (preferred === "kn" || preferred === "en") {
        setLanguageState(preferred);
        window.localStorage.setItem("krishi-language", preferred);
        document.documentElement.lang = preferred;
      }
    };
    db.auth.getSession().then(({ data }) => {
      if (alive && data.session?.user.id) void loadProfileLanguage(data.session.user.id);
    });
    const { data } = db.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user.id;
      if (userId) window.setTimeout(() => { if (alive) void loadProfileLanguage(userId); }, 0);
    });
    return () => { alive = false; data.subscription.unsubscribe(); };
  }, []);
  const setLanguage = (next: Language) => {
    setLanguageState(next);
    window.localStorage.setItem("krishi-language", next);
    document.documentElement.lang = next;
    const db = getSupabase();
    if (db) void db.auth.getUser().then(({ data }) => {
      if (data.user) return db.from("user_profiles").update({ preferred_language: next }).eq("user_id", data.user.id);
      return null;
    });
  };
  const value = useMemo(() => ({ language, setLanguage }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() { return useContext(LanguageContext); }

const kn: Record<string, string> = {
  "Overview":"ಅವಲೋಕನ","WORKSPACE":"ಕಾರ್ಯಸ್ಥಳ","FIELD WORKSPACE":"ಕೃಷಿ ಕಾರ್ಯಸ್ಥಳ","Home":"ಮುಖಪುಟ","Market":"ಮಾರುಕಟ್ಟೆ","Share":"ಹಂಚಿಕೆ","Profile":"ಪ್ರೊಫೈಲ್",
  "KrishiMarket 360":"ಕೃಷಿಮಾರುಕಟ್ಟೆ 360","KrishiShare":"ಕೃಷಿಶೇರ್","FarmLoop":"ಫಾರ್ಮ್‌ಲೂಪ್","Storage Guardian":"ಸಂಗ್ರಹಣೆ ರಕ್ಷಕ","Krishi Guard":"ಕೃಷಿ ಗಾರ್ಡ್",
  "Mandi prices":"ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳು","My activity":"ನನ್ನ ಚಟುವಟಿಕೆ","Impact ledger":"ಆರ್ಥಿಕ ಪರಿಣಾಮ",
  "Sign in":"ಸೈನ್ ಇನ್","Sign out":"ಸೈನ್ ಔಟ್","Karnataka pilot":"ಕರ್ನಾಟಕ ಪೈಲಟ್",
  "THE FARM ECONOMY, CONNECTED":"ಸಂಪರ್ಕಿತ ಕೃಷಿ ಆರ್ಥಿಕತೆ","Your farm network.":"ನಿಮ್ಮ ಕೃಷಿ ಜಾಲ.",
  "Ready for the next move.":"ಮುಂದಿನ ಹೆಜ್ಜೆಗೆ ಸಿದ್ಧ.","Find a better market, access the right equipment, and put farm by-products to use — all in one place.":"ಉತ್ತಮ ಮಾರುಕಟ್ಟೆ ಹುಡುಕಿ, ಸರಿಯಾದ ಉಪಕರಣ ಪಡೆಯಿರಿ ಮತ್ತು ಕೃಷಿ ಉಪಉತ್ಪನ್ನಗಳನ್ನು ಬಳಸಿ—ಎಲ್ಲವೂ ಒಂದೇ ಸ್ಥಳದಲ್ಲಿ.",
  "Explore marketplace":"ಮಾರುಕಟ್ಟೆ ಅನ್ವೇಷಿಸಿ","＋ Add a listing":"＋ ಪಟ್ಟಿ ಸೇರಿಸಿ",
  "ACTIVE LISTINGS":"ಸಕ್ರಿಯ ಪಟ್ಟಿಗಳು","YOUR PENDING OFFERS":"ನಿಮ್ಮ ಬಾಕಿ ಕೊಡುಗೆಗಳು","YOUR LISTINGS":"ನಿಮ್ಮ ಪಟ್ಟಿಗಳು","COMPLETED OFFERS":"ಪೂರ್ಣಗೊಂಡ ಕೊಡುಗೆಗಳು",
  "Participant-published offers":"ಭಾಗವಹಿಸುವವರು ಪ್ರಕಟಿಸಿದ ಪಟ್ಟಿಗಳು","Awaiting a response":"ಪ್ರತಿಕ್ರಿಯೆಗೆ ಕಾಯುತ್ತಿದೆ","Across all four services":"ನಾಲ್ಕು ಸೇವೆಗಳಲ್ಲೂ",
  "Sign in to view activity":"ಚಟುವಟಿಕೆ ನೋಡಲು ಸೈನ್ ಇನ್ ಮಾಡಿ","Sign in to manage listings":"ಪಟ್ಟಿ ನಿರ್ವಹಿಸಲು ಸೈನ್ ಇನ್ ಮಾಡಿ","Sign in to manage your farm ↗":"ನಿಮ್ಮ ಕೃಷಿ ನಿರ್ವಹಿಸಲು ಸೈನ್ ಇನ್ ಮಾಡಿ ↗",
  "What do you need today?":"ಇಂದು ನಿಮಗೆ ಏನು ಬೇಕು?","Choose a workspace to get started":"ಪ್ರಾರಂಭಿಸಲು ವಿಭಾಗ ಆಯ್ಕೆಮಾಡಿ",
  "01 / TRADE PRODUCE":"01 / ಬೆಳೆ ವ್ಯಾಪಾರ","02 / SHARE EQUIPMENT":"02 / ಉಪಕರಣ ಹಂಚಿಕೆ","03 / CIRCULAR VALUE":"03 / ಮರುಬಳಕೆ ಮೌಲ್ಯ",
  "Find buyers, compare offers and calculate what remains after selling costs.":"ಖರೀದಿದಾರರನ್ನು ಹುಡುಕಿ, ಕೊಡುಗೆಗಳನ್ನು ಹೋಲಿಸಿ ಮತ್ತು ಮಾರಾಟ ವೆಚ್ಚದ ನಂತರ ಉಳಿಯುವ ಮೊತ್ತ ಲೆಕ್ಕಿಸಿ.",
  "Find machinery and services by operation, location, availability and terms.":"ಕಾರ್ಯ, ಸ್ಥಳ, ಲಭ್ಯತೆ ಮತ್ತು ನಿಯಮಗಳ ಆಧಾರದ ಮೇಲೆ ಯಂತ್ರೋಪಕರಣ ಹುಡುಕಿ.",
  "Connect usable residues with processors using clear material specifications.":"ಸ್ಪಷ್ಟ ವಸ್ತು ವಿವರಗಳೊಂದಿಗೆ ಕೃಷಿ ಅವಶೇಷಗಳನ್ನು ಸಂಸ್ಕಾರಕರೊಂದಿಗೆ ಸಂಪರ್ಕಿಸಿ.",
  "Explore produce":"ಬೆಳೆಗಳನ್ನು ಅನ್ವೇಷಿಸಿ","Find equipment":"ಉಪಕರಣ ಹುಡುಕಿ","Exchange materials":"ವಸ್ತು ವಿನಿಮಯ",
  "PARTICIPANT NETWORK / LIVE DATA":"ಭಾಗವಹಿಸುವವರ ಜಾಲ / ನೈಜ ಡೇಟಾ","Discover opportunities":"ಅವಕಾಶಗಳನ್ನು ಹುಡುಕಿ",
  "Real listings and offers from the connected database. No seeded demo inventory.":"ಸಂಪರ್ಕಿತ ಡೇಟಾಬೇಸ್‌ನ ನೈಜ ಪಟ್ಟಿಗಳು ಮತ್ತು ಕೊಡುಗೆಗಳು. ಮಾದರಿ ದಾಖಲೆಗಳಿಲ್ಲ.",
  "＋ Create listing":"＋ ಪಟ್ಟಿ ರಚಿಸಿ","↻ Refresh":"↻ ರಿಫ್ರೆಶ್","Refreshing":"ರಿಫ್ರೆಶ್ ಆಗುತ್ತಿದೆ",
  "All opportunities":"ಎಲ್ಲಾ ಅವಕಾಶಗಳು","Produce":"ಬೆಳೆ","Machinery":"ಯಂತ್ರೋಪಕರಣ","By-products":"ಉಪಉತ್ಪನ್ನಗಳು",
  "Search crop, equipment, material or place…":"ಬೆಳೆ, ಉಪಕರಣ, ವಸ್ತು ಅಥವಾ ಸ್ಥಳ ಹುಡುಕಿ…","◎ Near me":"◎ ನನ್ನ ಹತ್ತಿರ",
  "Max moisture %":"ಗರಿಷ್ಠ ತೇವಾಂಶ %","Max contamination %":"ಗರಿಷ್ಠ ಮಿಶ್ರಣ %","Minimum quantity":"ಕನಿಷ್ಠ ಪ್ರಮಾಣ",
  "Create a listing":"ಪಟ್ಟಿ ರಚಿಸಿ","One listing, one clear offer. You can manage it later.":"ಒಂದು ಪಟ್ಟಿ, ಒಂದು ಸ್ಪಷ್ಟ ಕೊಡುಗೆ. ನಂತರ ನಿರ್ವಹಿಸಬಹುದು.",
  "Listing title":"ಪಟ್ಟಿ ಶೀರ್ಷಿಕೆ","Description":"ವಿವರಣೆ","Quantity":"ಪ್ರಮಾಣ","Unit":"ಘಟಕ",
  "Asking price ₹ / unit":"ಕೇಳುವ ಬೆಲೆ ₹ / ಘಟಕ","Location":"ಸ್ಥಳ","Quality / specifications":"ಗುಣಮಟ್ಟ / ವಿವರಗಳು",
  "Publish listing":"ಪಟ್ಟಿ ಪ್ರಕಟಿಸಿ","Publishing…":"ಪ್ರಕಟಿಸಲಾಗುತ್ತಿದೆ…","No coordinates saved":"ಸ್ಥಳ ನಿರ್ದೇಶಾಂಕಗಳನ್ನು ಉಳಿಸಿಲ್ಲ",
  "Service radius (km)":"ಸೇವಾ ವ್ಯಾಪ್ತಿ (ಕಿ.ಮೀ)","Operation":"ಕಾರ್ಯ","Minimum tractor HP":"ಕನಿಷ್ಠ ಟ್ರ್ಯಾಕ್ಟರ್ HP",
  "Maximum tractor HP":"ಗರಿಷ್ಠ ಟ್ರ್ಯಾಕ್ಟರ್ HP","Implement / attachment":"ಉಪಕರಣ / ಜೋಡಣೆ","Minimum booking hours":"ಕನಿಷ್ಠ ಬುಕಿಂಗ್ ಗಂಟೆಗಳು",
  "Fuel responsibility":"ಇಂಧನ ಜವಾಬ್ದಾರಿ","Operator included?":"ಚಾಲಕ ಸೇರಿದ್ದಾರೆಯೇ?","Available from":"ಲಭ್ಯತೆ ಆರಂಭ","Available until":"ಲಭ್ಯತೆ ಅಂತ್ಯ",
  "Material type":"ವಸ್ತುವಿನ ಪ್ರಕಾರ","Moisture %":"ತೇವಾಂಶ %","Contamination %":"ಮಿಶ್ರಣ %","Collection radius (km)":"ಸಂಗ್ರಹ ವ್ಯಾಪ್ತಿ (ಕಿ.ಮೀ)",
  "List one compatible material stream per listing. Processor acceptance and lab testing are not implied.":"ಪ್ರತಿ ಪಟ್ಟಿಯಲ್ಲಿ ಒಂದೇ ರೀತಿಯ ವಸ್ತುವನ್ನು ನಮೂದಿಸಿ. ಸಂಸ್ಕಾರಕರ ಒಪ್ಪಿಗೆ ಅಥವಾ ಪ್ರಯೋಗಾಲಯ ಪರೀಕ್ಷೆ ಇದೆ ಎಂದು ಅರ್ಥವಲ್ಲ.",
  "Your listings":"ನಿಮ್ಮ ಪಟ್ಟಿಗಳು","records":"ದಾಖಲೆಗಳು","Offers & requests":"ಕೊಡುಗೆಗಳು ಮತ್ತು ವಿನಂತಿಗಳು",
  "You have not published a listing yet.":"ನೀವು ಇನ್ನೂ ಯಾವುದೇ ಪಟ್ಟಿಯನ್ನು ಪ್ರಕಟಿಸಿಲ್ಲ.","No offers yet. Offers you send or receive will appear here.":"ಇನ್ನೂ ಕೊಡುಗೆಗಳಿಲ್ಲ. ನೀವು ಕಳುಹಿಸುವ ಅಥವಾ ಸ್ವೀಕರಿಸುವ ಕೊಡುಗೆಗಳು ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ.",
  "Accept":"ಒಪ್ಪಿಕೊಳ್ಳಿ","Reject":"ತಿರಸ್ಕರಿಸಿ","Mark complete":"ಪೂರ್ಣಗೊಂಡಿದೆ ಎಂದು ಗುರುತಿಸಿ","Withdraw":"ಹಿಂಪಡೆಯಿರಿ",
  "Pause":"ವಿರಾಮಗೊಳಿಸಿ","Reactivate":"ಮತ್ತೆ ಸಕ್ರಿಯಗೊಳಿಸಿ","Close":"ಮುಚ್ಚಿ","Your listing":"ನಿಮ್ಮ ಪಟ್ಟಿ",
  "No active listings yet.":"ಇನ್ನೂ ಸಕ್ರಿಯ ಪಟ್ಟಿಗಳಿಲ್ಲ.","No matching active listings.":"ಹೊಂದಾಣಿಕೆಯ ಸಕ್ರಿಯ ಪಟ್ಟಿಗಳಿಲ್ಲ.",
  "Try another keyword or clear the search.":"ಬೇರೆ ಪದ ಹುಡುಕಿ ಅಥವಾ ಹುಡುಕಾಟ ತೆರವುಗೊಳಿಸಿ.",
  "Participant listings will appear here when farmers and service providers publish them. Sign in to add the first listing.":"ರೈತರು ಮತ್ತು ಸೇವಾ ಪೂರೈಕೆದಾರರು ಪ್ರಕಟಿಸಿದಾಗ ಪಟ್ಟಿಗಳು ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ. ಮೊದಲ ಪಟ್ಟಿ ಸೇರಿಸಲು ಸೈನ್ ಇನ್ ಮಾಡಿ.",
  "Make an offer":"ಕೊಡುಗೆ ನೀಡಿ","Sign in to respond":"ಪ್ರತಿಕ್ರಿಯಿಸಲು ಸೈನ್ ಇನ್ ಮಾಡಿ",
  "THE SHARED ECONOMIC IMPACT ENGINE":"ಹಂಚಿಕೆಯ ಆರ್ಥಿಕ ಪರಿಣಾಮ ಎಂಜಿನ್","Look beyond the asking price.":"ಕೇಳುವ ಬೆಲೆಯನ್ನು ಮೀರಿ ನೋಡಿ.",
  "See the expected amount after costs, not just the headline offer. Reference mandi prices, buyer offers and actual settled proceeds are kept separate.":"ಮುಖ್ಯ ಕೊಡುಗೆ ಮಾತ್ರವಲ್ಲ, ವೆಚ್ಚಗಳ ನಂತರದ ನಿರೀಕ್ಷಿತ ಮೊತ್ತವನ್ನೂ ನೋಡಿ. ಮಾರುಕಟ್ಟೆ ಉಲ್ಲೇಖ ಬೆಲೆ, ಖರೀದಿದಾರರ ಕೊಡುಗೆ ಮತ್ತು ನಿಜವಾಗಿ ಪಾವತಿಯಾದ ಮೊತ್ತ ಪ್ರತ್ಯೇಕವಾಗಿರುತ್ತವೆ.",
  "EXPECTED NET REALISATION":"ನಿರೀಕ್ಷಿತ ನಿವ್ವಳ ಆದಾಯ","YOUR FARM WORKSPACE":"ನಿಮ್ಮ ಕೃಷಿ ಕಾರ್ಯಸ್ಥಳ",
  "One account. Three useful markets.":"ಒಂದು ಖಾತೆ. ಮೂರು ಉಪಯುಕ್ತ ಮಾರುಕಟ್ಟೆಗಳು.",
  "Sign in with email to publish listings, respond to offers and manage your marketplace activity.":"ಪಟ್ಟಿ ಪ್ರಕಟಿಸಲು, ಕೊಡುಗೆಗಳಿಗೆ ಪ್ರತಿಕ್ರಿಯಿಸಲು ಮತ್ತು ಚಟುವಟಿಕೆ ನಿರ್ವಹಿಸಲು ಇಮೇಲ್ ಮೂಲಕ ಸೈನ್ ಇನ್ ಮಾಡಿ.",
  "Email address":"ಇಮೇಲ್ ವಿಳಾಸ","Send secure sign-in link":"ಸುರಕ್ಷಿತ ಸೈನ್ ಇನ್ ಲಿಂಕ್ ಕಳುಹಿಸಿ",
  "No password required. Email delivery depends on Supabase Auth configuration.":"ಪಾಸ್‌ವರ್ಡ್ ಅಗತ್ಯವಿಲ್ಲ. ಇಮೇಲ್ ವಿತರಣೆ Supabase Auth ಸೆಟ್ಟಿಂಗ್‌ಗಳ ಮೇಲೆ ಅವಲಂಬಿತವಾಗಿದೆ.",
  "Supabase authenticated session":"Supabase ದೃಢೀಕೃತ ಸೆಷನ್",
  "Reference prices are not guaranteed offers.":"ಉಲ್ಲೇಖ ಬೆಲೆಗಳು ಖಚಿತ ಖರೀದಿ ಕೊಡುಗೆಗಳಲ್ಲ.",
  "SUBMIT A COMMERCIAL OFFER":"ವಾಣಿಜ್ಯ ಕೊಡುಗೆ ಸಲ್ಲಿಸಿ","Offer price (₹ / unit)":"ಕೊಡುಗೆ ಬೆಲೆ (₹ / ಘಟಕ)",
  "Transport cost ₹":"ಸಾರಿಗೆ ವೆಚ್ಚ ₹","Handling cost ₹":"ನಿರ್ವಹಣಾ ವೆಚ್ಚ ₹","Commission cost ₹":"ಕಮಿಷನ್ ವೆಚ್ಚ ₹","Other costs ₹":"ಇತರೆ ವೆಚ್ಚಗಳು ₹",
  "Submit offer":"ಕೊಡುಗೆ ಸಲ್ಲಿಸಿ","Cancel":"ರದ್ದುಮಾಡಿ","Offer is a proposal, not a payment or confirmed settlement.":"ಕೊಡುಗೆ ಒಂದು ಪ್ರಸ್ತಾಪ ಮಾತ್ರ; ಪಾವತಿ ಅಥವಾ ದೃಢಪಟ್ಟ ಇತ್ಯರ್ಥವಲ್ಲ.",
  "Estimated farmer net":"ಅಂದಾಜು ರೈತರ ನಿವ್ವಳ ಆದಾಯ","Seller-marked complete":"ಮಾರಾಟಗಾರ ಪೂರ್ಣಗೊಳಿಸಿದಂತೆ ಗುರುತಿಸಿದ್ದಾರೆ",
  "Sign in to manage your farm":"ನಿಮ್ಮ ಕೃಷಿ ನಿರ್ವಹಿಸಲು ಸೈನ್ ಇನ್ ಮಾಡಿ",
  "Mandi prices,":"ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳು,",
  "from the source.":"ಮೂಲದಿಂದ.",
  "PUBLIC MARKET INTELLIGENCE / AGMARKNET 2.0":"ಸಾರ್ವಜನಿಕ ಮಾರುಕಟ್ಟೆ ಮಾಹಿತಿ / AGMARKNET 2.0",
  "Official market-reported wholesale prices. Choose a state, mandi and commodity to inspect the latest seven-day variety-wise report. These are reference prices, not buyer offers.":"ಅಧಿಕೃತ ಮಾರುಕಟ್ಟೆ ವರದಿಯ ಸಗಟು ಬೆಲೆಗಳು. ಕಳೆದ ಏಳು ದಿನಗಳ ವರದಿಯನ್ನು ನೋಡಲು ರಾಜ್ಯ, ಮಾರುಕಟ್ಟೆ ಮತ್ತು ಉತ್ಪನ್ನ ಆಯ್ಕೆಮಾಡಿ. ಇವು ಉಲ್ಲೇಖ ಬೆಲೆಗಳು ಮಾತ್ರ; ಖರೀದಿ ಕೊಡುಗೆಗಳಲ್ಲ.",
  "State":"ರಾಜ್ಯ","Commodity":"ಉತ್ಪನ್ನ","Market / mandi":"ಮಾರುಕಟ್ಟೆ / ಮಂಡಿ","Variety search":"ತಳಿ ಹುಡುಕಾಟ",
  "Source: AGMARKNET 2.0 · Government of India":"ಮೂಲ: AGMARKNET 2.0 · ಭಾರತ ಸರ್ಕಾರ",
  "Daily market reports · latest available, not guaranteed live":"ದೈನಂದಿನ ಮಾರುಕಟ್ಟೆ ವರದಿಗಳು · ಲಭ್ಯವಿರುವ ಇತ್ತೀಚಿನ ಮಾಹಿತಿ; ನೈಜ ಸಮಯದ ಖಾತರಿ ಇಲ್ಲ",
  "Open official portal ↗":"ಅಧಿಕೃತ ಪೋರ್ಟಲ್ ತೆರೆಯಿರಿ ↗","Refresh prices":"ಬೆಲೆಗಳನ್ನು ರಿಫ್ರೆಶ್ ಮಾಡಿ",
  "Loading market filters…":"ಮಾರುಕಟ್ಟೆ ಫಿಲ್ಟರ್‌ಗಳು ಲೋಡ್ ಆಗುತ್ತಿವೆ…",
  "Loading the selected mandi’s last-seven-day report…":"ಆಯ್ಕೆ ಮಾಡಿದ ಮಂಡಿಯ ಕಳೆದ ಏಳು ದಿನಗಳ ವರದಿ ಲೋಡ್ ಆಗುತ್ತಿದೆ…",
  "Choose a mandi and commodity to load the latest reported prices.":"ಇತ್ತೀಚಿನ ವರದಿ ಬೆಲೆಗಳನ್ನು ನೋಡಲು ಮಂಡಿ ಮತ್ತು ಉತ್ಪನ್ನ ಆಯ್ಕೆಮಾಡಿ.",
  "No rows match this variety filter.":"ಈ ತಳಿ ಫಿಲ್ಟರ್‌ಗೆ ಹೊಂದುವ ದಾಖಲೆಗಳಿಲ್ಲ.",
  "No price was reported for this commodity at this mandi in the last seven days.":"ಕಳೆದ ಏಳು ದಿನಗಳಲ್ಲಿ ಈ ಮಂಡಿಯಲ್ಲಿ ಈ ಉತ್ಪನ್ನಕ್ಕೆ ಬೆಲೆ ವರದಿಯಾಗಿಲ್ಲ.",
  "AGMARKNET uses NR for not reported. Missing observations are not treated as zero.":"ವರದಿಯಾಗದ ಬೆಲೆಗೆ AGMARKNET NR ಬಳಸುತ್ತದೆ. ಕಾಣೆಯಾದ ಮಾಹಿತಿಯನ್ನು ಶೂನ್ಯವೆಂದು ಪರಿಗಣಿಸುವುದಿಲ್ಲ.",
  "Arrival date":"ಆಗಮನ ದಿನಾಂಕ","Commodity / variety":"ಉತ್ಪನ್ನ / ತಳಿ","District":"ಜಿಲ್ಲೆ","Reported price":"ವರದಿಯಾದ ಬೆಲೆ",
  "Prices are reproduced from AGMARKNET market reports and can be delayed or missing for closed/non-reporting markets. Verify the grade, variety, quality, weighment, transport and fees with the market before selling. Source data is published under the Government Open Data License - India.":"AGMARKNET ವರದಿಗಳ ಬೆಲೆಗಳು ವಿಳಂಬವಾಗಿರಬಹುದು ಅಥವಾ ಮುಚ್ಚಿದ/ವರದಿ ಮಾಡದ ಮಾರುಕಟ್ಟೆಗಳಲ್ಲಿ ಲಭ್ಯವಿರದಿರಬಹುದು. ಮಾರಾಟಕ್ಕೂ ಮೊದಲು ಗ್ರೇಡ್, ತಳಿ, ಗುಣಮಟ್ಟ, ತೂಕ, ಸಾರಿಗೆ ಮತ್ತು ಶುಲ್ಕಗಳನ್ನು ಮಾರುಕಟ್ಟೆಯಲ್ಲಿ ದೃಢಪಡಿಸಿ. ಮೂಲ ಡೇಟಾ Government Open Data License - India ಅಡಿಯಲ್ಲಿ ಪ್ರಕಟಿಸಲಾಗಿದೆ.",
  "Licence ↗":"ಪರವಾನಗಿ ↗","Quintal":"ಕ್ವಿಂಟಾಲ್","Kg":"ಕೆ.ಜಿ.","Tonne":"ಟನ್","Hour":"ಗಂಟೆ","Acre":"ಎಕರೆ","Trip":"ಟ್ರಿಪ್","Lot":"ಲಾಟ್",
  "Owner / provider":"ಮಾಲೀಕ / ಪೂರೈಕೆದಾರ","Customer":"ಗ್ರಾಹಕ","Included in price":"ಬೆಲೆಯಲ್ಲಿ ಸೇರಿದೆ","To be agreed":"ಒಪ್ಪಂದದಂತೆ",
  "Yes":"ಹೌದು","No":"ಇಲ್ಲ","No description provided.":"ವಿವರಣೆ ನೀಡಿಲ್ಲ.","Operator included":"ಚಾಲಕ ಸೇರಿದ್ದಾರೆ","No operator":"ಚಾಲಕ ಇಲ್ಲ",
  "From":"ಇಂದ","Until":"ವರೆಗೆ","Min":"ಕನಿಷ್ಠ","Directions ↗":"ದಿಕ್ಕುಗಳು ↗","per":"ಪ್ರತಿ","available":"ಲಭ್ಯವಿದೆ",
  "Your activity":"ನಿಮ್ಮ ಚಟುವಟಿಕೆ","Economic impact":"ಆರ್ಥಿಕ ಪರಿಣಾಮ",
  "Near me":"ನನ್ನ ಹತ್ತಿರ","Search radius":"ಹುಡುಕಾಟ ವ್ಯಾಪ್ತಿ","Any":"ಯಾವುದಾದರೂ",
  "Grade, condition or additional specifications":"ಗ್ರೇಡ್, ಸ್ಥಿತಿ ಅಥವಾ ಹೆಚ್ಚುವರಿ ವಿವರಗಳು","e.g. Fresh ragi from this week's harvest":"ಉದಾ. ಈ ವಾರದ ಕೊಯ್ಲಿನ ತಾಜಾ ರಾಗಿ",
  "Describe the item, service or material.":"ವಸ್ತು, ಸೇವೆ ಅಥವಾ ಸಾಮಗ್ರಿಯನ್ನು ವಿವರಿಸಿ.","Village, taluk, district":"ಗ್ರಾಮ, ತಾಲೂಕು, ಜಿಲ್ಲೆ",
  "KRISHISHARE / SERVICE SPECIFICATION":"KRISHISHARE / ಸೇವಾ ವಿವರಗಳು","Capture provider location":"ಪೂರೈಕೆದಾರರ ಸ್ಥಳ ದಾಖಲಿಸಿ",
  "Rotavation, harvesting…":"ರೋಟಾವೇಟರ್ ಕೆಲಸ, ಕೊಯ್ಲು…","FARMLOOP / MATERIAL SPECIFICATION":"FARMLOOP / ವಸ್ತು ವಿವರಗಳು",
  "KrishiMarket 360 · Produce":"ಕೃಷಿಮಾರುಕಟ್ಟೆ 360 · ಬೆಳೆ","KrishiShare · Machinery service":"ಕೃಷಿಶೇರ್ · ಯಂತ್ರೋಪಕರಣ ಸೇವೆ","FarmLoop · By-product":"ಫಾರ್ಮ್‌ಲೂಪ್ · ಉಪಉತ್ಪನ್ನ",
  "Create listing":"ಪಟ್ಟಿ ರಚಿಸಿ",
  "Provider location captured. The listing stores an approximate location, rounded to about 1 km for privacy.":"ಪೂರೈಕೆದಾರರ ಸ್ಥಳ ದಾಖಲಿಸಲಾಗಿದೆ. ಗೌಪ್ಯತೆಗಾಗಿ ಸುಮಾರು 1 ಕಿ.ಮೀ. ಮಟ್ಟಕ್ಕೆ ಸುತ್ತುಗೊಳಿಸಿದ ಅಂದಾಜು ಸ್ಥಳವನ್ನಷ್ಟೇ ಉಳಿಸಲಾಗುತ್ತದೆ.",
  "Location captured. Machinery providers will be sorted by distance.":"ಸ್ಥಳ ದಾಖಲಿಸಲಾಗಿದೆ. ಯಂತ್ರೋಪಕರಣ ಪೂರೈಕೆದಾರರನ್ನು ದೂರದ ಆಧಾರದ ಮೇಲೆ ವಿಂಗಡಿಸಲಾಗುತ್ತದೆ.",
  "This browser does not provide location access.":"ಈ ಬ್ರೌಸರ್ ಸ್ಥಳ ಪ್ರವೇಶವನ್ನು ಒದಗಿಸುವುದಿಲ್ಲ.","Requesting location permission…":"ಸ್ಥಳ ಅನುಮತಿಯನ್ನು ಕೇಳಲಾಗುತ್ತಿದೆ…",
  "Location permission was denied. Enable it in browser site settings.":"ಸ್ಥಳ ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ. ಬ್ರೌಸರ್ ಸೈಟ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳಲ್ಲಿ ಸಕ್ರಿಯಗೊಳಿಸಿ.",
  "Could not determine your location. Try again in an open area.":"ನಿಮ್ಮ ಸ್ಥಳವನ್ನು ಪತ್ತೆಹಚ್ಚಲಾಗಲಿಲ್ಲ. ತೆರವಾದ ಸ್ಥಳದಲ್ಲಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
  "Check the title, category, quantity, unit and location.":"ಶೀರ್ಷಿಕೆ, ವಿಭಾಗ, ಪ್ರಮಾಣ, ಘಟಕ ಮತ್ತು ಸ್ಥಳವನ್ನು ಪರಿಶೀಲಿಸಿ.",
  "Offer quantity must be positive and cannot exceed the available listing quantity.":"ಕೊಡುಗೆ ಪ್ರಮಾಣ ಶೂನ್ಯಕ್ಕಿಂತ ಹೆಚ್ಚಿರಬೇಕು ಮತ್ತು ಲಭ್ಯವಿರುವ ಪಟ್ಟಿಯ ಪ್ರಮಾಣವನ್ನು ಮೀರಬಾರದು.",
  "Choose a future service window within the listing availability and meet its minimum duration.":"ಪಟ್ಟಿಯ ಲಭ್ಯತಾ ಅವಧಿಯೊಳಗೆ ಭವಿಷ್ಯದ ಸೇವಾ ಸಮಯವನ್ನು ಆಯ್ಕೆಮಾಡಿ ಮತ್ತು ಕನಿಷ್ಠ ಅವಧಿಯನ್ನು ಪೂರೈಸಿ.",
  "Listing published.":"ಪಟ್ಟಿ ಪ್ರಕಟಿಸಲಾಗಿದೆ.","Sign-in link sent. Open the latest email on this device to continue.":"ಸೈನ್ ಇನ್ ಲಿಂಕ್ ಕಳುಹಿಸಲಾಗಿದೆ. ಮುಂದುವರಿಸಲು ಈ ಸಾಧನದಲ್ಲಿನ ಇತ್ತೀಚಿನ ಇಮೇಲ್ ತೆರೆಯಿರಿ.",
  "Unable to send the sign-in link.":"ಸೈನ್ ಇನ್ ಲಿಂಕ್ ಕಳುಹಿಸಲಾಗಲಿಲ್ಲ.","You have been signed out.":"ನೀವು ಸೈನ್ ಔಟ್ ಆಗಿದ್ದೀರಿ.",
  "Unable to restore your sign-in session. Please sign in again.":"ಸೈನ್ ಇನ್ ಸೆಷನ್ ಮರುಸ್ಥಾಪಿಸಲಾಗಲಿಲ್ಲ. ಮತ್ತೆ ಸೈನ್ ಇನ್ ಮಾಡಿ.",
  "Unable to refresh marketplace data.":"ಮಾರುಕಟ್ಟೆ ಡೇಟಾವನ್ನು ರಿಫ್ರೆಶ್ ಮಾಡಲಾಗಲಿಲ್ಲ.","Unable to publish listing.":"ಪಟ್ಟಿ ಪ್ರಕಟಿಸಲಾಗಲಿಲ್ಲ.",
  "Unable to submit offer.":"ಕೊಡುಗೆ ಸಲ್ಲಿಸಲಾಗಲಿಲ್ಲ.","Offer submitted.":"ಕೊಡುಗೆ ಸಲ್ಲಿಸಲಾಗಿದೆ.","Offer updated.":"ಕೊಡುಗೆ ನವೀಕರಿಸಲಾಗಿದೆ.",
  "Dismiss":"ಮುಚ್ಚಿ",
  "Marketplace filters":"ಮಾರುಕಟ್ಟೆ ಫಿಲ್ಟರ್‌ಗಳು",
  "Trust & operations":"ನಂಬಿಕೆ ಮತ್ತು ಕಾರ್ಯಾಚರಣೆ","Live data connection":"ನೈಜ ಡೇಟಾ ಸಂಪರ್ಕ","Supabase workspace":"Supabase ಕಾರ್ಯಸ್ಥಳ","Configuration needed":"ಸಂರಚನೆ ಅಗತ್ಯವಿದೆ","Add Supabase environment":"Supabase ಪರಿಸರ ಸಂರಚನೆ ಸೇರಿಸಿ","Signed in":"ಸೈನ್ ಇನ್ ಆಗಿದ್ದೀರಿ","No account activity shown":"ಖಾತೆ ಚಟುವಟಿಕೆ ತೋರಿಸಲಾಗಿಲ್ಲ",
  "Search variety…":"ತಳಿ ಹುಡುಕಿ…","Filter market price varieties":"ಮಾರುಕಟ್ಟೆ ಬೆಲೆ ತಳಿಗಳನ್ನು ಫಿಲ್ಟರ್ ಮಾಡಿ","Market price request failed.":"ಮಾರುಕಟ್ಟೆ ಬೆಲೆ ವಿನಂತಿ ವಿಫಲವಾಗಿದೆ.",
  "pending":"ಬಾಕಿ","accepted":"ಒಪ್ಪಲಾಗಿದೆ","rejected":"ತಿರಸ್ಕರಿಸಲಾಗಿದೆ","withdrawn":"ಹಿಂಪಡೆಯಲಾಗಿದೆ","completed":"ಪೂರ್ಣಗೊಂಡಿದೆ","cancelled":"ರದ್ದಾಗಿದೆ","paused":"ವಿರಾಮಗೊಳಿಸಲಾಗಿದೆ","active":"ಸಕ್ರಿಯ","closed":"ಮುಚ್ಚಲಾಗಿದೆ",
  "CONTRIBUTE TO THE NETWORK":"ಜಾಲಕ್ಕೆ ಕೊಡುಗೆ ನೀಡಿ","Checking your session…":"ನಿಮ್ಮ ಸೆಷನ್ ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ…",
  "ESTIMATED FARMER NET":"ಅಂದಾಜು ರೈತರ ನಿವ್ವಳ ಆದಾಯ","Economic activity":"ಆರ್ಥಿಕ ಚಟುವಟಿಕೆ","KRISHI CONNECT":"ಕೃಷಿ ಕನೆಕ್ಟ್","KrishiMarket":"ಕೃಷಿಮಾರುಕಟ್ಟೆ",
  "LOCAL FARM":"ಸ್ಥಳೀಯ ಕೃಷಿ","Loading participant listings…":"ಭಾಗವಹಿಸುವವರ ಪಟ್ಟಿಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ…","Marketplace module":"ಮಾರುಕಟ್ಟೆ ವಿಭಾಗ","NETWORK":"ಜಾಲ",
  "P · offer price　 Q · accepted quantity　 C · farmer-borne costs":"P · ಕೊಡುಗೆ ಬೆಲೆ　 Q · ಒಪ್ಪಿಕೊಂಡ ಪ್ರಮಾಣ　 C · ರೈತ ಭರಿಸುವ ವೆಚ್ಚಗಳು",
  "PARTICIPANT-REPORTED OUTCOMES / SELLER VIEW":"ಭಾಗವಹಿಸುವವರು ವರದಿ ಮಾಡಿದ ಫಲಿತಾಂಶಗಳು / ಮಾರಾಟಗಾರರ ನೋಟ",
  "Please wait while we reconnect.":"ಮರುಸಂಪರ್ಕಿಸುವವರೆಗೆ ಕಾಯಿರಿ.","Privacy":"ಗೌಪ್ಯತೆ",
  "Requested duration (hours)":"ವಿನಂತಿಸಿದ ಅವಧಿ (ಗಂಟೆಗಳು)","Requested service start":"ವಿನಂತಿಸಿದ ಸೇವೆ ಆರಂಭ",
  "SELLER-MARKED COMPLETE":"ಮಾರಾಟಗಾರರು ಪೂರ್ಣಗೊಂಡಿದೆ ಎಂದು ಗುರುತಿಸಿದ್ದಾರೆ","Submit offer ↗":"ಕೊಡುಗೆ ಸಲ್ಲಿಸಿ ↗","Terms":"ನಿಯಮಗಳು",
  "◎ Capture provider location":"◎ ಪೂರೈಕೆದಾರರ ಸ್ಥಳ ದಾಖಲಿಸಿ",
  "Loading states, commodities and market yards from AGMARKNET…":"AGMARKNET ನಿಂದ ರಾಜ್ಯಗಳು, ಉತ್ಪನ್ನಗಳು ಮತ್ತು ಮಾರುಕಟ್ಟೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ…",
  "No markets were listed for this state in the current AGMARKNET filters.":"ಪ್ರಸ್ತುತ AGMARKNET ಫಿಲ್ಟರ್‌ಗಳಲ್ಲಿ ಈ ರಾಜ್ಯಕ್ಕೆ ಮಾರುಕಟ್ಟೆಗಳು ಪಟ್ಟಿ ಮಾಡಲಾಗಿಲ್ಲ.",
  "Refresh":"ಮರುಲೋಡ್ ಮಾಡಿ","FOUR CONNECTED SERVICES":"ನಾಲ್ಕು ಸಂಪರ್ಕಿತ ಸೇವೆಗಳು",
  "Transport services":"ಸಾರಿಗೆ ಸೇವೆಗಳು","KrishiTransit":"ಕೃಷಿಟ್ರಾನ್ಸಿಟ್","MOVE GOODS":"ಸರಕು ಸಾಗಣೆ","04 / MOVE GOODS":"04 / ಸರಕು ಸಾಗಣೆ","Transport":"ಸಾರಿಗೆ",
  "Find transport":"ಸಾರಿಗೆ ಹುಡುಕಿ","Publish vehicle capacity, pickup and destination, service radius and availability for farm goods.":"ಕೃಷಿ ಸರಕುಗಳಿಗಾಗಿ ವಾಹನ ಸಾಮರ್ಥ್ಯ, ಪಿಕಪ್, ಗಮ್ಯಸ್ಥಾನ, ಸೇವಾ ವ್ಯಾಪ್ತಿ ಮತ್ತು ಲಭ್ಯತೆ ಪ್ರಕಟಿಸಿ.",
  "Completed offers marked by sellers. These are participant-reported outcomes, not independently verified settlements.":"ಮಾರಾಟಗಾರರು ಪೂರ್ಣಗೊಂಡಿದೆ ಎಂದು ಗುರುತಿಸಿದ ಕೊಡುಗೆಗಳು. ಇವು ಭಾಗವಹಿಸುವವರು ವರದಿ ಮಾಡಿದ ಫಲಿತಾಂಶಗಳು; ಸ್ವತಂತ್ರವಾಗಿ ಪರಿಶೀಲಿಸಿದ ಪಾವತಿಗಳಲ್ಲ.",
  "Expected farmer net = offer price × accepted quantity − transport, handling, commission and other entered costs. No settlement is inferred.":"ನಿರೀಕ್ಷಿತ ರೈತ ನಿವ್ವಳ ಆದಾಯ = ಕೊಡುಗೆ ಬೆಲೆ × ಒಪ್ಪಿಕೊಂಡ ಪ್ರಮಾಣ − ಸಾರಿಗೆ, ನಿರ್ವಹಣೆ, ಕಮಿಷನ್ ಮತ್ತು ನಮೂದಿಸಿದ ಇತರ ವೆಚ್ಚಗಳು. ಪಾವತಿ ನಡೆದಿದೆ ಎಂದು ಊಹಿಸಲಾಗುವುದಿಲ್ಲ.",
  "Supabase is not configured in this deployment. Add the project URL and publishable key to activate listings and account workflows.":"ಈ ನಿಯೋಜನೆಯಲ್ಲಿ Supabase ಸಂರಚಿಸಲಾಗಿಲ್ಲ. ಪಟ್ಟಿಗಳು ಮತ್ತು ಖಾತೆ ಕಾರ್ಯಗಳನ್ನು ಸಕ್ರಿಯಗೊಳಿಸಲು ಪ್ರಾಜೆಕ್ಟ್ URL ಮತ್ತು ಪ್ರಕಟಿಸಬಹುದಾದ ಕೀಲಿಯನ್ನು ಸೇರಿಸಿ.",
  "Your participant role cannot submit an offer for this service. Use the matching module workflow.":"ನಿಮ್ಮ ಭಾಗವಹಿಸುವವರ ಪಾತ್ರದಿಂದ ಈ ಸೇವೆಗೆ ಕೊಡುಗೆ ಸಲ್ಲಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ. ಸಂಬಂಧಿತ ವಿಭಾಗದ ಕಾರ್ಯವಿಧಾನ ಬಳಸಿ.","Use the matching module workflow":"ಸಂಬಂಧಿತ ವಿಭಾಗದ ಕಾರ್ಯವಿಧಾನ ಬಳಸಿ","FarmLoop acceptance ↗":"ಫಾರ್ಮ್‌ಲೂಪ್ ಸ್ವೀಕೃತಿ ↗",


  "Choose a future transport pickup time within the listed availability.":"ಪಟ್ಟಿಯ ಲಭ್ಯತಾ ಅವಧಿಯೊಳಗಿನ ಭವಿಷ್ಯದ ಸಾರಿಗೆ ಪಿಕಪ್ ಸಮಯ ಆಯ್ಕೆಮಾಡಿ.",
  "KRISHI GUARD":"ಕೃಷಿ ಗಾರ್ಡ್","PROTECT STORED CROPS":"ಸಂಗ್ರಹಿತ ಬೆಳೆಗಳ ರಕ್ಷಣೆ",
  "Back to Krishi Connect 360":"Krishi Connect 360 ಗೆ ಹಿಂತಿರುಗಿ","STORAGE INTELLIGENCE":"ಸಂಗ್ರಹಣೆ ಮಾಹಿತಿ",
  "STORAGE CONDITION MONITOR":"ಸಂಗ್ರಹಣೆಯ ಸ್ಥಿತಿ ಮೇಲ್ವಿಚಾರಣೆ","One small device. One secure connection.":"ಒಂದು ಸಣ್ಣ ಸಾಧನ. ಒಂದು ಸುರಕ್ಷಿತ ಸಂಪರ್ಕ.",
  "Register a device":"ಸಾಧನ ನೋಂದಾಯಿಸಿ","Sensor simulator":"ಸೆನ್ಸರ್ ಸಿಮ್ಯುಲೇಟರ್","Send simulated reading ↗":"ಸಿಮ್ಯುಲೇಟೆಡ್ ಓದು ಕಳುಹಿಸಿ ↗",
  "Ambient temperature":"ಪರಿಸರ ತಾಪಮಾನ","Ambient relative humidity":"ಪರಿಸರ ಸಾಪೇಕ್ಷ ಆರ್ದ್ರತೆ","Grain-core temperature":"ಧಾನ್ಯದ ಒಳಭಾಗದ ತಾಪಮಾನ",
  "Village / storage location":"ಗ್ರಾಮ / ಸಂಗ್ರಹ ಸ್ಥಳ","Stored crop":"ಸಂಗ್ರಹಿತ ಬೆಳೆ","Storage type":"ಸಂಗ್ರಹಣೆಯ ಪ್ರಕಾರ",
  "Device name":"ಸಾಧನದ ಹೆಸರು","Register storage device ↗":"ಸಂಗ್ರಹ ಸಾಧನ ನೋಂದಾಯಿಸಿ ↗",
  "Humid":"ಆರ್ದ್ರ","Hotspot":"ಹಾಟ್‌ಸ್ಪಾಟ್","CONDITION HISTORY":"ಸ್ಥಿತಿಯ ಇತಿಹಾಸ","CONDITION HISTORY · AUTO-REFRESH 30S":"ಸ್ಥಿತಿ ಇತಿಹಾಸ · 30 ಸೆಕೆಂಡಿಗೆ ಸ್ವಯಂ ನವೀಕರಣ",
  "REGISTERED DEVICES":"ನೋಂದಾಯಿತ ಸಾಧನಗಳು","LATEST CONDITION":"ಇತ್ತೀಚಿನ ಸ್ಥಿತಿ",
  "STORAGE CONDITION INDICATOR":"ಸಂಗ್ರಹಣೆಯ ಸ್ಥಿತಿ ಸೂಚಕ","YOUR HARDWARE":"ನಿಮ್ಮ ಹಾರ್ಡ್‌ವೇರ್",
  "SOFTWARE TEST BENCH":"ಸಾಫ್ಟ್‌ವೇರ್ ಪರೀಕ್ಷಾ ವೇದಿಕೆ","ADD A HARDWARE NODE":"ಹಾರ್ಡ್‌ವೇರ್ ನೋಡ್ ಸೇರಿಸಿ",
  "LOW-COST HARDWARE":"ಕಡಿಮೆ ವೆಚ್ಚದ ಹಾರ್ಡ್‌ವೇರ್","Sign in to connect your storage device":"ಸಂಗ್ರಹ ಸಾಧನ ಸಂಪರ್ಕಿಸಲು ಸೈನ್ ಇನ್ ಮಾಡಿ",
  "Copy device key":"ಸಾಧನ ಕೀ ನಕಲಿಸಿ","Copy this device key now":"ಈ ಸಾಧನ ಕೀಯನ್ನು ಈಗ ನಕಲಿಸಿ",
  "Monitor storage":"ಸಂಗ್ರಹಣೆ ಮೇಲ್ವಿಚಾರಣೆ","Storage locations monitored":"ಮೇಲ್ವಿಚಾರಣೆಯಲ್ಲಿರುವ ಸಂಗ್ರಹ ಸ್ಥಳಗಳು",
  "Waiting for first reading":"ಮೊದಲ ಓದಿಗಾಗಿ ಕಾಯುತ್ತಿದೆ",
  "HARDWARE ADD-ON / PILOT":"ಹಾರ್ಡ್‌ವೇರ್ ಸೇರ್ಪಡೆ / ಪೈಲಟ್","KRISHI CONNECT 360 / STORAGE INTELLIGENCE":"ಕೃಷಿ ಕನೆಕ್ಟ್ 360 / ಸಂಗ್ರಹಣೆ ಮಾಹಿತಿ",
  "Monitor the microclimate around stored grain. Spot rising humidity and unusual grain-core temperature patterns before storage conditions deteriorate further.":"ಸಂಗ್ರಹಿತ ಧಾನ್ಯಗಳ ಸುತ್ತಲಿನ ತಾಪಮಾನ ಮತ್ತು ಆರ್ದ್ರತೆಯನ್ನು ಗಮನಿಸಿ. ಸಂಗ್ರಹಣೆಯ ಪರಿಸ್ಥಿತಿ ಹದಗೆಡುವ ಮೊದಲು ಹೆಚ್ಚುತ್ತಿರುವ ಆರ್ದ್ರತೆ ಮತ್ತು ಧಾನ್ಯದ ಒಳಭಾಗದ ಅಸಾಮಾನ್ಯ ತಾಪಮಾನ ಬದಲಾವಣೆಗಳನ್ನು ಗುರುತಿಸಿ.",
  "ESP32 sensor node":"ESP32 ಸೆನ್ಸರ್ ಘಟಕ","One API connection":"ಒಂದು API ಸಂಪರ್ಕ","Local alerts work offline":"ಸ್ಥಳೀಯ ಎಚ್ಚರಿಕೆಗಳು ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿಯೂ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತವೆ",
  "Checking your Krishi Connect session…":"ನಿಮ್ಮ ಕೃಷಿ ಕನೆಕ್ಟ್ ಸೆಷನ್ ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ…","Sign in to continue ↗":"ಮುಂದುವರಿಯಲು ಸೈನ್ ಇನ್ ಮಾಡಿ ↗",
  "Device ownership and readings are private to your Krishi Connect account.":"ಸಾಧನದ ಮಾಲೀಕತ್ವ ಮತ್ತು ಓದುಗಳು ನಿಮ್ಮ ಕೃಷಿ ಕನೆಕ್ಟ್ ಖಾತೆಗೆ ಮಾತ್ರ ಖಾಸಗಿಯಾಗಿರುತ್ತವೆ.",
  "Registered storage devices":"ನೋಂದಾಯಿತ ಸಂಗ್ರಹ ಸಾಧನಗಳು","GRAIN-CORE TEMPERATURE":"ಧಾನ್ಯದ ಒಳಭಾಗದ ತಾಪಮಾನ","AMBIENT RELATIVE HUMIDITY":"ಪರಿಸರದ ಸಾಪೇಕ್ಷ ಆರ್ದ್ರತೆ","Air around the stored grain":"ಸಂಗ್ರಹಿತ ಧಾನ್ಯಗಳ ಸುತ್ತಲಿನ ಗಾಳಿ",
  "No storage device registered yet.":"ಇನ್ನೂ ಯಾವುದೇ ಸಂಗ್ರಹ ಸಾಧನ ನೋಂದಾಯಿಸಿಲ್ಲ.","Register the first KRISHI GUARD node. You can test it immediately using the built-in simulator.":"ಮೊದಲ ಕೃಷಿ ಗಾರ್ಡ್ ನೋಡ್ ನೋಂದಾಯಿಸಿ. ಅಂತರ್ನಿರ್ಮಿತ ಸಿಮ್ಯುಲೇಟರ್ ಬಳಸಿ ತಕ್ಷಣ ಪರೀಕ್ಷಿಸಬಹುದು.",
  "Last contact:":"ಕೊನೆಯ ಸಂಪರ್ಕ:","This is a transparent prototype heuristic based on ambient humidity, grain-to-air temperature difference and recent temperature trend. It is not a spoilage probability or a direct grain-moisture measurement.":"ಇದು ಸುತ್ತಲಿನ ಆರ್ದ್ರತೆ, ಧಾನ್ಯ ಮತ್ತು ಗಾಳಿಯ ತಾಪಮಾನ ವ್ಯತ್ಯಾಸ ಹಾಗೂ ಇತ್ತೀಚಿನ ತಾಪಮಾನ ಪ್ರವೃತ್ತಿಯನ್ನು ಆಧರಿಸಿದ ಪಾರದರ್ಶಕ ಪ್ರೋಟೋಟೈಪ್ ಅಂದಾಜು. ಇದು ಧಾನ್ಯ ಹಾಳಾಗುವ ಸಂಭವನೀಯತೆ ಅಥವಾ ಧಾನ್ಯದ ತೇವಾಂಶದ ನೇರ ಮಾಪನವಲ್ಲ.",
  "Ambient RH":"ಪರಿಸರ RH","Core − ambient":"ಒಳಭಾಗ − ಪರಿಸರ","No readings for this device.":"ಈ ಸಾಧನಕ್ಕೆ ಇನ್ನೂ ಓದುಗಳಿಲ್ಲ.","Use the simulator below or connect the physical ESP32 node.":"ಕೆಳಗಿನ ಸಿಮ್ಯುಲೇಟರ್ ಬಳಸಿ ಅಥವಾ ನಿಜವಾದ ESP32 ನೋಡ್ ಸಂಪರ್ಕಿಸಿ.",
  "Recorded":"ದಾಖಲಿಸಿದ ಸಮಯ","Core":"ಧಾನ್ಯದ ಒಳಭಾಗ","No readings recorded.":"ಯಾವುದೇ ಓದುಗಳನ್ನು ದಾಖಲಿಸಿಲ್ಲ.",
  "Create a device identity and generate a one-time API key for its ESP32.":"ಸಾಧನದ ಗುರುತನ್ನು ರಚಿಸಿ ಮತ್ತು ಅದರ ESP32 ಗಾಗಿ ಒಂದು ಬಾರಿ ಬಳಸುವ API ಕೀ ಸೃಷ್ಟಿಸಿ.","Paddy / rice":"ಭತ್ತ / ಅಕ್ಕಿ","Maize":"ಮೆಕ್ಕೆಜೋಳ","Mixed grain":"ಮಿಶ್ರ ಧಾನ್ಯ","Bag / sack":"ಚೀಲ","Small bin":"ಸಣ್ಣ ಸಂಗ್ರಹ ಪೆಟ್ಟಿಗೆ","Silo":"ಸೈಲೋ","Storage room":"ಸಂಗ್ರಹ ಕೊಠಡಿ",
  "The database stores only its SHA-256 hash. If lost, revoke and generate a replacement.":"ಡೇಟಾಬೇಸ್ SHA-256 ಹ್ಯಾಶ್ ಮಾತ್ರ ಸಂಗ್ರಹಿಸುತ್ತದೆ. ಕೀ ಕಳೆದುಹೋದರೆ ಅದನ್ನು ರದ್ದುಮಾಡಿ ಹೊಸದನ್ನು ರಚಿಸಿ.",
  "Send clearly labelled test readings through the same backend used by the physical device.":"ನಿಜವಾದ ಸಾಧನ ಬಳಸುವ ಅದೇ ಬ್ಯಾಕೆಂಡ್ ಮೂಲಕ ಸ್ಪಷ್ಟವಾಗಿ ಪರೀಕ್ಷಾ ಡೇಟಾ ಎಂದು ಗುರುತಿಸಲಾದ ಓದುಗಳನ್ನು ಕಳುಹಿಸಿ.",
  "SIMULATED DATA · Not a physical sensor measurement":"ಸಿಮ್ಯುಲೇಟೆಡ್ ಡೇಟಾ · ನಿಜವಾದ ಸೆನ್ಸರ್ ಮಾಪನವಲ್ಲ","Storage condition indicators are advisory. They do not certify grain quality, diagnose fungal contamination, measure grain moisture or replace inspection and laboratory testing. Thresholds require local crop and storage validation.":"ಸಂಗ್ರಹಣೆಯ ಸ್ಥಿತಿ ಸೂಚಕಗಳು ಸಲಹೆಗಾಗಿ ಮಾತ್ರ. ಅವು ಧಾನ್ಯ ಗುಣಮಟ್ಟವನ್ನು ಪ್ರಮಾಣೀಕರಿಸುವುದಿಲ್ಲ, ಶಿಲೀಂಧ್ರ ಮಾಲಿನ್ಯವನ್ನು ಪತ್ತೆಹಚ್ಚುವುದಿಲ್ಲ, ಧಾನ್ಯದ ತೇವಾಂಶವನ್ನು ಅಳೆಯುವುದಿಲ್ಲ ಅಥವಾ ಪರಿಶೀಲನೆ ಮತ್ತು ಪ್ರಯೋಗಾಲಯ ಪರೀಕ್ಷೆಗೆ ಪರ್ಯಾಯವಲ್ಲ. ಮಿತಿಗಳನ್ನು ಸ್ಥಳೀಯ ಬೆಳೆ ಮತ್ತು ಸಂಗ್ರಹಣಾ ಪರಿಸ್ಥಿತಿಗಳಲ್ಲಿ ದೃಢೀಕರಿಸಬೇಕು.",
  "01 · ESP32":"01 · ESP32","02 · DHT22":"02 · DHT22","03 · DS18B20":"03 · DS18B20","04 · KRISHI CONNECT":"04 · ಕೃಷಿ ಕನೆಕ್ಟ್",
  "Reads the sensors and sends one HTTPS telemetry request.":"ಸೆನ್ಸರ್‌ಗಳನ್ನು ಓದಿ ಒಂದು HTTPS ಟೆಲಿಮೆಟ್ರಿ ವಿನಂತಿಯನ್ನು ಕಳುಹಿಸುತ್ತದೆ.","Measures ambient temperature and relative humidity near the grain store.":"ಧಾನ್ಯ ಸಂಗ್ರಹಣೆಯ ಬಳಿ ಪರಿಸರ ತಾಪಮಾನ ಮತ್ತು ಸಾಪೇಕ್ಷ ಆರ್ದ್ರತೆಯನ್ನು ಅಳೆಯುತ್ತದೆ.","Measures temperature inside a grain bag or storage core using a protected probe.":"ರಕ್ಷಿತ ಪ್ರೋಬ್ ಬಳಸಿ ಧಾನ್ಯ ಚೀಲ ಅಥವಾ ಸಂಗ್ರಹಣೆಯ ಒಳಭಾಗದ ತಾಪಮಾನವನ್ನು ಅಳೆಯುತ್ತದೆ.","Stores readings, calculates the condition indicator and shows alerts in this workspace.":"ಓದುಗಳನ್ನು ಸಂಗ್ರಹಿಸಿ, ಸ್ಥಿತಿ ಸೂಚಕವನ್ನು ಲೆಕ್ಕಿಸಿ ಮತ್ತು ಈ ಕಾರ್ಯಸ್ಥಳದಲ್ಲಿ ಎಚ್ಚರಿಕೆಗಳನ್ನು ತೋರಿಸುತ್ತದೆ.",
  "Device registered. Copy its key now; it will not be displayed again.":"ಸಾಧನ ನೋಂದಾಯಿಸಲಾಗಿದೆ. ಕೀಯನ್ನು ಈಗಲೇ ನಕಲಿಸಿ; ಮತ್ತೆ ತೋರಿಸಲಾಗುವುದಿಲ್ಲ.","Device registration failed.":"ಸಾಧನ ನೋಂದಣಿ ವಿಫಲವಾಗಿದೆ.","Register a device before sending a simulated reading.":"ಸಿಮ್ಯುಲೇಟೆಡ್ ಓದು ಕಳುಹಿಸುವ ಮೊದಲು ಸಾಧನ ನೋಂದಾಯಿಸಿ.","Simulation request failed.":"ಸಿಮ್ಯುಲೇಶನ್ ವಿನಂತಿ ವಿಫಲವಾಗಿದೆ.","Simulated sensor reading saved. This is test data, not a physical sensor measurement.":"ಸಿಮ್ಯುಲೇಟೆಡ್ ಸೆನ್ಸರ್ ಓದು ಉಳಿಸಲಾಗಿದೆ. ಇದು ಪರೀಕ್ಷಾ ಡೇಟಾ; ನಿಜವಾದ ಸೆನ್ಸರ್ ಮಾಪನವಲ್ಲ.","Never connected":"ಇನ್ನೂ ಸಂಪರ್ಕಗೊಂಡಿಲ್ಲ","No readings yet":"ಇನ್ನೂ ಓದುಗಳಿಲ್ಲ","NO DATA":"ಡೇಟಾ ಇಲ್ಲ","NORMAL":"ಸಾಮಾನ್ಯ","WATCH":"ಗಮನಿಸಿ","ACTION":"ಕ್ರಮ ಅಗತ್ಯ","URGENT":"ತುರ್ತು","PADDY":"ಭತ್ತ","RAGI":"ರಾಗಿ","MAIZE":"ಮೆಕ್ಕೆಜೋಳ","WHEAT":"ಗೋಧಿ","MIXED":"ಮಿಶ್ರ ಧಾನ್ಯ","OTHER":"ಇತರೆ","BAG":"ಚೀಲ","BIN":"ಸಂಗ್ರಹ ಪೆಟ್ಟಿಗೆ","SILO":"ಸೈಲೋ","ROOM":"ಕೊಠಡಿ","DEVICE":"ಸಾಧನ","Copied":"ನಕಲಿಸಲಾಗಿದೆ","Refreshing…":"ಮರುಲೋಡ್ ಆಗುತ್ತಿದೆ…","Registering…":"ನೋಂದಾಯಿಸಲಾಗುತ್ತಿದೆ…","Sending…":"ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ…","Select a device":"ಸಾಧನ ಆಯ್ಕೆಮಾಡಿ",
  "← Back to Krishi Connect 360":"← ಕೃಷಿ ಕನೆಕ್ಟ್ 360 ಗೆ ಹಿಂತಿರುಗಿ","Open local virtual hardware lab ↗":"ಸ್ಥಳೀಯ ವರ್ಚುವಲ್ ಹಾರ್ಡ್‌ವೇರ್ ಪ್ರಯೋಗಾಲಯ ತೆರೆಯಿರಿ ↗","KRISHI":"ಕೃಷಿ","GUARD":"ಗಾರ್ಡ್","Ragi":"ರಾಗಿ","Wheat":"ಗೋಧಿ","Other":"ಇತರೆ",
  "Revoke key":"ಕೀ ರದ್ದುಮಾಡಿ","INACTIVE":"ನಿಷ್ಕ್ರಿಯ",
  "← Krishi Connect 360":"← ಕೃಷಿ ಕನೆಕ್ಟ್ 360","LOCAL SOFTWARE SIMULATION":"ಸ್ಥಳೀಯ ಸಾಫ್ಟ್‌ವೇರ್ ಸಿಮ್ಯುಲೇಶನ್","Air":"ಗಾಳಿ","Time":"ಸಮಯ","RH":"RH","Condition index":"ಸ್ಥಿತಿ ಸೂಚ್ಯಂಕ","samples saved in this browser":"ಮಾದರಿಗಳು ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ","of":"ರಲ್ಲಿ","Launch actual ESP32 simulation in Wokwi ↗":"ನಿಜವಾದ ESP32 ಸಿಮ್ಯುಲೇಶನ್ ಅನ್ನು Wokwi ನಲ್ಲಿ ತೆರೆಯಿರಿ ↗","KRISHI CONNECT 360 / VIRTUAL HARDWARE LAB":"ಕೃಷಿ ಕನೆಕ್ಟ್ 360 / ವರ್ಚುವಲ್ ಹಾರ್ಡ್‌ವೇರ್ ಪ್ರಯೋಗಾಲಯ",
  "Virtual ESP32 grain-storage monitor. Sensor values, firmware decision logic, local alarms and telemetry are simulated entirely in this browser. No physical components or cloud connection.":"ವರ್ಚುವಲ್ ESP32 ಧಾನ್ಯ ಸಂಗ್ರಹಣೆ ಮೇಲ್ವಿಚಾರಕ. ಸೆನ್ಸರ್ ಮೌಲ್ಯಗಳು, ಫರ್ಮ್‌ವೇರ್ ನಿರ್ಧಾರ ತರ್ಕ, ಸ್ಥಳೀಯ ಎಚ್ಚರಿಕೆಗಳು ಮತ್ತು ಟೆಲಿಮೆಟ್ರಿ ಈ ಬ್ರೌಸರ್‌ನಲ್ಲೇ ಸಿಮ್ಯುಲೇಟ್ ಆಗುತ್ತವೆ. ನೈಜ ಘಟಕಗಳು ಅಥವಾ ಕ್ಲೌಡ್ ಸಂಪರ್ಕ ಇಲ್ಲ.",
  "VIRTUAL ESP32":"ವರ್ಚುವಲ್ ESP32","DHT22 MODEL":"DHT22 ಮಾದರಿ","DS18B20 MODEL":"DS18B20 ಮಾದರಿ","LOCAL DATA ONLY":"ಸ್ಥಳೀಯ ಡೇಟಾ ಮಾತ್ರ","DEVICE ONLINE · SIMULATED":"ಸಾಧನ ಆನ್‌ಲೈನ್ · ಸಿಮ್ಯುಲೇಟೆಡ್","FIRMWARE LOGIC MODEL / v1.0":"ಫರ್ಮ್‌ವೇರ್ ತರ್ಕ ಮಾದರಿ / v1.0",
  "SIMULATOR STATUS":"ಸಿಮ್ಯುಲೇಟರ್ ಸ್ಥಿತಿ","RUNNING":"ಚಾಲನೆಯಲ್ಲಿದೆ","PAUSED":"ವಿರಾಮದಲ್ಲಿದೆ","2.5 second sample interval":"2.5 ಸೆಕೆಂಡ್ ಮಾದರಿ ಅವಧಿ","CONDITION STATE":"ಸ್ಥಿತಿ ಮಟ್ಟ","Prototype condition index":"ಪ್ರೋಟೋಟೈಪ್ ಸ್ಥಿತಿ ಸೂಚ್ಯಂಕ","CONDITION INDEX":"ಸ್ಥಿತಿ ಸೂಚ್ಯಂಕ","Rule-based heuristic":"ನಿಯಮಾಧಾರಿತ ಅಂದಾಜು","GRAIN − AIR":"ಧಾನ್ಯ − ಗಾಳಿ","Temperature differential":"ತಾಪಮಾನ ವ್ಯತ್ಯಾಸ",
  "VIRTUAL SENSOR BENCH":"ವರ್ಚುವಲ್ ಸೆನ್ಸರ್ ಪರೀಕ್ಷಾ ಘಟಕ","Sensor inputs":"ಸೆನ್ಸರ್ ಇನ್‌ಪುಟ್‌ಗಳು","LIVE MODEL":"ಲೈವ್ ಮಾದರಿ","Normal":"ಸಾಮಾನ್ಯ","Humidity rising":"ಆರ್ದ್ರತೆ ಹೆಚ್ಚುತ್ತಿದೆ","Urgent hotspot":"ತುರ್ತು ಬಿಸಿ ಪ್ರದೇಶ",
  "DHT22 · Ambient temperature":"DHT22 · ಪರಿಸರ ತಾಪಮಾನ","Simulated storage-air temperature":"ಸಿಮ್ಯುಲೇಟೆಡ್ ಸಂಗ್ರಹಣಾ ಗಾಳಿಯ ತಾಪಮಾನ","DHT22 · Relative humidity":"DHT22 · ಸಾಪೇಕ್ಷ ಆರ್ದ್ರತೆ","Simulated ambient humidity":"ಸಿಮ್ಯುಲೇಟೆಡ್ ಪರಿಸರ ಆರ್ದ್ರತೆ","DS18B20 · Grain-core temperature":"DS18B20 · ಧಾನ್ಯದ ಒಳಭಾಗದ ತಾಪಮಾನ","Simulated temperature inside the grain mass":"ಧಾನ್ಯದ ಒಳಭಾಗದ ಸಿಮ್ಯುಲೇಟೆಡ್ ತಾಪಮಾನ",
  "Capture sensor reading":"ಸೆನ್ಸರ್ ಓದು ದಾಖಲಿಸಿ","Pause auto-run":"ಸ್ವಯಂಚಾಲಿತ ಚಾಲನೆ ವಿರಾಮಗೊಳಿಸಿ","Start auto-run":"ಸ್ವಯಂಚಾಲಿತ ಚಾಲನೆ ಪ್ರಾರಂಭಿಸಿ","All readings are synthetic test inputs. Thresholds are demonstration heuristics, not universal grain-safety limits.":"ಎಲ್ಲಾ ಓದುಗಳು ಕೃತಕ ಪರೀಕ್ಷಾ ಇನ್‌ಪುಟ್‌ಗಳು. ಮಿತಿಗಳು ಪ್ರದರ್ಶನಕ್ಕಾಗಿ ಮಾತ್ರ; ಎಲ್ಲ ಧಾನ್ಯಗಳಿಗೆ ಅನ್ವಯಿಸುವ ಸುರಕ್ಷತಾ ಮಿತಿಗಳಲ್ಲ.",
  "FIRMWARE DECISION OUTPUT":"ಫರ್ಮ್‌ವೇರ್ ನಿರ್ಧಾರ ಫಲಿತಾಂಶ","On-device advisory logic":"ಸಾಧನದಲ್ಲಿನ ಸಲಹಾ ತರ್ಕ","STATUS LED":"ಸ್ಥಿತಿ LED","BUZZER":"ಬಜರ್","TELEMETRY":"ಟೆಲಿಮೆಟ್ರಿ","LOCAL QUEUE":"ಸ್ಥಳೀಯ ಸರದಿ","GREEN / OFF":"ಹಸಿರು / ಆಫ್","AMBER / ON":"ಅಂಬರ್ / ಆನ್","ALARM ON":"ಅಲಾರಂ ಆನ್","SILENT":"ಧ್ವನಿ ಇಲ್ಲ",
  "VIRTUAL DEVICE":"ವರ್ಚುವಲ್ ಸಾಧನ","ESP32 DevKit model":"ESP32 DevKit ಮಾದರಿ","GPIO 15 · DHT22":"GPIO 15 · DHT22","GPIO 4 · DS18B20":"GPIO 4 · DS18B20","GPIO 2 · LED":"GPIO 2 · LED","GPIO 18 · BUZZER":"GPIO 18 · ಬಜರ್","MCU LOGIC ACTIVE":"MCU ತರ್ಕ ಸಕ್ರಿಯ","Air temp + RH":"ಗಾಳಿಯ ತಾಪಮಾನ + RH","Grain-core temp":"ಧಾನ್ಯದ ಒಳಭಾಗದ ತಾಪಮಾನ","Status indicator":"ಸ್ಥಿತಿ ಸೂಚಕ","Audible alert":"ಧ್ವನಿ ಎಚ್ಚರಿಕೆ","VIRTUAL":"ವರ್ಚುವಲ್","Simulation boundary":"ಸಿಮ್ಯುಲೇಶನ್ ಮಿತಿ","This lab models sensor acquisition and the decision logic in software. It does not execute the compiled ESP32 binary or emulate electrical behaviour.":"ಈ ಪ್ರಯೋಗಾಲಯವು ಸೆನ್ಸರ್ ಓದು ಮತ್ತು ನಿರ್ಧಾರ ತರ್ಕವನ್ನು ಸಾಫ್ಟ್‌ವೇರ್‌ನಲ್ಲಿ ಮಾದರಿಗೊಳಿಸುತ್ತದೆ. ಇದು ಕಂಪೈಲ್ ಮಾಡಿದ ESP32 ಬೈನರಿಯನ್ನು ಚಲಾಯಿಸುವುದಿಲ್ಲ ಅಥವಾ ವಿದ್ಯುತ್ ವರ್ತನೆಯನ್ನು ಅನುಕರಿಸುವುದಿಲ್ಲ.",
  "LOCAL STORAGE":"ಸ್ಥಳೀಯ ಸಂಗ್ರಹಣೆ","Telemetry history":"ಟೆಲಿಮೆಟ್ರಿ ಇತಿಹಾಸ","Clear history":"ಇತಿಹಾಸ ಅಳಿಸಿ","Grain core":"ಧಾನ್ಯದ ಒಳಭಾಗ","Δ temp":"Δ ತಾಪಮಾನ","Index":"ಸೂಚ್ಯಂಕ","Source":"ಮೂಲ","SIM":"ಸಿಮ್","No samples yet. Select a scenario and capture a reading.":"ಇನ್ನೂ ಮಾದರಿಗಳಿಲ್ಲ. ಒಂದು ಸನ್ನಿವೇಶ ಆಯ್ಕೆಮಾಡಿ ಮತ್ತು ಓದನ್ನು ದಾಖಲಿಸಿ.",
  "Ambient relative humidity is very high":"ಪರಿಸರದ ಸಾಪೇಕ್ಷ ಆರ್ದ್ರತೆ ತುಂಬಾ ಹೆಚ್ಚಾಗಿದೆ","Ambient relative humidity is elevated":"ಪರಿಸರದ ಸಾಪೇಕ್ಷ ಆರ್ದ್ರತೆ ಹೆಚ್ಚಾಗಿದೆ","Ambient relative humidity is rising":"ಪರಿಸರದ ಸಾಪೇಕ್ಷ ಆರ್ದ್ರತೆ ಏರುತ್ತಿದೆ","Grain core is much warmer than surrounding air":"ಧಾನ್ಯದ ಒಳಭಾಗವು ಸುತ್ತಲಿನ ಗಾಳಿಗಿಂತ ಹೆಚ್ಚು ಬಿಸಿಯಾಗಿದೆ","Grain core is warmer than surrounding air":"ಧಾನ್ಯದ ಒಳಭಾಗವು ಸುತ್ತಲಿನ ಗಾಳಿಗಿಂತ ಬಿಸಿಯಾಗಿದೆ","Grain core temperature is above ambient":"ಧಾನ್ಯದ ಒಳಭಾಗದ ತಾಪಮಾನ ಪರಿಸರಕ್ಕಿಂತ ಹೆಚ್ಚಾಗಿದೆ","Grain core temperature rose by at least 2 C":"ಧಾನ್ಯದ ಒಳಭಾಗದ ತಾಪಮಾನ ಕನಿಷ್ಠ 2 C ಏರಿದೆ","Grain core temperature is trending upward":"ಧಾನ್ಯದ ಒಳಭಾಗದ ತಾಪಮಾನ ಏರುತ್ತಿದೆ","Grain core temperature rose by at least 2 C in the recent comparison window":"ಇತ್ತೀಚಿನ ಹೋಲಿಕೆ ಅವಧಿಯಲ್ಲಿ ಧಾನ್ಯದ ಒಳಭಾಗದ ತಾಪಮಾನ ಕನಿಷ್ಠ 2 C ಏರಿದೆ","No configured storage-condition trigger is currently active":"ಪ್ರಸ್ತುತ ಯಾವುದೇ ಸಂಗ್ರಹಣಾ ಸ್ಥಿತಿ ಎಚ್ಚರಿಕೆ ಸಕ್ರಿಯವಾಗಿಲ್ಲ",
  "KRISHI GUARD · SOFTWARE-ONLY PROTOTYPE · DATA REMAINS IN THIS BROWSER · NOT FOR OPERATIONAL GRAIN-SAFETY DECISIONS":"ಕೃಷಿ ಗಾರ್ಡ್ · ಸಾಫ್ಟ್‌ವೇರ್ ಪ್ರೋಟೋಟೈಪ್ ಮಾತ್ರ · ಡೇಟಾ ಈ ಬ್ರೌಸರ್‌ನಲ್ಲೇ ಉಳಿಯುತ್ತದೆ · ನೈಜ ಧಾನ್ಯ ಸುರಕ್ಷತಾ ನಿರ್ಧಾರಗಳಿಗೆ ಬಳಸಬೇಡಿ",
"Device deactivated and API key revoked.":"ಸಾಧನ ನಿಷ್ಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ ಮತ್ತು API ಕೀ ರದ್ದುಪಡಿಸಲಾಗಿದೆ.","Enter a device name and storage location.":"ಸಾಧನದ ಹೆಸರು ಮತ್ತು ಸಂಗ್ರಹ ಸ್ಥಳ ನಮೂದಿಸಿ.","Unsupported crop type.":"ಬೆಳೆ ಪ್ರಕಾರ ಬೆಂಬಲಿತವಲ್ಲ.","Unsupported storage type.":"ಸಂಗ್ರಹಣೆಯ ಪ್ರಕಾರ ಬೆಂಬಲಿತವಲ್ಲ.","Device credential could not be created.":"ಸಾಧನದ ಗುರುತಿನ ಕೀ ರಚಿಸಲಾಗಲಿಲ್ಲ.","Sensor values are outside the accepted ranges.":"ಸೆನ್ಸರ್ ಮೌಲ್ಯಗಳು ಅನುಮತಿಸಲಾದ ಮಿತಿಗಳ ಹೊರಗಿವೆ.","Reading could not be saved.":"ಸೆನ್ಸರ್ ಓದನ್ನು ಉಳಿಸಲಾಗಲಿಲ್ಲ.","Storage Guardian service is temporarily unavailable.":"ಸಂಗ್ರಹಣೆ ಗಾರ್ಡ್ ಸೇವೆ ತಾತ್ಕಾಲಿಕವಾಗಿ ಲಭ್ಯವಿಲ್ಲ.","Device is inactive or unavailable.":"ಸಾಧನ ನಿಷ್ಕ್ರಿಯವಾಗಿದೆ ಅಥವಾ ಲಭ್ಯವಿಲ್ಲ.","Missing or invalid device key.":"ಸಾಧನ ಕೀ ಕಾಣೆಯಾಗಿದೆ ಅಥವಾ ಅಮಾನ್ಯವಾಗಿದೆ.","Device authentication failed.":"ಸಾಧನ ದೃಢೀಕರಣ ವಿಫಲವಾಗಿದೆ.","Device revocation failed.":"ಸಾಧನದ ಕೀ ರದ್ದುಪಡಿಸುವುದು ವಿಫಲವಾಗಿದೆ.","Device not found.":"ಸಾಧನ ಕಂಡುಬಂದಿಲ್ಲ.","Invalid device identifier.":"ಸಾಧನ ಗುರುತು ಅಮಾನ್ಯವಾಗಿದೆ.","Device could not be deactivated. Try again.":"ಸಾಧನವನ್ನು ನಿಷ್ಕ್ರಿಯಗೊಳಿಸಲಾಗಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.","Device was disabled, but key revocation needs a retry.":"ಸಾಧನ ನಿಷ್ಕ್ರಿಯವಾಗಿದೆ, ಆದರೆ ಕೀ ರದ್ದುಪಡಿಸಲು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಬೇಕು.","Readings are arriving too quickly. Wait at least five seconds between submissions.":"ಓದುಗಳು ತುಂಬಾ ವೇಗವಾಗಿ ಬರುತ್ತಿವೆ. ಪ್ರತಿ ಸಲ್ಲಿಕೆಯ ನಡುವೆ ಕನಿಷ್ಠ ಐದು ಸೆಕೆಂಡ್ ಕಾಯಿರಿ.","Telemetry rate could not be checked.":"ಟೆಲಿಮೆಟ್ರಿ ದರ ಪರಿಶೀಲಿಸಲಾಗಲಿಲ್ಲ.","Device telemetry limit reached. Try again later.":"ಸಾಧನದ ಟೆಲಿಮೆಟ್ರಿ ಮಿತಿ ತಲುಪಿದೆ. ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
  "05 / PROTECT STORED CROPS":"05 / ಸಂಗ್ರಹಿತ ಧಾನ್ಯ ರಕ್ಷಣೆ","Monitor grain-storage conditions with a low-cost connected sensor and receive early warning alerts.":"ಕಡಿಮೆ ವೆಚ್ಚದ ಸಂಪರ್ಕಿತ ಸೆನ್ಸರ್ ಮೂಲಕ ಧಾನ್ಯ ಸಂಗ್ರಹಣೆಯ ಸ್ಥಿತಿಯನ್ನು ಗಮನಿಸಿ ಮತ್ತು ಮುಂಚಿತ ಎಚ್ಚರಿಕೆ ಪಡೆಯಿರಿ.","One account. Four services. One optional hardware add-on.":"ಒಂದು ಖಾತೆ. ನಾಲ್ಕು ಸೇವೆಗಳು. ಒಂದು ಐಚ್ಛಿಕ ಹಾರ್ಡ್‌ವೇರ್ ಸೇರ್ಪಡೆ.","Built for better local agricultural coordination.":"ಸ್ಥಳೀಯ ಕೃಷಿ ಸಂಯೋಜನೆಯನ್ನು ಉತ್ತಮಗೊಳಿಸಲು ನಿರ್ಮಿಸಲಾಗಿದೆ.","AGRICULTURE NETWORK":"ಕೃಷಿ ಜಾಲ",
  "FOUR CONNECTED SERVICES + SMART STORAGE":"ನಾಲ್ಕು ಸಂಪರ್ಕಿತ ಸೇವೆಗಳು + ಸ್ಮಾರ್ಟ್ ಸಂಗ್ರಹಣೆ",
  "Listing active.":"ಪಟ್ಟಿ ಸಕ್ರಿಯವಾಗಿದೆ.","Listing paused.":"ಪಟ್ಟಿಗೆ ವಿರಾಮ ನೀಡಲಾಗಿದೆ.","Listing closed.":"ಪಟ್ಟಿ ಮುಚ್ಚಲಾಗಿದೆ.",
  "Supabase secured":"Supabase ಸುರಕ್ಷಿತ",
  "FARM ECONOMY NETWORK":"ಕೃಷಿ ಆರ್ಥಿಕ ಜಾಲ",
  "Vehicle type":"ವಾಹನದ ಪ್ರಕಾರ","Load capacity (tonnes)":"ಸಾಗಣೆ ಸಾಮರ್ಥ್ಯ (ಟನ್)","Pickup / origin":"ಪಿಕಪ್ / ಆರಂಭಿಕ ಸ್ಥಳ",
  "Destination / service area":"ಗಮ್ಯಸ್ಥಾನ / ಸೇವಾ ಪ್ರದೇಶ",
  "Requested pickup time":"ಕೋರಿದ ಪಿಕಪ್ ಸಮಯ","Pickup location":"ಪಿಕಪ್ ಸ್ಥಳ","Destination":"ಗಮ್ಯಸ್ಥಾನ","Loading responsibility":"ಲೋಡ್ ಮಾಡುವ ಜವಾಬ್ದಾರಿ","Unloading responsibility":"ಅನ್‌ಲೋಡ್ ಮಾಡುವ ಜವಾಬ್ದಾರಿ","Requester":"ವಿನಂತಿದಾರರು","Transporter":"ಸಾರಿಗೆದಾರರು","Shared":"ಹಂಚಿಕೆ",
  "KRISHITRANSIT / VEHICLE & ROUTE DETAILS":"ಕೃಷಿಟ್ರಾನ್ಸಿಟ್ / ವಾಹನ ಮತ್ತು ಮಾರ್ಗದ ವಿವರಗಳು",
  "Mini truck, tractor trailer, lorry…":"ಮಿನಿ ಟ್ರಕ್, ಟ್ರ್ಯಾಕ್ಟರ್ ಟ್ರೇಲರ್, ಲಾರಿ…",
  "Confirm load limits, route permits, loading responsibility, insurance and delivery conditions before accepting any job.":"ಯಾವುದೇ ಕೆಲಸ ಒಪ್ಪುವ ಮೊದಲು ಸರಕು ಮಿತಿ, ಮಾರ್ಗ ಪರವಾನಗಿ, ಲೋಡ್ ಮಾಡುವ ಜವಾಬ್ದಾರಿ, ವಿಮೆ ಮತ್ತು ವಿತರಣಾ ಷರತ್ತುಗಳನ್ನು ದೃಢಪಡಿಸಿ."
};

function translateText(value: string, language: Language) {
  if (language === "en") return value;
  const leading = value.match(/^\s*/)?.[0] ?? "";
  const trailing = value.match(/\s*$/)?.[0] ?? "";
  const core = value.trim();
  const latest = core.match(/^Latest reported date: (.+)$/);
  if (latest) return leading + "ಇತ್ತೀಚಿನ ವರದಿ ದಿನಾಂಕ: " + latest[1] + trailing;
  const contact = core.match(/^Last contact: (.+)$/);
  if (contact) return leading + "ಕೊನೆಯ ಸಂಪರ್ಕ: " + (kn[contact[1]] ?? contact[1]) + trailing;
  const index = core.match(/^Condition index (\d+)\/100$/);
  if (index) return leading + `ಸ್ಥಿತಿ ಸೂಚ್ಯಂಕ ${index[1]}/100` + trailing;
  const samples = core.match(/^(\d+) samples saved in this browser$/);
  if (samples) return leading + `ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ${samples[1]} ಮಾದರಿಗಳು ಉಳಿಸಲಾಗಿದೆ` + trailing;
  const count = core.match(/^Showing (\d+) of (\d+) reported variety-day observations · latest seven calendar days · no interpolation of missing reports$/);
  if (count) return leading + `ವರದಿಯಾದ ತಳಿ-ದಿನದ ದಾಖಲೆಗಳಲ್ಲಿ ${count[1]} / ${count[2]} · ಕಳೆದ ಏಳು ಕ್ಯಾಲೆಂಡರ್ ದಿನಗಳು · ಕಾಣೆಯಾದ ವರದಿಗಳಿಗೆ ಅಂದಾಜು ಇಲ್ಲ` + trailing;
  return leading + (kn[core] ?? krishiExtraKannada[core] ?? core) + trailing;
}

function translateNode(node: ReactNode, language: Language): ReactNode {
  if (typeof node === "string") return translateText(node, language);
  if (Array.isArray(node)) return node.map((child) => translateNode(child, language));
  if (!isValidElement(node)) return node;
  const element = node as ReactElement<Record<string, unknown>>;
  const props = { ...element.props };
  for (const key of ["placeholder","title","aria-label","alt"]) {
    if (typeof props[key] === "string") props[key] = translateText(props[key] as string, language);
  }
  // Traverse custom components too, so Next.js Link and other wrappers do not
  // leave their visible child text untranslated. Components without children
  // remain unchanged.
  props.children = translateNode(element.props.children as ReactNode, language);
  return cloneElement(element, props);
}

export function Localize({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  return <>{translateNode(children, language)}</>;
}

let activeGuideAudio: HTMLAudioElement | null = null;
let activeGuideAudioId: string | null = null;

export function AudioGuideButton({ guide, compact = false }: { guide: string; compact?: boolean }) {
  const { language } = useLanguage();
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");
  const play = () => {
    const guideId = guide + "-" + language;
    if (activeGuideAudio && activeGuideAudioId === guideId && !activeGuideAudio.paused) {
      activeGuideAudio.pause();
      activeGuideAudio.currentTime = 0;
      activeGuideAudio = null;
      activeGuideAudioId = null;
      setPlaying(false);
      return;
    }
    activeGuideAudio?.pause();
    const audio = new Audio("/audio/guides/" + guideId + ".mp3");
    activeGuideAudio = audio;
    activeGuideAudioId = guideId;
    audio.onplay = () => { setPlaying(true); setError(""); };
    audio.onpause = () => setPlaying(false);
    audio.onended = () => { setPlaying(false); if (activeGuideAudio === audio) { activeGuideAudio = null; activeGuideAudioId = null; } };
    audio.onerror = () => { setPlaying(false); setError(language === "kn" ? "ಆಡಿಯೊ ಲೋಡ್ ಆಗಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ." : "Audio could not be loaded. Try again."); };
    void audio.play().catch(() => { setPlaying(false); setError(language === "kn" ? "ಆಡಿಯೊ ಪ್ಲೇ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ." : "Audio playback could not start."); });
  };
  return <span className="audio-guide-control">
    <button type="button" className={"language-switch voice-switch" + (compact ? " compact" : "")} onClick={play} aria-label={playing ? (language === "kn" ? "ಆಡಿಯೊ ನಿಲ್ಲಿಸಿ" : "Stop audio guide") : (language === "kn" ? "ಸೂಚನೆಗಳನ್ನು ಕೇಳಿ" : "Listen to instructions")}>{playing ? (language === "kn" ? "■ ನಿಲ್ಲಿಸಿ" : "■ Stop") : "▶ " + (language === "kn" ? "ಸೂಚನೆಗಳನ್ನು ಕೇಳಿ" : "Listen")}</button>
    {error && <span className="voice-status" role="status">{error}</span>}
  </span>;
}

export function LanguageSwitch() {
  const { language, setLanguage } = useLanguage();
  return <span className="language-controls">
    <button type="button" className="language-switch" onClick={() => { activeGuideAudio?.pause(); activeGuideAudio = null; activeGuideAudioId = null; setLanguage(language === "en" ? "kn" : "en"); }} aria-label={language === "kn" ? "ಭಾಷೆ ಬದಲಾಯಿಸಿ" : "Change language"}>{language === "en" ? "ಕನ್ನಡ" : "English"}</button>
    <AudioGuideButton guide="portal" />
  </span>;
}
