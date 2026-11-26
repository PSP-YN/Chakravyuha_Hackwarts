"use client";

import { AudioGuideButton, useLanguage } from "@/components/language-provider";

type RoleAction = { title: string; detail: string; href: string; icon: string };

const roleContent: Record<string, {
  en: [string, string, string[]];
  kn: [string, string, string[]];
}> = {
  farmer: {
    en: ["Farmer workspace", "Sell produce with clear terms, compare market references, and manage service requests from one place.", ["Publish produce", "Compare mandi prices", "Review offers"]],
    kn: ["ರೈತ ಕಾರ್ಯಸ್ಥಳ", "ಸ್ಪಷ್ಟ ಷರತ್ತುಗಳೊಂದಿಗೆ ಬೆಳೆ ಮಾರಾಟ ಮಾಡಿ, ಮಾರುಕಟ್ಟೆ ಉಲ್ಲೇಖ ಬೆಲೆಗಳನ್ನು ಹೋಲಿಸಿ ಮತ್ತು ಸೇವಾ ವಿನಂತಿಗಳನ್ನು ಒಂದೇ ಸ್ಥಳದಲ್ಲಿ ನಿರ್ವಹಿಸಿ.", ["ಬೆಳೆ ಪ್ರಕಟಿಸಿ", "ಮಂಡಿ ಬೆಲೆ ಹೋಲಿಸಿ", "ಕೊಡುಗೆ ಪರಿಶೀಲಿಸಿ"]]
  },
  buyer_trader: {
    en: ["Buyer & trader workspace", "Find available produce, make traceable offers, and coordinate transport and transaction follow-up.", ["Browse produce", "Arrange transport", "Review activity"]],
    kn: ["ಖರೀದಿದಾರ ಮತ್ತು ವ್ಯಾಪಾರಿ ಕಾರ್ಯಸ್ಥಳ", "ಲಭ್ಯವಿರುವ ಬೆಳೆ ಹುಡುಕಿ, ದಾಖಲಾಗುವ ಕೊಡುಗೆ ಸಲ್ಲಿಸಿ ಮತ್ತು ಸಾರಿಗೆ ಹಾಗೂ ವಹಿವಾಟಿನ ಅನುಸರಣೆ ಮಾಡಿ.", ["ಬೆಳೆ ಹುಡುಕಿ", "ಸಾರಿಗೆ ವ್ಯವಸ್ಥೆ", "ಚಟುವಟಿಕೆ ಪರಿಶೀಲಿಸಿ"]]
  },
  buyer: {
    en: ["Buyer workspace", "Discover listings, submit commercial offers and keep accepted requests organised.", ["Browse listings", "Submit offers", "Review activity"]],
    kn: ["ಖರೀದಿದಾರ ಕಾರ್ಯಸ್ಥಳ", "ಪಟ್ಟಿಗಳನ್ನು ಹುಡುಕಿ, ವಾಣಿಜ್ಯ ಕೊಡುಗೆ ಸಲ್ಲಿಸಿ ಮತ್ತು ಒಪ್ಪಿಕೊಂಡ ವಿನಂತಿಗಳನ್ನು ಕ್ರಮಬದ್ಧವಾಗಿ ನಿರ್ವಹಿಸಿ.", ["ಪಟ್ಟಿ ಹುಡುಕಿ", "ಕೊಡುಗೆ ಸಲ್ಲಿಸಿ", "ಚಟುವಟಿಕೆ ಪರಿಶೀಲಿಸಿ"]]
  },
  machinery_owner: {
    en: ["Machinery owner workspace", "Publish equipment availability and manage bookings, schedule changes and work evidence.", ["Publish equipment", "Manage bookings", "Add job evidence"]],
    kn: ["ಯಂತ್ರೋಪಕರಣ ಮಾಲೀಕರ ಕಾರ್ಯಸ್ಥಳ", "ಯಂತ್ರೋಪಕರಣ ಲಭ್ಯತೆ ಪ್ರಕಟಿಸಿ ಮತ್ತು ಬುಕಿಂಗ್, ವೇಳಾಪಟ್ಟಿ ಬದಲಾವಣೆ ಹಾಗೂ ಕೆಲಸದ ಸಾಕ್ಷ್ಯ ನಿರ್ವಹಿಸಿ.", ["ಯಂತ್ರೋಪಕರಣ ಪ್ರಕಟಿಸಿ", "ಬುಕಿಂಗ್ ನಿರ್ವಹಿಸಿ", "ಕೆಲಸದ ಸಾಕ್ಷ್ಯ ಸೇರಿಸಿ"]]
  },
  provider: {
    en: ["Machinery provider workspace", "Publish equipment availability and manage bookings, schedule changes and work evidence.", ["Publish equipment", "Manage bookings", "Add job evidence"]],
    kn: ["ಯಂತ್ರೋಪಕರಣ ಪೂರೈಕೆದಾರರ ಕಾರ್ಯಸ್ಥಳ", "ಯಂತ್ರೋಪಕರಣ ಲಭ್ಯತೆ ಪ್ರಕಟಿಸಿ ಮತ್ತು ಬುಕಿಂಗ್, ವೇಳಾಪಟ್ಟಿ ಬದಲಾವಣೆ ಹಾಗೂ ಕೆಲಸದ ಸಾಕ್ಷ್ಯ ನಿರ್ವಹಿಸಿ.", ["ಯಂತ್ರೋಪಕರಣ ಪ್ರಕಟಿಸಿ", "ಬುಕಿಂಗ್ ನಿರ್ವಹಿಸಿ", "ಕೆಲಸದ ಸಾಕ್ಷ್ಯ ಸೇರಿಸಿ"]]
  },
  waste_processor: {
    en: ["Waste processor workspace", "Review by-product specifications, send acceptance requests and maintain independently reviewable quality records.", ["Browse FarmLoop", "Send acceptance", "Quality records"]],
    kn: ["ತ್ಯಾಜ್ಯ ಸಂಸ್ಕಾರಕರ ಕಾರ್ಯಸ್ಥಳ", "ಉಪಉತ್ಪನ್ನ ವಿವರ ಪರಿಶೀಲಿಸಿ, ಸ್ವೀಕೃತಿ ವಿನಂತಿ ಕಳುಹಿಸಿ ಮತ್ತು ಸ್ವತಂತ್ರ ಪರಿಶೀಲನೆಗೆ ಗುಣಮಟ್ಟ ದಾಖಲೆ ಉಳಿಸಿ.", ["ಫಾರ್ಮ್‌ಲೂಪ್ ಹುಡುಕಿ", "ಸ್ವೀಕೃತಿ ಕಳುಹಿಸಿ", "ಗುಣಮಟ್ಟ ದಾಖಲೆ"]]
  },
  processor: {
    en: ["Processor workspace", "Review by-product specifications, send acceptance requests and maintain independently reviewable quality records.", ["Browse FarmLoop", "Send acceptance", "Quality records"]],
    kn: ["ಸಂಸ್ಕಾರಕರ ಕಾರ್ಯಸ್ಥಳ", "ಉಪಉತ್ಪನ್ನ ವಿವರ ಪರಿಶೀಲಿಸಿ, ಸ್ವೀಕೃತಿ ವಿನಂತಿ ಕಳುಹಿಸಿ ಮತ್ತು ಸ್ವತಂತ್ರ ಪರಿಶೀಲನೆಗೆ ಗುಣಮಟ್ಟ ದಾಖಲೆ ಉಳಿಸಿ.", ["ಫಾರ್ಮ್‌ಲೂಪ್ ಹುಡುಕಿ", "ಸ್ವೀಕೃತಿ ಕಳುಹಿಸಿ", "ಗುಣಮಟ್ಟ ದಾಖಲೆ"]]
  },
  municipality: {
    en: ["Municipality workspace", "Respond to local service enquiries, use verified directory contacts and keep an accountable response history.", ["Respond to enquiries", "View official contacts", "Account history"]],
    kn: ["ಪುರಸಭೆ ಕಾರ್ಯಸ್ಥಳ", "ಸ್ಥಳೀಯ ಸೇವಾ ವಿಚಾರಣೆಗಳಿಗೆ ಪ್ರತಿಕ್ರಿಯಿಸಿ, ಪರಿಶೀಲಿತ ಸಂಪರ್ಕ ಬಳಸಿ ಮತ್ತು ಜವಾಬ್ದಾರಿಯುತ ಪ್ರತಿಕ್ರಿಯೆ ಇತಿಹಾಸ ಉಳಿಸಿ.", ["ವಿಚಾರಣೆಗೆ ಪ್ರತಿಕ್ರಿಯಿಸಿ", "ಅಧಿಕೃತ ಸಂಪರ್ಕ ನೋಡಿ", "ಖಾತೆ ಇತಿಹಾಸ"]]
  },
  transporter: {
    en: ["Transporter workspace", "Find suitable loads, manage confirmed jobs and record pickup and delivery evidence.", ["Find transport work", "Manage transport jobs", "Add delivery evidence"]],
    kn: ["ಸಾರಿಗೆದಾರರ ಕಾರ್ಯಸ್ಥಳ", "ಸೂಕ್ತ ಸರಕು ಅವಕಾಶ ಹುಡುಕಿ, ದೃಢಪಟ್ಟ ಕೆಲಸ ನಿರ್ವಹಿಸಿ ಮತ್ತು ಪಿಕಪ್ ಹಾಗೂ ವಿತರಣೆಯ ಸಾಕ್ಷ್ಯ ದಾಖಲಿಸಿ.", ["ಸಾರಿಗೆ ಕೆಲಸ ಹುಡುಕಿ", "ಸಾರಿಗೆ ಕೆಲಸ ನಿರ್ವಹಿಸಿ", "ವಿತರಣಾ ಸಾಕ್ಷ್ಯ ಸೇರಿಸಿ"]]
  },
  fpo_cooperative: {
    en: ["FPO & cooperative workspace", "Coordinate member contributions, publish traceable aggregate lots and review offers against the group's supply.", ["Manage member lots", "Review offers", "Cooperative activity"]],
    kn: ["FPO ಮತ್ತು ಸಹಕಾರಿ ಕಾರ್ಯಸ್ಥಳ", "ಸದಸ್ಯರ ಕೊಡುಗೆ ಸಂಯೋಜಿಸಿ, ಪತ್ತೆಹಚ್ಚಬಹುದಾದ ಒಕ್ಕೂಟ ಪಟ್ಟಿಗಳನ್ನು ಪ್ರಕಟಿಸಿ ಮತ್ತು ಗುಂಪಿನ ಪೂರೈಕೆಗೆ ಬಂದ ಕೊಡುಗೆ ಪರಿಶೀಲಿಸಿ.", ["ಸದಸ್ಯರ ಪಟ್ಟಿಗಳು", "ಕೊಡುಗೆ ಪರಿಶೀಲಿಸಿ", "ಸಹಕಾರಿ ಚಟುವಟಿಕೆ"]]
  },
  fpo: {
    en: ["FPO workspace", "Coordinate member contributions, publish traceable aggregate lots and review offers against the group's supply.", ["Manage member lots", "Review offers", "Cooperative activity"]],
    kn: ["FPO ಕಾರ್ಯಸ್ಥಳ", "ಸದಸ್ಯರ ಕೊಡುಗೆ ಸಂಯೋಜಿಸಿ, ಪತ್ತೆಹಚ್ಚಬಹುದಾದ ಒಕ್ಕೂಟ ಪಟ್ಟಿಗಳನ್ನು ಪ್ರಕಟಿಸಿ ಮತ್ತು ಗುಂಪಿನ ಪೂರೈಕೆಗೆ ಬಂದ ಕೊಡುಗೆ ಪರಿಶೀಲಿಸಿ.", ["ಸದಸ್ಯರ ಪಟ್ಟಿಗಳು", "ಕೊಡುಗೆ ಪರಿಶೀಲಿಸಿ", "ಸಹಕಾರಿ ಚಟುವಟಿಕೆ"]]
  },
  admin: {
    en: ["Platform administration", "Review participant verification, listing moderation, reports, disputes and quality evidence. Administrative actions are available only to accounts granted the admin role in Supabase app metadata.", ["Verify participants", "Moderate listings", "Review reports", "Resolve disputes", "Verify quality evidence"]],
    kn: ["ವೇದಿಕೆ ಆಡಳಿತ", "ಭಾಗವಹಿಸುವವರ ಪರಿಶೀಲನೆ, ಪಟ್ಟಿ ನಿಯಂತ್ರಣ, ವರದಿಗಳು, ವಿವಾದಗಳು ಮತ್ತು ಗುಣಮಟ್ಟದ ಸಾಕ್ಷ್ಯ ಪರಿಶೀಲಿಸಿ. Supabase app metadata ಯಲ್ಲಿ admin ಪಾತ್ರ ಹೊಂದಿರುವ ಖಾತೆಗಳಿಗೆ ಮಾತ್ರ ಈ ಕ್ರಮಗಳು ಲಭ್ಯ.", ["ಭಾಗವಹಿಸುವವರ ಪರಿಶೀಲನೆ", "ಪಟ್ಟಿ ನಿಯಂತ್ರಣ", "ವರದಿ ಪರಿಶೀಲನೆ", "ವಿವಾದ ಪರಿಹಾರ", "ಗುಣಮಟ್ಟದ ಸಾಕ್ಷ್ಯ ಪರಿಶೀಲನೆ"]]
  },
  other: {
    en: ["Participant workspace", "Complete your participant profile, browse relevant opportunities and use the trust tools when needed.", ["Browse opportunities", "Complete profile", "Trust tools"]],
    kn: ["ಭಾಗವಹಿಸುವವರ ಕಾರ್ಯಸ್ಥಳ", "ಭಾಗವಹಿಸುವವರ ಪ್ರೊಫೈಲ್ ಪೂರ್ಣಗೊಳಿಸಿ, ಸಂಬಂಧಿತ ಅವಕಾಶ ಹುಡುಕಿ ಮತ್ತು ಅಗತ್ಯವಿದ್ದಾಗ ನಂಬಿಕೆ ಸಾಧನ ಬಳಸಿ.", ["ಅವಕಾಶ ಹುಡುಕಿ", "ಪ್ರೊಫೈಲ್ ಪೂರ್ಣಗೊಳಿಸಿ", "ನಂಬಿಕೆ ಸಾಧನಗಳು"]]
  }
};

