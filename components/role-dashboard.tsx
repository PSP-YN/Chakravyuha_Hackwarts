"use client";

import { AudioGuideButton, useLanguage } from "@/components/language-provider";

const roleContent = {
  farmer: {
    en: ["Farmer workspace", "Publish produce, compare mandi reference prices, find machinery and decide whether residues can be reused or collected.", ["Publish a listing", "Check mandi prices", "Waste guidance"]],
    kn: ["ರೈತ ಕಾರ್ಯಸ್ಥಳ", "ಬೆಳೆ ಪಟ್ಟಿ ಪ್ರಕಟಿಸಿ, ಮಂಡಿ ಉಲ್ಲೇಖ ಬೆಲೆಗಳನ್ನು ಹೋಲಿಸಿ, ಯಂತ್ರೋಪಕರಣ ಹುಡುಕಿ ಮತ್ತು ಅವಶೇಷಗಳನ್ನು ಮರುಬಳಕೆ ಅಥವಾ ಸಂಗ್ರಹಕ್ಕೆ ಕಳುಹಿಸುವುದನ್ನು ನಿರ್ಧರಿಸಿ.", ["ಪಟ್ಟಿ ಪ್ರಕಟಿಸಿ", "ಮಂಡಿ ಬೆಲೆ ನೋಡಿ", "ತ್ಯಾಜ್ಯ ಮಾರ್ಗದರ್ಶನ"]]
  },
  buyer_trader: {
    en: ["Buyer & trader workspace", "Discover active produce listings, submit commercial offers, review farmer net-realisation estimates and raise a dispute when a transaction has an issue.", ["Browse produce", "Review activity", "Open trust tools"]],
    kn: ["ಖರೀದಿದಾರ ಮತ್ತು ವ್ಯಾಪಾರಿ ಕಾರ್ಯಸ್ಥಳ", "ಸಕ್ರಿಯ ಬೆಳೆ ಪಟ್ಟಿಗಳನ್ನು ಹುಡುಕಿ, ವಾಣಿಜ್ಯ ಕೊಡುಗೆ ಸಲ್ಲಿಸಿ, ರೈತರ ನಿವ್ವಳ ಆದಾಯದ ಅಂದಾಜು ನೋಡಿ ಮತ್ತು ಸಮಸ್ಯೆಯಿದ್ದರೆ ವಿವಾದ ದಾಖಲಿಸಿ.", ["ಬೆಳೆ ಹುಡುಕಿ", "ಚಟುವಟಿಕೆ ನೋಡಿ", "ನಂಬಿಕೆ ಸಾಧನಗಳು"]]
  },
  buyer: {
    en: ["Buyer workspace", "Discover listings, submit offers and coordinate transaction details with the listing owner.", ["Browse listings", "Review activity", "Trust tools"]],
    kn: ["ಖರೀದಿದಾರ ಕಾರ್ಯಸ್ಥಳ", "ಪಟ್ಟಿಗಳನ್ನು ಹುಡುಕಿ, ಕೊಡುಗೆ ಸಲ್ಲಿಸಿ ಮತ್ತು ಪಟ್ಟಿ ಮಾಲೀಕರೊಂದಿಗೆ ವಹಿವಾಟಿನ ವಿವರಗಳನ್ನು ಸಂಯೋಜಿಸಿ.", ["ಪಟ್ಟಿ ಹುಡುಕಿ", "ಚಟುವಟಿಕೆ ನೋಡಿ", "ನಂಬಿಕೆ ಸಾಧನಗಳು"]]
  },
  machinery_owner: {
    en: ["Machinery & equipment owner workspace", "Publish equipment with HP, implement, operator, fuel and availability terms. Manage accepted bookings, rescheduling, cancellation and job evidence.", ["Publish equipment", "Manage bookings", "Review evidence"]],
    kn: ["ಯಂತ್ರೋಪಕರಣ ಮಾಲೀಕರ ಕಾರ್ಯಸ್ಥಳ", "HP, ಉಪಕರಣ, ಚಾಲಕ, ಇಂಧನ ಮತ್ತು ಲಭ್ಯತಾ ಷರತ್ತುಗಳೊಂದಿಗೆ ಯಂತ್ರೋಪಕರಣ ಪ್ರಕಟಿಸಿ. ಒಪ್ಪಿಕೊಂಡ ಬುಕಿಂಗ್, ಮರುನಿಗದಿ, ರದ್ದು ಮತ್ತು ಕೆಲಸದ ಸಾಕ್ಷ್ಯ ನಿರ್ವಹಿಸಿ.", ["ಯಂತ್ರೋಪಕರಣ ಪ್ರಕಟಿಸಿ", "ಬುಕಿಂಗ್ ನಿರ್ವಹಿಸಿ", "ಸಾಕ್ಷ್ಯ ಪರಿಶೀಲಿಸಿ"]]
  },
  provider: {
    en: ["Machinery provider workspace", "Publish equipment and manage accepted machinery service bookings, rescheduling, cancellation and job evidence.", ["Publish equipment", "Manage bookings", "Trust tools"]],
    kn: ["ಯಂತ್ರೋಪಕರಣ ಪೂರೈಕೆದಾರರ ಕಾರ್ಯಸ್ಥಳ", "ಯಂತ್ರೋಪಕರಣ ಪ್ರಕಟಿಸಿ ಮತ್ತು ಒಪ್ಪಿಕೊಂಡ ಸೇವಾ ಬುಕಿಂಗ್, ಮರುನಿಗದಿ, ರದ್ದು ಮತ್ತು ಕೆಲಸದ ಸಾಕ್ಷ್ಯ ನಿರ್ವಹಿಸಿ.", ["ಯಂತ್ರೋಪಕರಣ ಪ್ರಕಟಿಸಿ", "ಬುಕಿಂಗ್ ನಿರ್ವಹಿಸಿ", "ನಂಬಿಕೆ ಸಾಧನಗಳು"]]
  },
  waste_processor: {
    en: ["Waste processor workspace", "Review by-product specifications, send a processor acceptance request and submit test records. Lab results remain pending until independently reviewed.", ["Browse FarmLoop", "Submit acceptance", "Quality records"]],
    kn: ["ತ್ಯಾಜ್ಯ ಸಂಸ್ಕಾರಕರ ಕಾರ್ಯಸ್ಥಳ", "ಉಪಉತ್ಪನ್ನ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ, ಸಂಸ್ಕಾರಕ ಸ್ವೀಕೃತಿ ವಿನಂತಿ ಕಳುಹಿಸಿ ಮತ್ತು ಪರೀಕ್ಷಾ ದಾಖಲೆ ಸಲ್ಲಿಸಿ. ಪ್ರಯೋಗಾಲಯದ ಫಲಿತಾಂಶಗಳು ಸ್ವತಂತ್ರ ಪರಿಶೀಲನೆಯವರೆಗೆ ಬಾಕಿಯಲ್ಲಿರುತ್ತವೆ.", ["ಫಾರ್ಮ್‌ಲೂಪ್ ಹುಡುಕಿ", "ಸ್ವೀಕೃತಿ ಸಲ್ಲಿಸಿ", "ಗುಣಮಟ್ಟ ದಾಖಲೆ"]]
  },
  processor: {
    en: ["Processor workspace", "Review by-product specifications and submit a processor acceptance request. Quality records require independent review.", ["Browse FarmLoop", "Submit acceptance", "Quality records"]],
    kn: ["ಸಂಸ್ಕಾರಕರ ಕಾರ್ಯಸ್ಥಳ", "ಉಪಉತ್ಪನ್ನ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಸ್ವೀಕೃತಿ ವಿನಂತಿ ಕಳುಹಿಸಿ. ಗುಣಮಟ್ಟ ದಾಖಲೆಗಳಿಗೆ ಸ್ವತಂತ್ರ ಪರಿಶೀಲನೆ ಅಗತ್ಯ.", ["ಫಾರ್ಮ್‌ಲೂಪ್ ಹುಡುಕಿ", "ಸ್ವೀಕೃತಿ ಸಲ್ಲಿಸಿ", "ಗುಣಮಟ್ಟ ದಾಖಲೆ"]]
  },
  municipality: {
    en: ["Municipality & local-body workspace", "Review farm-waste guidance and use the published contact directory. Only platform administrators can publish contacts after checking an official source.", ["Waste guidance", "Municipal contacts", "Account history"]],
    kn: ["ಪುರಸಭೆ ಮತ್ತು ಸ್ಥಳೀಯ ಸಂಸ್ಥೆ ಕಾರ್ಯಸ್ಥಳ", "ಕೃಷಿ ತ್ಯಾಜ್ಯ ಮಾರ್ಗದರ್ಶನ ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಪ್ರಕಟಿತ ಸಂಪರ್ಕ ಡೈರೆಕ್ಟರಿ ಬಳಸಿ. ಅಧಿಕೃತ ಮೂಲ ಪರಿಶೀಲಿಸಿದ ನಂತರ ವೇದಿಕೆ ನಿರ್ವಾಹಕರು ಮಾತ್ರ ಸಂಪರ್ಕಗಳನ್ನು ಪ್ರಕಟಿಸಬಹುದು.", ["ತ್ಯಾಜ್ಯ ಮಾರ್ಗದರ್ಶನ", "ಪುರಸಭೆ ಸಂಪರ್ಕ", "ಖಾತೆ ಇತಿಹಾಸ"]]
  },
  transporter: {
    en: ["Transporter workspace", "Use active listings to identify pickup and delivery opportunities. Confirm route, load, vehicle suitability, price and responsibility directly before accepting a job.", ["Browse opportunities", "Review activity", "Trust tools"]],
    kn: ["ಸಾರಿಗೆದಾರರ ಕಾರ್ಯಸ್ಥಳ", "ಪಿಕಪ್ ಮತ್ತು ವಿತರಣಾ ಅವಕಾಶಗಳನ್ನು ಹುಡುಕಲು ಸಕ್ರಿಯ ಪಟ್ಟಿಗಳನ್ನು ಬಳಸಿ. ಕೆಲಸ ಒಪ್ಪುವ ಮೊದಲು ಮಾರ್ಗ, ಸರಕು, ವಾಹನ ಸೂಕ್ತತೆ, ಬೆಲೆ ಮತ್ತು ಜವಾಬ್ದಾರಿಯನ್ನು ನೇರವಾಗಿ ದೃಢಪಡಿಸಿ.", ["ಅವಕಾಶಗಳನ್ನು ಹುಡುಕಿ", "ಚಟುವಟಿಕೆ ನೋಡಿ", "ನಂಬಿಕೆ ಸಾಧನಗಳು"]]
  },
  fpo_cooperative: {
    en: ["FPO & cooperative workspace", "Coordinate member produce listings, compare offers, track accepted quantities and use the shared activity history for transparent follow-up.", ["Publish a member lot", "Review offers", "Account history"]],
    kn: ["FPO ಮತ್ತು ಸಹಕಾರಿ ಕಾರ್ಯಸ್ಥಳ", "ಸದಸ್ಯರ ಬೆಳೆ ಪಟ್ಟಿಗಳನ್ನು ಸಂಯೋಜಿಸಿ, ಕೊಡುಗೆಗಳನ್ನು ಹೋಲಿಸಿ, ಒಪ್ಪಿಕೊಂಡ ಪ್ರಮಾಣಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ ಮತ್ತು ಪಾರದರ್ಶಕ ಅನುಸರಣೆಗಾಗಿ ಚಟುವಟಿಕೆ ಇತಿಹಾಸ ಬಳಸಿ.", ["ಸದಸ್ಯರ ಬೆಳೆ ಪಟ್ಟಿ", "ಕೊಡುಗೆ ಪರಿಶೀಲನೆ", "ಖಾತೆ ಇತಿಹಾಸ"]]
  },
  fpo: {
    en: ["FPO workspace", "Coordinate member produce listings, compare offers and track accepted quantities.", ["Publish a member lot", "Review offers", "Account history"]],
    kn: ["FPO ಕಾರ್ಯಸ್ಥಳ", "ಸದಸ್ಯರ ಬೆಳೆ ಪಟ್ಟಿಗಳನ್ನು ಸಂಯೋಜಿಸಿ, ಕೊಡುಗೆಗಳನ್ನು ಹೋಲಿಸಿ ಮತ್ತು ಒಪ್ಪಿಕೊಂಡ ಪ್ರಮಾಣಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ.", ["ಸದಸ್ಯರ ಬೆಳೆ ಪಟ್ಟಿ", "ಕೊಡುಗೆ ಪರಿಶೀಲನೆ", "ಖಾತೆ ಇತಿಹಾಸ"]]
  },
  other: {
    en: ["Participant workspace", "Browse active opportunities, complete your profile and use the reporting and dispute tools when required.", ["Browse opportunities", "Complete profile", "Trust tools"]],
    kn: ["ಭಾಗವಹಿಸುವವರ ಕಾರ್ಯಸ್ಥಳ", "ಸಕ್ರಿಯ ಅವಕಾಶಗಳನ್ನು ಹುಡುಕಿ, ಪ್ರೊಫೈಲ್ ಪೂರ್ಣಗೊಳಿಸಿ ಮತ್ತು ಅಗತ್ಯವಿದ್ದಾಗ ವರದಿ ಹಾಗೂ ವಿವಾದ ಸಾಧನಗಳನ್ನು ಬಳಸಿ.", ["ಅವಕಾಶಗಳನ್ನು ಹುಡುಕಿ", "ಪ್ರೊಫೈಲ್ ಪೂರ್ಣಗೊಳಿಸಿ", "ನಂಬಿಕೆ ಸಾಧನಗಳು"]]
  }
} as const;

