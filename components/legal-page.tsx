"use client";

import { useLanguage, LanguageSwitch } from "@/components/language-provider";

const contentByLanguage = {
  en: {
    privacy: {
      title:"Privacy notice", intro:"Pilot privacy information for KRISHI CONNECT 360.",
      sections:[
        ["Information stored","Account identifier, display name, self-declared participant type and language preference; listings and offers you create or receive; reports and dispute details; machinery booking history; and evidence files you upload."],
        ["Location","Machinery discovery can use browser location if you choose to share it. Provider listing coordinates are rounded before storage. Do not publish a home address or precise private location in descriptions."],
        ["How information is used","To operate marketplace discovery, offers, service bookings, participant reports, disputes and quality-review workflows. Mandi reference prices are public AGMARKNET data."],
        ["Sharing and access","Listings and their public fields can be visible to visitors. Offers, reports, disputes, bookings and evidence are restricted by account permissions and database access policies. Administrators can access records needed for moderation and review."],
        ["Payments and verification","The pilot does not process payments or verify settlement. Participant type is self-declared. Verification status is an administrative review and is not government identity, land or laboratory accreditation."],
        ["Retention and requests","A formal retention schedule and self-service account deletion flow are not yet configured. Contact the pilot operator using the contact channel supplied during onboarding for access or deletion requests. Do not upload Aadhaar, bank credentials, OTPs or unrelated identity documents."]
      ],
      caveat:"This is a pilot notice and requires legal and operational review before broad public launch.",
      terms:"Terms of use"
    },
    kn: {
      title:"ಗೌಪ್ಯತಾ ಸೂಚನೆ", intro:"KRISHI CONNECT 360 ಪೈಲಟ್‌ಗಾಗಿ ಗೌಪ್ಯತಾ ಮಾಹಿತಿ.",
      sections:[
        ["ಸಂಗ್ರಹವಾಗುವ ಮಾಹಿತಿ","ಖಾತೆ ಗುರುತು, ಪ್ರದರ್ಶನ ಹೆಸರು, ಸ್ವಯಂ ಘೋಷಿತ ಭಾಗವಹಿಸುವವರ ಪ್ರಕಾರ ಮತ್ತು ಭಾಷೆ; ನೀವು ರಚಿಸುವ ಅಥವಾ ಸ್ವೀಕರಿಸುವ ಪಟ್ಟಿಗಳು ಮತ್ತು ಕೊಡುಗೆಗಳು; ವರದಿಗಳು ಮತ್ತು ವಿವಾದಗಳು; ಯಂತ್ರೋಪಕರಣ ಬುಕಿಂಗ್ ಇತಿಹಾಸ; ಮತ್ತು ನೀವು ಅಪ್‌ಲೋಡ್ ಮಾಡುವ ಸಾಕ್ಷ್ಯ ಫೈಲ್‌ಗಳು."],
        ["ಸ್ಥಳ ಮಾಹಿತಿ","ನೀವು ಅನುಮತಿಸಿದರೆ ಯಂತ್ರೋಪಕರಣ ಹುಡುಕಾಟಕ್ಕೆ ಬ್ರೌಸರ್ ಸ್ಥಳ ಬಳಸಬಹುದು. ಪೂರೈಕೆದಾರರ ಸ್ಥಳ ನಿರ್ದೇಶಾಂಕಗಳನ್ನು ಉಳಿಸುವ ಮೊದಲು ಸುತ್ತುಗೊಳಿಸಲಾಗುತ್ತದೆ. ವಿವರಣೆಯಲ್ಲಿ ಮನೆ ವಿಳಾಸ ಅಥವಾ ನಿಖರ ಖಾಸಗಿ ಸ್ಥಳ ಪ್ರಕಟಿಸಬೇಡಿ."],
        ["ಮಾಹಿತಿಯ ಬಳಕೆ","ಮಾರುಕಟ್ಟೆ ಹುಡುಕಾಟ, ಕೊಡುಗೆಗಳು, ಸೇವಾ ಬುಕಿಂಗ್, ಭಾಗವಹಿಸುವವರ ವರದಿಗಳು, ವಿವಾದಗಳು ಮತ್ತು ಗುಣಮಟ್ಟ ಪರಿಶೀಲನೆ ನಡೆಸಲು. ಮಾರುಕಟ್ಟೆ ಉಲ್ಲೇಖ ಬೆಲೆಗಳು ಸಾರ್ವಜನಿಕ AGMARKNET ಡೇಟಾ."],
        ["ಹಂಚಿಕೆ ಮತ್ತು ಪ್ರವೇಶ","ಪಟ್ಟಿಗಳು ಮತ್ತು ಸಾರ್ವಜನಿಕ ವಿವರಗಳು ಎಲ್ಲರಿಗೂ ಕಾಣಬಹುದು. ಕೊಡುಗೆಗಳು, ವರದಿಗಳು, ವಿವಾದಗಳು, ಬುಕಿಂಗ್‌ಗಳು ಮತ್ತು ಸಾಕ್ಷ್ಯಗಳು ಖಾತೆ ಅನುಮತಿ ಹಾಗೂ ಡೇಟಾಬೇಸ್ ನೀತಿಗಳಿಂದ ನಿಯಂತ್ರಿತವಾಗಿವೆ. ಪರಿಶೀಲನೆಗೆ ಅಗತ್ಯವಿರುವ ದಾಖಲೆಗಳನ್ನು ನಿರ್ವಾಹಕರು ನೋಡಬಹುದು."],
        ["ಪಾವತಿ ಮತ್ತು ಪರಿಶೀಲನೆ","ಈ ಪೈಲಟ್ ಪಾವತಿ ಪ್ರಕ್ರಿಯೆ ಅಥವಾ ಹಣ ವರ್ಗಾವಣೆ ದೃಢೀಕರಣ ಮಾಡುವುದಿಲ್ಲ. ಭಾಗವಹಿಸುವವರ ಪ್ರಕಾರ ಸ್ವಯಂ ಘೋಷಿತ. ಪರಿಶೀಲನಾ ಸ್ಥಿತಿ ಆಡಳಿತಾತ್ಮಕ ಪರಿಶೀಲನೆ ಮಾತ್ರ; ಸರ್ಕಾರಿ ಗುರುತು, ಭೂಮಿ ಅಥವಾ ಪ್ರಯೋಗಾಲಯ ಮಾನ್ಯತೆ ಅಲ್ಲ."],
        ["ದಾಖಲೆ ಉಳಿಕೆ ಮತ್ತು ವಿನಂತಿಗಳು","ಔಪಚಾರಿಕ ದಾಖಲೆ ಉಳಿಕೆ ಅವಧಿ ಮತ್ತು ಸ್ವಯಂ ಖಾತೆ ಅಳಿಸುವಿಕೆ ಇನ್ನೂ ಸಂರಚಿಸಲಾಗಿಲ್ಲ. ಪ್ರವೇಶ ಅಥವಾ ಅಳಿಸುವಿಕೆ ವಿನಂತಿಗೆ ಆನ್‌ಬೋರ್ಡಿಂಗ್ ವೇಳೆ ನೀಡಿದ ಪೈಲಟ್ ನಿರ್ವಾಹಕರ ಸಂಪರ್ಕವನ್ನು ಬಳಸಿ. ಆಧಾರ್, ಬ್ಯಾಂಕ್ ವಿವರ, OTP ಅಥವಾ ಸಂಬಂಧವಿಲ್ಲದ ಗುರುತಿನ ದಾಖಲೆಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಬೇಡಿ."]
      ],
      caveat:"ವ್ಯಾಪಕ ಸಾರ್ವಜನಿಕ ಬಿಡುಗಡೆಗೂ ಮೊದಲು ಈ ಪೈಲಟ್ ಸೂಚನೆಗೆ ಕಾನೂನು ಮತ್ತು ಕಾರ್ಯಾಚರಣಾ ಪರಿಶೀಲನೆ ಅಗತ್ಯ.",
      terms:"ಬಳಕೆಯ ನಿಯಮಗಳು"
    }
  },
  terms: {
    en: {
      title:"Terms of use", intro:"Rules for using the KRISHI CONNECT 360 pilot.",
      sections:[
        ["Participant responsibility","You are responsible for accurate listings, lawful goods and services, safe operations, quantities, specifications, availability, prices and communications."],
        ["Offers and agreements","An offer is a proposal. An accepted offer records participant agreement in the application; it is not proof of payment, delivery, weighment, quality or settlement."],
        ["Mandi reference prices","AGMARKNET observations are reference information. They are not guaranteed prices, procurement commitments or a substitute for checking grade, quality, market fees and current conditions."],
        ["Machinery services","Bookings coordinate a requested service window. Providers and customers must agree on operator, fuel, mobilisation, safety, cancellation and completion evidence before work begins."],
        ["FarmLoop and quality","Material descriptions and quality measurements are participant-submitted unless an administrator has reviewed a report. Platform review is not laboratory accreditation or a government certificate."],
        ["Reports and disputes","The platform may review reports, restrict listings or record dispute outcomes. It is not a court, arbitrator, insurer, payment provider or emergency response service."],
        ["Availability and changes","The pilot may be unavailable or change as upstream data sources, Supabase, email delivery or hosting services change. Do not rely on it as the sole record for a commercial transaction."]
      ],
      caveat:"Use of the pilot is subject to final legal review and the applicable laws and regulations.",
      terms:"Privacy notice"
    },
    kn: {
      title:"ಬಳಕೆಯ ನಿಯಮಗಳು", intro:"KRISHI CONNECT 360 ಪೈಲಟ್ ಬಳಕೆಯ ನಿಯಮಗಳು.",
      sections:[
        ["ಭಾಗವಹಿಸುವವರ ಜವಾಬ್ದಾರಿ","ನಿಖರ ಪಟ್ಟಿಗಳು, ಕಾನೂನುಬದ್ಧ ವಸ್ತು ಮತ್ತು ಸೇವೆಗಳು, ಸುರಕ್ಷಿತ ಕಾರ್ಯಾಚರಣೆ, ಪ್ರಮಾಣ, ವಿವರಗಳು, ಲಭ್ಯತೆ, ಬೆಲೆ ಮತ್ತು ಸಂವಹನಗಳಿಗೆ ನೀವು ಜವಾಬ್ದಾರರು."],
        ["ಕೊಡುಗೆ ಮತ್ತು ಒಪ್ಪಂದ","ಕೊಡುಗೆ ಒಂದು ಪ್ರಸ್ತಾಪ. ಒಪ್ಪಿಕೊಂಡ ಕೊಡುಗೆ ಅಪ್ಲಿಕೇಶನ್‌ನಲ್ಲಿ ಭಾಗವಹಿಸುವವರ ಒಪ್ಪಂದವನ್ನು ದಾಖಲಿಸುತ್ತದೆ; ಅದು ಪಾವತಿ, ವಿತರಣೆ, ತೂಕ, ಗುಣಮಟ್ಟ ಅಥವಾ ಇತ್ಯರ್ಥದ ಸಾಕ್ಷ್ಯವಲ್ಲ."],
        ["ಮಾರುಕಟ್ಟೆ ಉಲ್ಲೇಖ ಬೆಲೆಗಳು","AGMARKNET ಮಾಹಿತಿ ಉಲ್ಲೇಖಕ್ಕಾಗಿ ಮಾತ್ರ. ಅವು ಖಚಿತ ಬೆಲೆ, ಖರೀದಿ ಬದ್ಧತೆ ಅಥವಾ ಗ್ರೇಡ್, ಗುಣಮಟ್ಟ, ಮಾರುಕಟ್ಟೆ ಶುಲ್ಕ ಮತ್ತು ಪ್ರಸ್ತುತ ಪರಿಸ್ಥಿತಿಗಳನ್ನು ಪರಿಶೀಲಿಸುವುದಕ್ಕೆ ಪರ್ಯಾಯವಲ್ಲ."],
        ["ಯಂತ್ರೋಪಕರಣ ಸೇವೆಗಳು","ಬುಕಿಂಗ್ ವಿನಂತಿಸಿದ ಸೇವಾ ಸಮಯವನ್ನು ಸಂಯೋಜಿಸುತ್ತದೆ. ಕೆಲಸ ಪ್ರಾರಂಭಿಸುವ ಮೊದಲು ಚಾಲಕ, ಇಂಧನ, ಸಾಗಣೆ, ಸುರಕ್ಷತೆ, ರದ್ದತಿ ಮತ್ತು ಪೂರ್ಣಗೊಳಿಸುವ ಸಾಕ್ಷ್ಯವನ್ನು ಪೂರೈಕೆದಾರರು ಮತ್ತು ಗ್ರಾಹಕರು ಒಪ್ಪಿಕೊಳ್ಳಬೇಕು."],
        ["ಫಾರ್ಮ್‌ಲೂಪ್ ಮತ್ತು ಗುಣಮಟ್ಟ","ನಿರ್ವಾಹಕರು ವರದಿಯನ್ನು ಪರಿಶೀಲಿಸದಿದ್ದರೆ ವಸ್ತು ವಿವರ ಮತ್ತು ಗುಣಮಟ್ಟ ಅಳತೆಗಳು ಭಾಗವಹಿಸುವವರು ಸಲ್ಲಿಸಿದವು. ವೇದಿಕೆಯ ಪರಿಶೀಲನೆ ಪ್ರಯೋಗಾಲಯ ಮಾನ್ಯತೆ ಅಥವಾ ಸರ್ಕಾರಿ ಪ್ರಮಾಣಪತ್ರವಲ್ಲ."],
        ["ವರದಿಗಳು ಮತ್ತು ವಿವಾದಗಳು","ವೇದಿಕೆ ವರದಿಗಳನ್ನು ಪರಿಶೀಲಿಸಬಹುದು, ಪಟ್ಟಿಗಳನ್ನು ನಿರ್ಬಂಧಿಸಬಹುದು ಅಥವಾ ವಿವಾದದ ಫಲಿತಾಂಶ ದಾಖಲಿಸಬಹುದು. ಇದು ನ್ಯಾಯಾಲಯ, ಮಧ್ಯಸ್ಥಿಕೆದಾರ, ವಿಮಾ ಸಂಸ್ಥೆ, ಪಾವತಿ ಪೂರೈಕೆದಾರ ಅಥವಾ ತುರ್ತು ಸೇವೆಯಲ್ಲ."],
        ["ಲಭ್ಯತೆ ಮತ್ತು ಬದಲಾವಣೆಗಳು","ಮೂಲ ಡೇಟಾ, Supabase, ಇಮೇಲ್ ಅಥವಾ ಹೋಸ್ಟಿಂಗ್ ಸೇವೆಗಳ ಬದಲಾವಣೆಯಿಂದ ಪೈಲಟ್ ತಾತ್ಕಾಲಿಕವಾಗಿ ಲಭ್ಯವಿರದಿರಬಹುದು. ವಾಣಿಜ್ಯ ವ್ಯವಹಾರದ ಏಕೈಕ ದಾಖಲೆ ಎಂದು ಇದನ್ನು ಅವಲಂಬಿಸಬೇಡಿ."]
      ],
      caveat:"ಪೈಲಟ್ ಬಳಕೆ ಅಂತಿಮ ಕಾನೂನು ಪರಿಶೀಲನೆ ಮತ್ತು ಅನ್ವಯಿಸುವ ಕಾನೂನುಗಳಿಗೆ ಒಳಪಟ್ಟಿರುತ್ತದೆ.",
      terms:"ಗೌಪ್ಯತಾ ಸೂಚನೆ"
    }
  }
} as const;