const actionDetails: Record<string, { en: string[]; kn: string[]; hrefs: string[]; icons: string[] }> = {
  farmer: { en: ["Set crop, quantity, unit, asking price and pickup location.", "Compare official reference prices before negotiating.", "Respond to incoming offers and track accepted quantities."], kn: ["ಬೆಳೆ, ಪ್ರಮಾಣ, ಘಟಕ, ಬೆಲೆ ಮತ್ತು ಸ್ಥಳ ನಮೂದಿಸಿ.", "ಮಾತುಕತೆಗೆ ಮೊದಲು ಅಧಿಕೃತ ಉಲ್ಲೇಖ ಬೆಲೆ ಹೋಲಿಸಿ.", "ಬಂದ ಕೊಡುಗೆಗಳಿಗೆ ಪ್ರತಿಕ್ರಿಯಿಸಿ ಮತ್ತು ಒಪ್ಪಿದ ಪ್ರಮಾಣ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ."], hrefs: ["#create-listing", "#market-prices", "#operations"], icons: ["＋", "₹", "↔"] },
  buyer_trader: { en: ["Filter current farmer listings and inspect available quantity.", "Open transport opportunities and specify pickup and destination.", "Track sent offers, responses and dispute options."], kn: ["ರೈತರ ಪ್ರಸ್ತುತ ಪಟ್ಟಿಗಳನ್ನು ಫಿಲ್ಟರ್ ಮಾಡಿ ಲಭ್ಯ ಪ್ರಮಾಣ ನೋಡಿ.", "ಸಾರಿಗೆ ಅವಕಾಶ ತೆರೆಯಿರಿ ಮತ್ತು ಪಿಕಪ್ ಹಾಗೂ ಗಮ್ಯಸ್ಥಾನ ನಮೂದಿಸಿ.", "ಕಳುಹಿಸಿದ ಕೊಡುಗೆ, ಪ್ರತಿಕ್ರಿಯೆ ಮತ್ತು ವಿವಾದ ಆಯ್ಕೆ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ."], hrefs: ["/workspace?module=produce#marketplace", "/workspace?module=transport#marketplace", "#operations"], icons: ["⌕", "⇄", "◷"] },
  buyer: { en: ["Search active listings by category, crop and location.", "Submit an offer with quantity and farmer-borne cost estimates.", "Track offer decisions and transaction follow-up."], kn: ["ವರ್ಗ, ಬೆಳೆ ಮತ್ತು ಸ್ಥಳದ ಮೂಲಕ ಸಕ್ರಿಯ ಪಟ್ಟಿಗಳನ್ನು ಹುಡುಕಿ.", "ಪ್ರಮಾಣ ಮತ್ತು ರೈತ ಭರಿಸುವ ವೆಚ್ಚದ ಅಂದಾಜಿನೊಂದಿಗೆ ಕೊಡುಗೆ ಸಲ್ಲಿಸಿ.", "ಕೊಡುಗೆ ನಿರ್ಧಾರ ಮತ್ತು ವಹಿವಾಟಿನ ಅನುಸರಣೆ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ."], hrefs: ["#marketplace", "#marketplace", "#operations"], icons: ["⌕", "＋", "◷"] },
  machinery_owner: { en: ["Publish equipment, operation, HP, operator, fuel and availability terms.", "Review booking requests and manage schedule changes.", "Attach before/after photos and work notes."], kn: ["ಯಂತ್ರೋಪಕರಣ, ಕಾರ್ಯ, HP, ಚಾಲಕ, ಇಂಧನ ಮತ್ತು ಲಭ್ಯತೆ ಷರತ್ತು ಪ್ರಕಟಿಸಿ.", "ಬುಕಿಂಗ್ ವಿನಂತಿ ಪರಿಶೀಲಿಸಿ ಮತ್ತು ವೇಳಾಪಟ್ಟಿ ಬದಲಾವಣೆ ನಿರ್ವಹಿಸಿ.", "ಮೊದಲು/ನಂತರದ ಚಿತ್ರ ಮತ್ತು ಕೆಲಸದ ಟಿಪ್ಪಣಿ ಸೇರಿಸಿ."], hrefs: ["#create-listing", "#operations", "#operations"], icons: ["⚙", "▦", "＋"] },
  provider: { en: ["Publish equipment, operation, HP, operator, fuel and availability terms.", "Review booking requests and manage schedule changes.", "Attach before/after photos and work notes."], kn: ["ಯಂತ್ರೋಪಕರಣ, ಕಾರ್ಯ, HP, ಚಾಲಕ, ಇಂಧನ ಮತ್ತು ಲಭ್ಯತೆ ಷರತ್ತು ಪ್ರಕಟಿಸಿ.", "ಬುಕಿಂಗ್ ವಿನಂತಿ ಪರಿಶೀಲಿಸಿ ಮತ್ತು ವೇಳಾಪಟ್ಟಿ ಬದಲಾವಣೆ ನಿರ್ವಹಿಸಿ.", "ಮೊದಲು/ನಂತರದ ಚಿತ್ರ ಮತ್ತು ಕೆಲಸದ ಟಿಪ್ಪಣಿ ಸೇರಿಸಿ."], hrefs: ["#create-listing", "#operations", "#operations"], icons: ["⚙", "▦", "＋"] },
  waste_processor: { en: ["Inspect material, moisture and contamination details.", "Send a request with acceptance conditions and proposed quantity.", "Submit test data; records remain pending until reviewed."], kn: ["ವಸ್ತು, ತೇವಾಂಶ ಮತ್ತು ಮಿಶ್ರಣ ವಿವರ ಪರಿಶೀಲಿಸಿ.", "ಸ್ವೀಕೃತಿ ಷರತ್ತು ಮತ್ತು ಪ್ರಸ್ತಾಪಿತ ಪ್ರಮಾಣದೊಂದಿಗೆ ವಿನಂತಿ ಕಳುಹಿಸಿ.", "ಪರೀಕ್ಷಾ ಮಾಹಿತಿ ಸಲ್ಲಿಸಿ; ಪರಿಶೀಲನೆವರೆಗೆ ದಾಖಲೆ ಬಾಕಿ ಇರುತ್ತದೆ."], hrefs: ["/workspace?module=byproduct#marketplace", "#operations", "#operations"], icons: ["⟳", "＋", "▤"] },
  processor: { en: ["Inspect material, moisture and contamination details.", "Send a request with acceptance conditions and proposed quantity.", "Submit test data; records remain pending until reviewed."], kn: ["ವಸ್ತು, ತೇವಾಂಶ ಮತ್ತು ಮಿಶ್ರಣ ವಿವರ ಪರಿಶೀಲಿಸಿ.", "ಸ್ವೀಕೃತಿ ಷರತ್ತು ಮತ್ತು ಪ್ರಸ್ತಾಪಿತ ಪ್ರಮಾಣದೊಂದಿಗೆ ವಿನಂತಿ ಕಳುಹಿಸಿ.", "ಪರೀಕ್ಷಾ ಮಾಹಿತಿ ಸಲ್ಲಿಸಿ; ಪರಿಶೀಲನೆವರೆಗೆ ದಾಖಲೆ ಬಾಕಿ ಇರುತ್ತದೆ."], hrefs: ["/workspace?module=byproduct#marketplace", "#operations", "#operations"], icons: ["⟳", "＋", "▤"] },
  municipality: { en: ["Acknowledge, respond, refer or close district enquiries.", "Use contacts published from official local-body sources.", "Review your account and response history."], kn: ["ಜಿಲ್ಲಾ ವಿಚಾರಣೆ ಸ್ವೀಕರಿಸಿ, ಪ್ರತಿಕ್ರಿಯಿಸಿ, ವರ್ಗಾಯಿಸಿ ಅಥವಾ ಮುಚ್ಚಿ.", "ಅಧಿಕೃತ ಸ್ಥಳೀಯ ಸಂಸ್ಥೆ ಮೂಲದಿಂದ ಪ್ರಕಟಿಸಿದ ಸಂಪರ್ಕ ಬಳಸಿ.", "ಖಾತೆ ಮತ್ತು ಪ್ರತಿಕ್ರಿಯೆ ಇತಿಹಾಸ ಪರಿಶೀಲಿಸಿ."], hrefs: ["#municipality-requests-title", "#municipality-directory", "#operations"], icons: ["✉", "⌖", "◷"] },
  transporter: { en: ["Find route, vehicle and load-capacity opportunities.", "Update pickup, in-transit and delivery job states.", "Upload delivery evidence and handoff notes."], kn: ["ಮಾರ್ಗ, ವಾಹನ ಮತ್ತು ಸರಕು ಸಾಮರ್ಥ್ಯದ ಅವಕಾಶ ಹುಡುಕಿ.", "ಪಿಕಪ್, ಸಾಗಣೆ ಮತ್ತು ವಿತರಣಾ ಕೆಲಸದ ಸ್ಥಿತಿ ನವೀಕರಿಸಿ.", "ವಿತರಣಾ ಸಾಕ್ಷ್ಯ ಮತ್ತು ಹಸ್ತಾಂತರ ಟಿಪ್ಪಣಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ."], hrefs: ["/workspace?module=transport#marketplace", "#operations", "#operations"], icons: ["⇄", "▦", "＋"] },
  fpo_cooperative: { en: ["Maintain members and allocate each aggregate lot to active members.", "Review offers for the group's published supply.", "Track cooperative listings and account activity."], kn: ["ಸದಸ್ಯ ನಿರ್ವಹಿಸಿ ಮತ್ತು ಒಕ್ಕೂಟ ಪಟ್ಟಿಯನ್ನು ಸಕ್ರಿಯ ಸದಸ್ಯರಿಗೆ ಹಂಚಿ.", "ಗುಂಪಿನ ಪ್ರಕಟಿತ ಪೂರೈಕೆಗೆ ಬಂದ ಕೊಡುಗೆ ಪರಿಶೀಲಿಸಿ.", "ಸಹಕಾರಿ ಪಟ್ಟಿ ಮತ್ತು ಖಾತೆ ಚಟುವಟಿಕೆ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ."], hrefs: ["#fpo-workspace-title", "#marketplace", "#operations"], icons: ["♧", "↔", "◷"] },
  fpo: { en: ["Maintain members and allocate each aggregate lot to active members.", "Review offers for the group's published supply.", "Track cooperative listings and account activity."], kn: ["ಸದಸ್ಯ ನಿರ್ವಹಿಸಿ ಮತ್ತು ಒಕ್ಕೂಟ ಪಟ್ಟಿಯನ್ನು ಸಕ್ರಿಯ ಸದಸ್ಯರಿಗೆ ಹಂಚಿ.", "ಗುಂಪಿನ ಪ್ರಕಟಿತ ಪೂರೈಕೆಗೆ ಬಂದ ಕೊಡುಗೆ ಪರಿಶೀಲಿಸಿ.", "ಸಹಕಾರಿ ಪಟ್ಟಿ ಮತ್ತು ಖಾತೆ ಚಟುವಟಿಕೆ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ."], hrefs: ["#fpo-workspace-title", "#marketplace", "#operations"], icons: ["♧", "↔", "◷"] },
  admin: { en: ["Review profile details and verification evidence; this is not government identity certification.", "Restore, pause or close listings with a recorded moderation reason.", "Triage participant reports and record a resolution.", "Review transaction disputes and document the outcome.", "Review uploaded quality reports and approve or reject evidence."], kn: ["ಪ್ರೊಫೈಲ್ ಮತ್ತು ಪರಿಶೀಲನಾ ಸಾಕ್ಷ್ಯ ಪರಿಶೀಲಿಸಿ; ಇದು ಸರ್ಕಾರಿ ಗುರುತು ಪ್ರಮಾಣೀಕರಣವಲ್ಲ.", "ದಾಖಲಾದ ಕಾರಣದೊಂದಿಗೆ ಪಟ್ಟಿಗಳನ್ನು ಮರುಸ್ಥಾಪಿಸಿ, ವಿರಾಮಗೊಳಿಸಿ ಅಥವಾ ಮುಚ್ಚಿ.", "ಭಾಗವಹಿಸುವವರ ವರದಿ ಪರಿಶೀಲಿಸಿ ಪರಿಹಾರ ದಾಖಲಿಸಿ.", "ವಹಿವಾಟಿನ ವಿವಾದ ಪರಿಶೀಲಿಸಿ ಫಲಿತಾಂಶ ದಾಖಲಿಸಿ.", "ಅಪ್‌ಲೋಡ್ ಮಾಡಿದ ಗುಣಮಟ್ಟ ವರದಿ ಪರಿಶೀಲಿಸಿ ಸಾಕ್ಷ್ಯ ಒಪ್ಪಿಕೊಳ್ಳಿ ಅಥವಾ ತಿರಸ್ಕರಿಸಿ."], hrefs: ["#admin-verification", "#admin-moderation", "#admin-reports", "#admin-disputes", "#admin-quality-queue"], icons: ["✓", "▤", "⚑", "↔", "⌕"] },
};

