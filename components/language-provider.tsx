"use client";

import { Fragment, createContext, useContext, useEffect, useMemo, useState, isValidElement, cloneElement, type ReactNode, type ReactElement } from "react";

type Language = "en" | "kn";
type LanguageContextValue = { language: Language; setLanguage: (language: Language) => void };
const LanguageContext = createContext<LanguageContextValue>({ language: "en", setLanguage: () => {} });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  useEffect(() => {
    const saved = window.localStorage.getItem("krishi-language");
    if (saved === "kn" || saved === "en") { setLanguageState(saved); document.documentElement.lang = saved; }
  }, []);
  const setLanguage = (next: Language) => {
    setLanguageState(next);
    window.localStorage.setItem("krishi-language", next);
    document.documentElement.lang = next;
  };
  const value = useMemo(() => ({ language, setLanguage }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() { return useContext(LanguageContext); }

const kn: Record<string, string> = {
  "Overview":"ಅವಲೋಕನ","WORKSPACE":"ಕಾರ್ಯಸ್ಥಳ","FIELD WORKSPACE":"ಕೃಷಿ ಕಾರ್ಯಸ್ಥಳ","Home":"ಮುಖಪುಟ","Market":"ಮಾರುಕಟ್ಟೆ","Share":"ಹಂಚಿಕೆ","Profile":"ಪ್ರೊಫೈಲ್",
  "KrishiMarket 360":"ಕೃಷಿಮಾರುಕಟ್ಟೆ 360","KrishiShare":"ಕೃಷಿಶೇರ್","FarmLoop":"ಫಾರ್ಮ್‌ಲೂಪ್",
  "Mandi prices":"ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳು","My activity":"ನನ್ನ ಚಟುವಟಿಕೆ","Impact ledger":"ಆರ್ಥಿಕ ಪರಿಣಾಮ",
  "Sign in":"ಸೈನ್ ಇನ್","Sign out":"ಸೈನ್ ಔಟ್","Karnataka pilot":"ಕರ್ನಾಟಕ ಪೈಲಟ್",
  "THE FARM ECONOMY, CONNECTED":"ಸಂಪರ್ಕಿತ ಕೃಷಿ ಆರ್ಥಿಕತೆ","Your farm network.":"ನಿಮ್ಮ ಕೃಷಿ ಜಾಲ.",
  "Ready for the next move.":"ಮುಂದಿನ ಹೆಜ್ಜೆಗೆ ಸಿದ್ಧ.","Find a better market, access the right equipment, and put farm by-products to use — all in one place.":"ಉತ್ತಮ ಮಾರುಕಟ್ಟೆ ಹುಡುಕಿ, ಸರಿಯಾದ ಉಪಕರಣ ಪಡೆಯಿರಿ ಮತ್ತು ಕೃಷಿ ಉಪಉತ್ಪನ್ನಗಳನ್ನು ಬಳಸಿ—ಎಲ್ಲವೂ ಒಂದೇ ಸ್ಥಳದಲ್ಲಿ.",
  "Explore marketplace":"ಮಾರುಕಟ್ಟೆ ಅನ್ವೇಷಿಸಿ","＋ Add a listing":"＋ ಪಟ್ಟಿ ಸೇರಿಸಿ",
  "ACTIVE LISTINGS":"ಸಕ್ರಿಯ ಪಟ್ಟಿಗಳು","YOUR PENDING OFFERS":"ನಿಮ್ಮ ಬಾಕಿ ಕೊಡುಗೆಗಳು","YOUR LISTINGS":"ನಿಮ್ಮ ಪಟ್ಟಿಗಳು","COMPLETED OFFERS":"ಪೂರ್ಣಗೊಂಡ ಕೊಡುಗೆಗಳು",
  "Participant-published offers":"ಭಾಗವಹಿಸುವವರು ಪ್ರಕಟಿಸಿದ ಪಟ್ಟಿಗಳು","Awaiting a response":"ಪ್ರತಿಕ್ರಿಯೆಗೆ ಕಾಯುತ್ತಿದೆ","Across all three modules":"ಮೂರು ವಿಭಾಗಗಳಲ್ಲೂ",
  "Sign in to view activity":"ಚಟುವಟಿಕೆ ನೋಡಲು ಸೈನ್ ಇನ್ ಮಾಡಿ","Sign in to manage listings":"ಪಟ್ಟಿ ನಿರ್ವಹಿಸಲು ಸೈನ್ ಇನ್ ಮಾಡಿ","Sign in to manage your farm ↗":"ನಿಮ್ಮ ಕೃಷಿ ನಿರ್ವಹಿಸಲು ಸೈನ್ ಇನ್ ಮಾಡಿ ↗",
  "THREE CONNECTED MARKETS":"ಮೂರು ಸಂಪರ್ಕಿತ ಮಾರುಕಟ್ಟೆಗಳು","What do you need today?":"ಇಂದು ನಿಮಗೆ ಏನು ಬೇಕು?","Choose a workspace to get started":"ಪ್ರಾರಂಭಿಸಲು ವಿಭಾಗ ಆಯ್ಕೆಮಾಡಿ",
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
  "Supabase authenticated session":"Supabase ದೃಢೀಕೃತ ಸೆಷನ್","Built for better local agricultural coordination.":"ಸ್ಥಳೀಯ ಕೃಷಿ ಸಂಯೋಜನೆಯನ್ನು ಉತ್ತಮಗೊಳಿಸಲು ನಿರ್ಮಿಸಲಾಗಿದೆ.",
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
  "pending":"ಬಾಕಿ","accepted":"ಒಪ್ಪಲಾಗಿದೆ","rejected":"ತಿರಸ್ಕರಿಸಲಾಗಿದೆ","withdrawn":"ಹಿಂಪಡೆಯಲಾಗಿದೆ","completed":"ಪೂರ್ಣಗೊಂಡಿದೆ","cancelled":"ರದ್ದಾಗಿದೆ","paused":"ವಿರಾಮಗೊಳಿಸಲಾಗಿದೆ","active":"ಸಕ್ರಿಯ","closed":"ಮುಚ್ಚಲಾಗಿದೆ"
};

function translateText(value: string, language: Language) {
  if (language === "en") return value;
  const leading = value.match(/^\s*/)?.[0] ?? "";
  const trailing = value.match(/\s*$/)?.[0] ?? "";
  const core = value.trim();
  const latest = core.match(/^Latest reported date: (.+)$/);
  if (latest) return leading + "ಇತ್ತೀಚಿನ ವರದಿ ದಿನಾಂಕ: " + latest[1] + trailing;
  const count = core.match(/^Showing (\\d+) of (\\d+) reported variety-day observations · latest seven calendar days · no interpolation of missing reports$/);
  if (count) return leading + `ವರದಿಯಾದ ತಳಿ-ದಿನದ ದಾಖಲೆಗಳಲ್ಲಿ ${count[1]} / ${count[2]} · ಕಳೆದ ಏಳು ಕ್ಯಾಲೆಂಡರ್ ದಿನಗಳು · ಕಾಣೆಯಾದ ವರದಿಗಳಿಗೆ ಅಂದಾಜು ಇಲ್ಲ` + trailing;
  return leading + (kn[core] ?? core) + trailing;
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
  if (typeof element.type === "string" || element.type === Fragment) {
    props.children = translateNode(element.props.children as ReactNode, language);
  }
  return cloneElement(element, props);
}

export function Localize({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  return <>{translateNode(children, language)}</>;
}

export function LanguageSwitch() {
  const { language, setLanguage } = useLanguage();
  return <button type="button" className="language-switch" onClick={() => setLanguage(language === "en" ? "kn" : "en")} aria-label="Change language">{language === "en" ? "ಕನ್ನಡ" : "English"}</button>;
}