export function LegalPage({ kind }: { kind: "privacy" | "terms" }) {
  const { language } = useLanguage();
  const data = kind === "privacy" ? (language === "en" ? contentByLanguage.en.privacy : contentByLanguage.en.kn) : contentByLanguage.terms[language];
  const alternate = kind === "privacy" ? "/terms" : "/privacy";
  return <main className="legal-page">
    <header><a href="/" className="landing-brand"><img src="/krishi-connect-logo.png" alt="Krishi Connect 360"/><span><b>KRISHI CONNECT 360</b><small>FARM ECONOMY NETWORK</small></span></a><div><LanguageSwitch/><a className="landing-login" href="/workspace">{language==="kn"?"ಕಾರ್ಯಸ್ಥಳ":"Workspace"}</a></div></header>
    <article><a href="/" className="legal-back">← {language==="kn"?"ಮುಖಪುಟ":"Home"}</a><span className="landing-section-heading"><span>KRISHI CONNECT 360 / PILOT</span></span><h1>{data.title}</h1><p className="legal-intro">{data.intro}</p>
      {data.sections.map(([heading,body])=><section key={heading}><h2>{heading}</h2><p>{body}</p></section>)}
      <p className="legal-caveat">{data.caveat}</p><a className="landing-secondary" href={alternate}>{data.terms} ↗</a>
    </article>
    <footer className="landing-footer"><span>© 2026 KRISHI CONNECT 360</span><span>{language==="kn"?"ಕೃಷಿಗಾಗಿ ಪ್ರಾಯೋಗಿಕ ಡಿಜಿಟಲ್ ಜಾಲ.":"A practical digital network for agriculture."}</span></footer>
  </main>;
}