export function RoleDashboard({ role, stats = [], profileCompleted = true }: { role: string; stats?: { label: { en: string; kn: string }; value: number }[]; profileCompleted?: boolean }) {
  const { language } = useLanguage();
  const selected = roleContent[role] ?? roleContent.other;
  const [title, description, actionLabels] = selected[language];
  const detail = actionDetails[role] ?? {
    en: ["Browse active opportunities and inspect their requirements.", "Complete the required participant profile fields.", "Use reports and dispute tools when a transaction needs attention."],
    kn: ["ಸಕ್ರಿಯ ಅವಕಾಶಗಳನ್ನು ಹುಡುಕಿ ಮತ್ತು ಅವುಗಳ ಷರತ್ತು ಪರಿಶೀಲಿಸಿ.", "ಅಗತ್ಯ ಭಾಗವಹಿಸುವವರ ಪ್ರೊಫೈಲ್ ವಿವರ ಪೂರ್ಣಗೊಳಿಸಿ.", "ವಹಿವಾಟಿಗೆ ಗಮನ ಅಗತ್ಯವಿದ್ದಾಗ ವರದಿ ಮತ್ತು ವಿವಾದ ಸಾಧನ ಬಳಸಿ."],
    hrefs: ["#marketplace", "#operations", "#operations"],
    icons: ["⌕", "✓", "⚑"],
  };
  const roleAudio = role === "buyer" ? "buyer_trader" : role === "provider" ? "machinery_owner" : role === "processor" ? "waste_processor" : role === "fpo" ? "fpo_cooperative" : role in roleContent ? role : "portal";
  const labels = language === "kn" ? detail.kn : detail.en;
  return (
    <section className="role-dashboard" aria-label={title}>
      <div className="role-dashboard-top">
        <div className="role-dashboard-intro">
          <span className="kicker">{language === "kn" ? "ನಿಮ್ಮ ಪಾತ್ರಕ್ಕೆ ಅನುಗುಣವಾಗಿ" : "YOUR WORKSPACE"}</span>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <AudioGuideButton guide={roleAudio} compact />
      </div>
      {!profileCompleted && role !== "admin" && (
        <div className="role-dashboard-profile-alert">
          <div><strong>{language === "kn" ? "ಮೊದಲು ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಪೂರ್ಣಗೊಳಿಸಿ" : "Complete your participant profile first"}</strong><small>{language === "kn" ? "ಪಟ್ಟಿ, ಕೊಡುಗೆ ಮತ್ತು Storage Guardian ಡೆಮೊ ನೋಡ್ ರಚಿಸಲು ಅಗತ್ಯ ವಿವರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ." : "Add the required participant details before publishing listings, sending offers or creating a Storage Guardian demo node."}</small></div>
          <a href="#operations">{language === "kn" ? "ಪ್ರೊಫೈಲ್ ಪೂರ್ಣಗೊಳಿಸಿ ↗" : "Complete profile ↗"}</a>
        </div>
      )}
      {stats.length > 0 && (
        <div className="role-dashboard-stats" aria-label={language === "kn" ? "ಕಾರ್ಯಕ್ಷಮತೆ ಸೂಚಕಗಳು" : "Workspace summary"}>
          {stats.map((stat, index) => (
            <div className="role-dashboard-stat" key={stat.label.en}>
              <span className="role-dashboard-stat-index">0{index + 1}</span>
              <strong>{stat.value.toLocaleString(language === "kn" ? "kn-IN" : "en-IN")}</strong>
              <small>{language === "kn" ? stat.label.kn : stat.label.en}</small>
            </div>
          ))}
        </div>
      )}
      <div className="role-dashboard-action-grid">
        {actionLabels.map((label, index) => (
          <a className="role-dashboard-action" key={label} href={detail.hrefs[index]}>
            <span className="role-dashboard-action-icon" aria-hidden="true">{detail.icons[index]}</span>
            <span className="role-dashboard-action-copy">
              <strong>{label}</strong>
              <small>{labels[index]}</small>
            </span>
            <span className="role-dashboard-action-arrow" aria-hidden="true">↗</span>
          </a>
        ))}
      </div>
    </section>
  );
}