export function RoleDashboard({ role, stats = [] }: { role: string; stats?: { label: { en: string; kn: string }; value: number }[] }) {
  const { language } = useLanguage();
  const selected = roleContent[role as keyof typeof roleContent] ?? roleContent.other;
  const [title, description, actions] = selected[language];
  const roleAudio = role === "buyer" ? "buyer_trader" : role === "provider" ? "machinery_owner" : role === "processor" ? "waste_processor" : role === "fpo" ? "fpo_cooperative" : role in roleContent ? role : "portal";
  const hrefs = role === "transporter" ? ["/workspace?module=transport", "#operations", "#operations"] : role === "farmer" ? ["#create-listing", "#market-prices", "#waste-guide"]
    : role === "machinery_owner" || role === "provider" ? ["#create-listing", "#operations", "#operations"]
    : role === "waste_processor" || role === "processor" ? ["#marketplace", "#operations", "#operations"]
    : role === "municipality" ? ["#waste-guide", "#municipality-directory", "#operations"]
    : role === "fpo" || role === "fpo_cooperative" ? ["#create-listing", "#marketplace", "#operations"]
    : ["#marketplace", "#operations", "#operations"];
  return <section className="role-dashboard" aria-label={title}>
    <div className="role-dashboard-intro"><span className="kicker">{language === "kn" ? "ನಿಮ್ಮ ಪಾತ್ರಕ್ಕೆ ಅನುಗುಣವಾಗಿ" : "YOUR ROLE WORKSPACE"}</span><h3>{title}</h3><p>{description}</p></div>
    {stats.length > 0 && <div className="role-dashboard-stats">{stats.map((stat) => <div className="role-dashboard-stat" key={stat.label.en}><strong>{stat.value}</strong><small>{language === "kn" ? stat.label.kn : stat.label.en}</small></div>)}</div>}
    <div className="role-dashboard-actions">{actions.map((action, index) => <a key={action} href={hrefs[index]}>{action} ↗</a>)}<AudioGuideButton guide={roleAudio} compact /></div>
  </section>;
}
