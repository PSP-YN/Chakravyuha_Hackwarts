"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { friendlyErrorMessage } from "@/lib/error-message";
import { useLanguage } from "@/components/language-provider";
import { money } from "@/lib/domain";
import { RoleDashboard } from "@/components/role-dashboard";
import { FpoWorkspace } from "@/components/fpo-workspace";

type Row = Record<string, any>;
const text = {
  en: {
    title:"Trust, service and quality", intro:"Account settings, reports, disputes, machinery bookings and processor workflows.", notifications:"Notifications", unread:"unread", markRead:"Mark as read", noNotifications:"No notifications yet. Offers, bookings and reports will appear here.",
    profile:"Participant profile", name:"Display name", role:"Registered participant type", language:"Preferred language", phone:"Mobile number", district:"District", taluk:"Taluk", village:"Village / Town", organisation:"Organisation name", profileComplete:"Profile completion", profileIncomplete:"Complete the required contact and location fields.", save:"Save profile", signOut:"Sign out",
    farmer:"Farmer", buyer:"Buyer / trader", provider:"Machinery / equipment owner", processor:"Waste processor", fpo:"FPO / cooperative", municipality:"Municipality contact", transporter:"Transporter", other:"Other",
    report:"Report a listing or participant", listing:"Listing", reason:"Reason", description:"Describe the issue (at least 10 characters)",
    submit:"Submit", misleading:"Misleading listing", fraud:"Suspected fraud", harassment:"Harassment", unsafe:"Unsafe practice", spam:"Spam", otherReason:"Other",
    dispute:"Open a transaction dispute", offer:"Accepted or completed offer", issue:"Issue type", qualityMismatch:"Quality mismatch", quantityMismatch:"Quantity mismatch", late:"Late or missing delivery", machinery:"Machinery service issue", payment:"Payment disagreement", safety:"Safety",
    bookings:"Machinery bookings", noBookings:"No bookings yet. Accepted machinery offers appear here.", transportJobs:"KrishiTransit jobs", noTransportJobs:"Accepted transport requests become trackable jobs here.", pickupReady:"Ready for pickup", pickedUp:"Picked up", inTransit:"In transit", deliveredPending:"Delivered — awaiting receiver confirmation", transportComplete:"Confirm receipt", transportEvidence:"Transport / delivery evidence", transportNote:"Status or delivery note", transportRoute:"Pickup → destination", transportVehicle:"Vehicle / capacity", loading:"Loading", unloading:"Unloading", toAgree:"To be agreed", requesterResponsibility:"Requester", transporterResponsibility:"Transporter", sharedResponsibility:"Shared", uploadTransportEvidence:"Upload transport evidence", cancelTransport:"Cancel transport job", cancel:"Cancel booking", cancelReason:"Cancellation reason", reschedule:"Reschedule", start:"Start job", complete:"Mark job complete", startAt:"New service start",
    evidence:"Job evidence", evidenceType:"Evidence type", before:"Before photo", after:"After photo", workNote:"Work note", delivery:"Delivery note", otherEvidence:"Other", file:"Choose photo or PDF", upload:"Upload evidence",
    farmloop:"FarmLoop processor requests", request:"Send processor acceptance request", materialSpec:"Material specification / acceptance conditions", price:"Proposed price ₹ per unit", quantity:"Proposed quantity", noByproducts:"No active by-product listings available.",
    quality:"Material quality check", method:"Test method / sampling protocol", lab:"Laboratory / testing organisation", reportRef:"Report reference", tested:"Test date", moisture:"Measured moisture %", contamination:"Measured contamination %", reportFile:"Attach report (PDF or image)", submitCheck:"Submit quality record",
    admin:"Administration", adminOnly:"Administrative tools appear only for accounts granted the admin role in Supabase app metadata.", moderation:"Listing moderation", moderationReason:"Reason for this moderation action (at least 10 characters)", applyModeration:"Apply moderation", restore:"Restore listing", pauseListing:"Pause listing", closeListing:"Close listing", moderationHistory:"Last moderation action", reports:"Participant reports", disputes:"Open disputes", qualityQueue:"Quality verification queue", verification:"Participant verification", status:"Status", resolution:"Resolution note", review:"Save review", verify:"Verify report", reject:"Reject", verified:"Verified", pending:"Pending", open:"Open", inReview:"In review", resolved:"Resolved", dismissed:"Dismissed", noItems:"Nothing to review.", noAccount:"Sign in to use trust and service workflows.", refresh:"Refresh", saved:"Saved.", failed:"The action could not be completed.", accepted:"Accepted", rejected:"Rejected", withdrawn:"Withdrawn", confirmed:"Confirmed", rescheduled:"Rescheduled", inProgress:"In progress", completed:"Completed", cancelled:"Cancelled", verifiedStatus:"Verified", rejectedStatus:"Rejected", unverified:"Unverified", requestReview:"Request verification review", reportedParticipant:"Reported participant", displayNameHint:"Name shown to participants", processorDisclosure:"Processor type is self-declared in the profile; it is not an independent accreditation.", pendingQuality:"Records remain pending until an administrator reviews the attached report and data.", verificationDisclosure:"Participant verification is an administrative review, not government identity or land verification.", reportFileLimit:"Report file must be 10 MB or smaller.", evidenceLimit:"Evidence must be 10 MB or smaller.", openReport:"Open report ↗"
  },
  kn: {
    title:"ನಂಬಿಕೆ, ಸೇವೆ ಮತ್ತು ಗುಣಮಟ್ಟ", intro:"ಖಾತೆ ಸೆಟ್ಟಿಂಗ್‌ಗಳು, ವರದಿಗಳು, ವಿವಾದಗಳು, ಯಂತ್ರೋಪಕರಣ ಬುಕಿಂಗ್ ಮತ್ತು ಸಂಸ್ಕಾರಕರ ಕಾರ್ಯವಿಧಾನಗಳು.", notifications:"ಅಧಿಸೂಚನೆಗಳು", unread:"ಓದದವು", markRead:"ಓದಲಾಗಿದೆ ಎಂದು ಗುರುತಿಸಿ", noNotifications:"ಇನ್ನೂ ಅಧಿಸೂಚನೆಗಳಿಲ್ಲ. ಕೊಡುಗೆಗಳು, ಬುಕಿಂಗ್‌ಗಳು ಮತ್ತು ವರದಿಗಳು ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ.",
    profile:"ಭಾಗವಹಿಸುವವರ ಪ್ರೊಫೈಲ್", name:"ಪ್ರದರ್ಶನ ಹೆಸರು", role:"ನೋಂದಾಯಿತ ಭಾಗವಹಿಸುವವರ ಪಾತ್ರ", language:"ಆದ್ಯತೆಯ ಭಾಷೆ", phone:"ಮೊಬೈಲ್ ಸಂಖ್ಯೆ", district:"ಜಿಲ್ಲೆ", taluk:"ತಾಲೂಕು", village:"ಗ್ರಾಮ / ಪಟ್ಟಣ", organisation:"ಸಂಸ್ಥೆಯ ಹೆಸರು", profileComplete:"ಪ್ರೊಫೈಲ್ ಪೂರ್ಣತೆ", profileIncomplete:"ಅಗತ್ಯ ಸಂಪರ್ಕ ಮತ್ತು ಸ್ಥಳದ ವಿವರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ.", save:"ಪ್ರೊಫೈಲ್ ಉಳಿಸಿ", signOut:"ಸೈನ್ ಔಟ್",
    farmer:"ರೈತ", buyer:"ಖರೀದಿದಾರ / ವ್ಯಾಪಾರಿ", provider:"ಯಂತ್ರೋಪಕರಣ / ಉಪಕರಣ ಮಾಲೀಕ", processor:"ಕೃಷಿ ತ್ಯಾಜ್ಯ ಸಂಸ್ಕಾರಕ", fpo:"ರೈತ ಉತ್ಪಾದಕ ಸಂಸ್ಥೆ / ಸಹಕಾರಿ", municipality:"ಪುರಸಭೆ / ಸ್ಥಳೀಯ ಸಂಸ್ಥೆ ಸಂಪರ್ಕಾಧಿಕಾರಿ", transporter:"ಸಾರಿಗೆದಾರ", other:"ಇತರೆ",
    report:"ಪಟ್ಟಿ ಅಥವಾ ಭಾಗವಹಿಸುವವರ ಬಗ್ಗೆ ವರದಿ", listing:"ಪಟ್ಟಿ", reason:"ಕಾರಣ", description:"ಸಮಸ್ಯೆಯನ್ನು ವಿವರಿಸಿ (ಕನಿಷ್ಠ 10 ಅಕ್ಷರಗಳು)",
    submit:"ಸಲ್ಲಿಸಿ", misleading:"ತಪ್ಪು ಮಾಹಿತಿ ಇರುವ ಪಟ್ಟಿ", fraud:"ವಂಚನೆಯ ಅನುಮಾನ", harassment:"ಕಿರುಕುಳ", unsafe:"ಅಸುರಕ್ಷಿತ ಕ್ರಮ", spam:"ಸ್ಪ್ಯಾಮ್", otherReason:"ಇತರೆ",
    dispute:"ವಹಿವಾಟಿನ ವಿವಾದ ತೆರೆಯಿರಿ", offer:"ಒಪ್ಪಿಕೊಂಡ ಅಥವಾ ಪೂರ್ಣಗೊಂಡ ಕೊಡುಗೆ", issue:"ಸಮಸ್ಯೆಯ ಪ್ರಕಾರ", qualityMismatch:"ಗುಣಮಟ್ಟ ವ್ಯತ್ಯಾಸ", quantityMismatch:"ಪ್ರಮಾಣ ವ್ಯತ್ಯಾಸ", late:"ತಡವಾದ ಅಥವಾ ಕಾಣೆಯಾದ ವಿತರಣೆ", machinery:"ಯಂತ್ರೋಪಕರಣ ಸೇವೆ ಸಮಸ್ಯೆ", payment:"ಪಾವತಿ ಭಿನ್ನಾಭಿಪ್ರಾಯ", safety:"ಸುರಕ್ಷತೆ",
    bookings:"ಯಂತ್ರೋಪಕರಣ ಬುಕಿಂಗ್‌ಗಳು", noBookings:"ಇನ್ನೂ ಬುಕಿಂಗ್‌ಗಳಿಲ್ಲ. ಒಪ್ಪಿಕೊಂಡ ಯಂತ್ರೋಪಕರಣ ಕೊಡುಗೆಗಳು ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ.", transportJobs:"ಕೃಷಿಟ್ರಾನ್ಸಿಟ್ ಕೆಲಸಗಳು", noTransportJobs:"ಒಪ್ಪಿಕೊಂಡ ಸಾರಿಗೆ ವಿನಂತಿಗಳು ಇಲ್ಲಿ ಟ್ರ್ಯಾಕ್ ಮಾಡಬಹುದಾದ ಕೆಲಸಗಳಾಗುತ್ತವೆ.", pickupReady:"ಪಿಕಪ್‌ಗೆ ಸಿದ್ಧ", pickedUp:"ಸರಕು ಪಡೆದಿದೆ", inTransit:"ಸಾಗಣೆಯಲ್ಲಿದೆ", deliveredPending:"ವಿತರಿಸಲಾಗಿದೆ — ಸ್ವೀಕರಿಸುವವರ ದೃಢೀಕರಣ ಬಾಕಿ", transportComplete:"ಸ್ವೀಕೃತಿ ದೃಢಪಡಿಸಿ", transportEvidence:"ಸಾರಿಗೆ / ವಿತರಣೆ ಸಾಕ್ಷ್ಯ", transportNote:"ಸ್ಥಿತಿ ಅಥವಾ ವಿತರಣೆ ಟಿಪ್ಪಣಿ", transportRoute:"ಪಿಕಪ್ → ಗಮ್ಯಸ್ಥಾನ", transportVehicle:"ವಾಹನ / ಸಾಮರ್ಥ್ಯ", loading:"ಲೋಡಿಂಗ್", unloading:"ಅನ್‌ಲೋಡಿಂಗ್", toAgree:"ಒಪ್ಪಂದವಾಗಬೇಕು", requesterResponsibility:"ವಿನಂತಿದಾರರು", transporterResponsibility:"ಸಾರಿಗೆದಾರರು", sharedResponsibility:"ಹಂಚಿಕೆ", uploadTransportEvidence:"ಸಾರಿಗೆ ಸಾಕ್ಷ್ಯ ಅಪ್‌ಲೋಡ್", cancelTransport:"ಸಾರಿಗೆ ಕೆಲಸ ರದ್ದುಮಾಡಿ", cancel:"ಬುಕಿಂಗ್ ರದ್ದುಮಾಡಿ", cancelReason:"ರದ್ದತಿಯ ಕಾರಣ", reschedule:"ಮರುನಿಗದಿ", start:"ಕೆಲಸ ಪ್ರಾರಂಭಿಸಿ", complete:"ಕೆಲಸ ಪೂರ್ಣಗೊಳಿಸಿ", startAt:"ಹೊಸ ಸೇವಾ ಆರಂಭ",
    evidence:"ಕೆಲಸದ ಸಾಕ್ಷ್ಯ", evidenceType:"ಸಾಕ್ಷ್ಯದ ಪ್ರಕಾರ", before:"ಮೊದಲು ಫೋಟೋ", after:"ನಂತರ ಫೋಟೋ", workNote:"ಕೆಲಸದ ಟಿಪ್ಪಣಿ", delivery:"ವಿತರಣೆ ಟಿಪ್ಪಣಿ", otherEvidence:"ಇತರೆ", file:"ಫೋಟೋ ಅಥವಾ PDF ಆಯ್ಕೆಮಾಡಿ", upload:"ಸಾಕ್ಷ್ಯ ಅಪ್‌ಲೋಡ್",
    farmloop:"ಫಾರ್ಮ್‌ಲೂಪ್ ಸಂಸ್ಕಾರಕರ ವಿನಂತಿಗಳು", request:"ಸಂಸ್ಕಾರಕರ ಸ್ವೀಕೃತಿ ವಿನಂತಿ ಕಳುಹಿಸಿ", materialSpec:"ವಸ್ತು ವಿವರ / ಸ್ವೀಕೃತಿ ಷರತ್ತುಗಳು", price:"ಪ್ರಸ್ತಾಪಿತ ಬೆಲೆ ₹ ಪ್ರತಿ ಘಟಕ", quantity:"ಪ್ರಸ್ತಾಪಿತ ಪ್ರಮಾಣ", noByproducts:"ಸಕ್ರಿಯ ಉಪಉತ್ಪನ್ನ ಪಟ್ಟಿಗಳು ಲಭ್ಯವಿಲ್ಲ.",
    quality:"ವಸ್ತು ಗುಣಮಟ್ಟ ಪರಿಶೀಲನೆ", method:"ಪರೀಕ್ಷಾ ವಿಧಾನ / ಮಾದರಿ ಕ್ರಮ", lab:"ಪ್ರಯೋಗಾಲಯ / ಪರೀಕ್ಷಾ ಸಂಸ್ಥೆ", reportRef:"ವರದಿ ಉಲ್ಲೇಖ", tested:"ಪರೀಕ್ಷೆಯ ದಿನಾಂಕ", moisture:"ಅಳೆಯಲಾದ ತೇವಾಂಶ %", contamination:"ಅಳೆಯಲಾದ ಮಿಶ್ರಣ %", reportFile:"ವರದಿ ಸೇರಿಸಿ (PDF ಅಥವಾ ಚಿತ್ರ)", submitCheck:"ಗುಣಮಟ್ಟ ದಾಖಲೆ ಸಲ್ಲಿಸಿ",
    admin:"ಆಡಳಿತ", adminOnly:"Supabase app metadata ನಲ್ಲಿ admin ಪಾತ್ರ ನೀಡಿದ ಖಾತೆಗಳಿಗೆ ಮಾತ್ರ ಆಡಳಿತ ಸಾಧನಗಳು ಕಾಣಿಸುತ್ತವೆ.", moderation:"ಪಟ್ಟಿ ನಿಯಂತ್ರಣ", moderationReason:"ಈ ಕ್ರಮದ ಕಾರಣ (ಕನಿಷ್ಠ 10 ಅಕ್ಷರಗಳು)", applyModeration:"ಕ್ರಮ ಅನ್ವಯಿಸಿ", restore:"ಪಟ್ಟಿ ಮರುಸ್ಥಾಪಿಸಿ", pauseListing:"ಪಟ್ಟಿ ವಿರಾಮಗೊಳಿಸಿ", closeListing:"ಪಟ್ಟಿ ಮುಚ್ಚಿ", moderationHistory:"ಕೊನೆಯ ನಿಯಂತ್ರಣ ಕ್ರಮ", reports:"ಭಾಗವಹಿಸುವವರ ವರದಿಗಳು", disputes:"ತೆರೆದ ವಿವಾದಗಳು", qualityQueue:"ಗುಣಮಟ್ಟ ಪರಿಶೀಲನಾ ಸರತಿ", verification:"ಭಾಗವಹಿಸುವವರ ಪರಿಶೀಲನೆ", status:"ಸ್ಥಿತಿ", resolution:"ಪರಿಹಾರ ಟಿಪ್ಪಣಿ", review:"ಪರಿಶೀಲನೆ ಉಳಿಸಿ", verify:"ವರದಿ ಪರಿಶೀಲಿಸಿ", reject:"ತಿರಸ್ಕರಿಸಿ", verified:"ಪರಿಶೀಲಿಸಲಾಗಿದೆ", pending:"ಬಾಕಿ", open:"ತೆರೆದಿದೆ", inReview:"ಪರಿಶೀಲನೆಯಲ್ಲಿ", resolved:"ಪರಿಹರಿಸಲಾಗಿದೆ", dismissed:"ಮುಕ್ತಾಯ", noItems:"ಪರಿಶೀಲಿಸಲು ಏನೂ ಇಲ್ಲ.", noAccount:"ನಂಬಿಕೆ ಮತ್ತು ಸೇವಾ ಕಾರ್ಯವಿಧಾನಗಳಿಗೆ ಸೈನ್ ಇನ್ ಮಾಡಿ.", refresh:"ರಿಫ್ರೆಶ್", saved:"ಉಳಿಸಲಾಗಿದೆ.", failed:"ಕಾರ್ಯ ಪೂರ್ಣಗೊಳಿಸಲಾಗಲಿಲ್ಲ.", accepted:"ಒಪ್ಪಲಾಗಿದೆ", rejected:"ತಿರಸ್ಕರಿಸಲಾಗಿದೆ", withdrawn:"ಹಿಂಪಡೆಯಲಾಗಿದೆ", confirmed:"ದೃಢಪಟ್ಟಿದೆ", rescheduled:"ಮರುನಿಗದಿಯಾಗಿದೆ", inProgress:"ನಡೆಯುತ್ತಿದೆ", completed:"ಪೂರ್ಣಗೊಂಡಿದೆ", cancelled:"ರದ್ದಾಗಿದೆ", verifiedStatus:"ಪರಿಶೀಲಿಸಲಾಗಿದೆ", rejectedStatus:"ತಿರಸ್ಕರಿಸಲಾಗಿದೆ", unverified:"ಪರಿಶೀಲಿಸಿಲ್ಲ", requestReview:"ಪರಿಶೀಲನೆಗಾಗಿ ವಿನಂತಿಸಿ", reportedParticipant:"ವರದಿ ಮಾಡಿದ ಭಾಗವಹಿಸುವವರು", displayNameHint:"ಭಾಗವಹಿಸುವವರಿಗೆ ತೋರಿಸುವ ಹೆಸರು", processorDisclosure:"ಸಂಸ್ಕಾರಕ ಪಾತ್ರವನ್ನು ಪ್ರೊಫೈಲ್‌ನಲ್ಲಿ ಸ್ವಯಂ ಘೋಷಿಸಲಾಗಿದೆ; ಇದು ಸ್ವತಂತ್ರ ಮಾನ್ಯತೆ ಅಲ್ಲ.", pendingQuality:"ನಿರ್ವಾಹಕರು ವರದಿ ಮತ್ತು ಮಾಹಿತಿಯನ್ನು ಪರಿಶೀಲಿಸುವವರೆಗೆ ದಾಖಲೆಗಳು ಬಾಕಿಯಲ್ಲಿರುತ್ತವೆ.", verificationDisclosure:"ಭಾಗವಹಿಸುವವರ ಪರಿಶೀಲನೆ ಆಡಳಿತಾತ್ಮಕ ಪರಿಶೀಲನೆ ಮಾತ್ರ; ಇದು ಸರ್ಕಾರಿ ಗುರುತು ಅಥವಾ ಭೂಮಿ ಪರಿಶೀಲನೆ ಅಲ್ಲ.", reportFileLimit:"ವರದಿ ಫೈಲ್ 10 MB ಅಥವಾ ಕಡಿಮೆ ಇರಬೇಕು.", evidenceLimit:"ಸಾಕ್ಷ್ಯ ಫೈಲ್ 10 MB ಅಥವಾ ಕಡಿಮೆ ಇರಬೇಕು.", openReport:"ವರದಿ ತೆರೆಯಿರಿ ↗"
  }
} as const;

export function OperationsCenter({ onProfileUpdated }: { onProfileUpdated?: () => void } = {}) {
  const db = getSupabase();
  const { language, setLanguage } = useLanguage();
  const t = text[language];
  const enumLabel = (value:string) => {
    const labels:Record<string,string> = {
      pending:t.pending,open:t.open,in_review:t.inReview,resolved:t.resolved,dismissed:t.dismissed,rejected:t.rejectedStatus,
      accepted:t.accepted,withdrawn:t.withdrawn,confirmed:t.confirmed,rescheduled:t.rescheduled,in_progress:t.inProgress,completed:t.completed,cancelled:t.cancelled,
      misleading_listing:t.misleading,fraud_suspicion:t.fraud,harassment:t.harassment,unsafe_practice:t.unsafe,spam:t.spam,other:t.other,
      quality_mismatch:t.qualityMismatch,quantity_mismatch:t.quantityMismatch,late_or_missing:t.late,machinery_service:t.machinery,payment_disagreement:t.payment,safety:t.safety,
      before_photo:t.before,after_photo:t.after,work_note:t.workNote,delivery_note:t.delivery,booking_confirmed:language==="kn"?"ಬುಕಿಂಗ್ ದೃಢಪಟ್ಟಿದೆ":"Booking confirmed",
      booking_rescheduled:language==="kn"?"ಬುಕಿಂಗ್ ಮರುನಿಗದಿಯಾಗಿದೆ":"Booking rescheduled",booking_cancelled:language==="kn"?"ಬುಕಿಂಗ್ ರದ್ದಾಗಿದೆ":"Booking cancelled",
      job_started:language==="kn"?"ಕೆಲಸ ಪ್ರಾರಂಭವಾಗಿದೆ":"Job started",job_completed:language==="kn"?"ಕೆಲಸ ಪೂರ್ಣಗೊಂಡಿದೆ":"Job completed",booking_updated:language==="kn"?"ಬುಕಿಂಗ್ ನವೀಕರಿಸಲಾಗಿದೆ":"Booking updated",
      offer_received:language==="kn"?"ಹೊಸ ಕೊಡುಗೆ":"Offer received",offer_accepted:language==="kn"?"ಕೊಡುಗೆ ಒಪ್ಪಲಾಗಿದೆ":"Offer accepted",offer_rejected:language==="kn"?"ಕೊಡುಗೆ ತಿರಸ್ಕರಿಸಲಾಗಿದೆ":"Offer rejected",offer_withdrawn:language==="kn"?"ಕೊಡುಗೆ ಹಿಂಪಡೆಯಲಾಗಿದೆ":"Offer withdrawn",offer_completed:language==="kn"?"ಕೊಡುಗೆ ಪೂರ್ಣಗೊಂಡಿದೆ":"Offer completed",
      processor_request_received:language==="kn"?"ಸಂಸ್ಕಾರಕರ ವಿನಂತಿ ಬಂದಿದೆ":"Processor request received",processor_request_accepted:language==="kn"?"ಸಂಸ್ಕಾರಕರ ವಿನಂತಿ ಒಪ್ಪಲಾಗಿದೆ":"Processor request accepted",processor_request_rejected:language==="kn"?"ಸಂಸ್ಕಾರಕರ ವಿನಂತಿ ತಿರಸ್ಕರಿಸಲಾಗಿದೆ":"Processor request rejected",processor_request_withdrawn:language==="kn"?"ಸಂಸ್ಕಾರಕರ ವಿನಂತಿ ಹಿಂಪಡೆಯಲಾಗಿದೆ":"Processor request withdrawn",
      booking_created:language==="kn"?"ಬುಕಿಂಗ್ ರಚಿಸಲಾಗಿದೆ":"Booking created",pickup_ready:t.pickupReady,picked_up:t.pickedUp,in_transit:t.inTransit,delivered_pending_confirmation:t.deliveredPending,job_confirmed:language==="kn"?"ಸಾರಿಗೆ ಕೆಲಸ ದೃಢಪಟ್ಟಿದೆ":"Transport job confirmed",evidence_added:language==="kn"?"ಸಾಕ್ಷ್ಯ ಸೇರಿಸಲಾಗಿದೆ":"Evidence added",dispute_opened:language==="kn"?"ವಿವಾದ ತೆರೆಯಲಾಗಿದೆ":"Dispute opened",dispute_updated:language==="kn"?"ವಿವಾದ ನವೀಕರಿಸಲಾಗಿದೆ":"Dispute updated",report_submitted:language==="kn"?"ವರದಿ ಸಲ್ಲಿಸಲಾಗಿದೆ":"Report submitted",report_updated:language==="kn"?"ವರದಿ ನವೀಕರಿಸಲಾಗಿದೆ":"Report updated",
      quality_check_submitted:language==="kn"?"ಗುಣಮಟ್ಟ ದಾಖಲೆ ಸಲ್ಲಿಸಲಾಗಿದೆ":"Quality check submitted",quality_check_updated:language==="kn"?"ಗುಣಮಟ್ಟ ದಾಖಲೆ ನವೀಕರಿಸಲಾಗಿದೆ":"Quality check updated",listing_moderated:language==="kn"?"ಪಟ್ಟಿ ಪರಿಶೀಲಿಸಲಾಗಿದೆ":"Listing moderated",
      municipality_request_submitted:language==="kn"?"ಪುರಸಭೆ ವಿಚಾರಣೆ ಸಲ್ಲಿಸಲಾಗಿದೆ":"Municipal enquiry submitted",municipality_request_updated:language==="kn"?"ಪುರಸಭೆಯ ಪ್ರತಿಕ್ರಿಯೆ ನವೀಕರಿಸಲಾಗಿದೆ":"Municipal response updated",
      transport_job_created:language==="kn"?"ಸಾರಿಗೆ ಕೆಲಸ ರಚಿಸಲಾಗಿದೆ":"Transport job created",transport_job_updated:language==="kn"?"ಸಾರಿಗೆ ಕೆಲಸ ನವೀಕರಿಸಲಾಗಿದೆ":"Transport job updated",transport_job_started:language==="kn"?"ಸಾರಿಗೆ ಪಿಕಪ್ ಪ್ರಾರಂಭವಾಗಿದೆ":"Transport pickup started",transport_job_completed:language==="kn"?"ಸಾರಿಗೆ ವಿತರಣೆ ಪೂರ್ಣಗೊಂಡಿದೆ":"Transport delivery completed",transport_job_cancelled:language==="kn"?"ಸಾರಿಗೆ ಕೆಲಸ ರದ್ದಾಗಿದೆ":"Transport job cancelled",transport_evidence_added:language==="kn"?"ಸಾರಿಗೆ ಸಾಕ್ಷ್ಯ ಸೇರಿಸಲಾಗಿದೆ":"Transport evidence added",
      farmer:t.farmer,buyer:t.buyer,buyer_trader:t.buyer,provider:t.provider,machinery_owner:t.provider,processor:t.processor,waste_processor:t.processor,fpo:t.fpo,fpo_cooperative:t.fpo,municipality:t.municipality,transporter:t.transporter
    };
    return labels[value] ?? value.replaceAll("_"," ");
  };
  const [user,setUser] = useState<any>(null);
  const [admin,setAdmin] = useState(false);
  const [profile,setProfile] = useState<Row|null>(null);
  const [listings,setListings] = useState<Row[]>([]);
  const [offers,setOffers] = useState<Row[]>([]);
  const [bookings,setBookings] = useState<Row[]>([]);
  const [transportJobs,setTransportJobs] = useState<Row[]>([]);
  const [transportJobEvents,setTransportJobEvents] = useState<Row[]>([]);
  const [municipalityEnquiries,setMunicipalityEnquiries] = useState<Row[]>([]);
  const [reports,setReports] = useState<Row[]>([]);
  const [disputes,setDisputes] = useState<Row[]>([]);
  const [acceptances,setAcceptances] = useState<Row[]>([]);
  const [quality,setQuality] = useState<Row[]>([]);
  const [participants,setParticipants] = useState<Row[]>([]);
  const [bookingEvents,setBookingEvents] = useState<Row[]>([]);
  const [auditEvents,setAuditEvents] = useState<Row[]>([]);
  const [notifications,setNotifications] = useState<Row[]>([]);
  const [bookingEvidence,setBookingEvidence] = useState<Row[]>([]);
  const [moderationActions,setModerationActions] = useState<Row[]>([]);
  const [busy,setBusy] = useState(false);
  const [notice,setNotice] = useState("");
  const [error,setError] = useState("");

  const refresh = useCallback(async () => {
    if (!db || !user) return;
    setBusy(true); setError("");
    const results = await Promise.all([
      db.from("market_listings").select("id,title,owner_id,category,quantity,unit,status").order("created_at",{ascending:false}).limit(150),
      db.from("market_offers").select("id,listing_id,buyer_id,owner_id,status,offered_price_paise,accepted_quantity").order("created_at",{ascending:false}).limit(150),
      db.from("machinery_bookings").select("*").order("scheduled_start",{ascending:true}).limit(100),
      db.from("participant_reports").select("*").order("created_at",{ascending:false}).limit(100),
      db.from("market_disputes").select("*").order("created_at",{ascending:false}).limit(100),
      db.from("farmloop_processor_acceptances").select("*").order("created_at",{ascending:false}).limit(100),
      db.from("material_quality_checks").select("*").order("created_at",{ascending:false}).limit(100),
      db.from("user_profiles").select("*").eq("user_id",user.id).maybeSingle(),
      db.from("participant_notifications").select("*").order("created_at",{ascending:false}).limit(30),
      db.from("transport_jobs").select("*").order("scheduled_pickup",{ascending:true}).limit(100),
      db.from("municipality_service_enquiries").select("id,status,created_at").order("created_at",{ascending:false}).limit(100)
    ]);
    const failures=results.filter(r=>r.error);
    if(failures.length) setError(friendlyErrorMessage(failures[0].error?.message ?? t.failed, language, t.failed));
    setListings(results[0].data??[]);setOffers(results[1].data??[]);setBookings(results[2].data??[]);
    setReports(results[3].data??[]);setDisputes(results[4].data??[]);setAcceptances(results[5].data??[]);setQuality(results[6].data??[]);
    setProfile(results[7].data??null);setNotifications(results[8].data??[]);setTransportJobs(results[9].data??[]);setMunicipalityEnquiries(results[10].data??[]);
    const [eventRows,evidenceRows,participantRows,moderationRows,auditRows,transportEventRows] = await Promise.all([
      db.from("machinery_booking_events").select("*").order("created_at",{ascending:false}).limit(200),
      db.from("machinery_booking_evidence").select("*").order("created_at",{ascending:false}).limit(200),
      admin ? db.from("user_profiles").select("*").order("created_at",{ascending:false}).limit(200) : Promise.resolve({data:[],error:null}),
      admin ? db.from("listing_moderation_actions").select("*").order("created_at",{ascending:false}).limit(200) : Promise.resolve({data:[],error:null}),
      db.from("platform_audit_events").select("id,table_name,record_id,action,changed_fields,occurred_at,actor_id").order("occurred_at",{ascending:false}).limit(100),
      db.from("transport_job_events").select("*").order("created_at",{ascending:false}).limit(200)
    ]);
    if(eventRows.error||evidenceRows.error||participantRows.error||moderationRows.error||auditRows.error||transportEventRows.error) setError((eventRows.error||evidenceRows.error||participantRows.error||moderationRows.error||auditRows.error||transportEventRows.error)?.message??t.failed);
    setBookingEvents(eventRows.data??[]);setBookingEvidence(evidenceRows.data??[]);setParticipants(participantRows.data??[]);setModerationActions(moderationRows.data??[]);setAuditEvents(auditRows.data??[]);setTransportJobEvents(transportEventRows.data??[]);
    setBusy(false);
  },[db,user,t.failed,admin,language]);

  useEffect(()=>{
    if(!db)return;
    let alive=true;
    db.auth.getSession().then(({data})=>{
      if(!alive)return;
      const current=data.session?.user??null;
      setUser(current);setAdmin(current?.app_metadata?.role==="admin");
    });
    const {data}=db.auth.onAuthStateChange((_event,session)=>{
      const current=session?.user??null;
      setUser(current);setAdmin(current?.app_metadata?.role==="admin");
    });
    return()=>{alive=false;data.subscription.unsubscribe();};
  },[db]);

  useEffect(()=>{if(user)void refresh();else{setProfile(null);setListings([]);setOffers([]);setBookings([]);setReports([]);setDisputes([]);setAcceptances([]);setQuality([]);setModerationActions([]);}},[user,refresh]);

  async function requestVerification(){
    if(!db||!user||!profile||profile.verification_status==="pending"||profile.verification_status==="verified")return;
    setBusy(true);
    const {error}=await db.from("user_profiles").update({verification_status:"pending"}).eq("user_id",user.id);
    if(error)setError(friendlyErrorMessage(error, language, t.failed));else{setNotice(t.saved);await refresh();}
    setBusy(false);
  }

  async function markNotificationRead(id:string){
    if(!db||!user)return;
    const readAt=new Date().toISOString();
    const {error}=await db.from("participant_notifications").update({read_at:readAt}).eq("id",id).is("read_at",null);
    if(error){setError(friendlyErrorMessage(error, language, t.failed));return;}
    setNotifications(rows=>rows.map(row=>row.id===id?{...row,read_at:readAt}:row));
  }

  async function saveProfile(e:FormEvent<HTMLFormElement>){
    e.preventDefault();if(!db||!user)return;const form=e.currentTarget;const f=new FormData(form);
    setBusy(true);
    const displayName=String(f.get("display_name")??"").trim();
    const phone=String(f.get("phone")??"").trim();
    const district=String(f.get("district")??"").trim();
    const taluk=String(f.get("taluk")??"").trim();
    const village=String(f.get("village")??"").trim();
    const preferredLanguage=String(f.get("preferred_language"));
    const organisationName=String(f.get("organization_name")??"").trim();
    const requiresOrganisation=["municipality","fpo_cooperative"].includes(profile?.participant_type??"");
    if(displayName.length<2||phone.length<7||district.length<2||taluk.length<2||village.length<2||(requiresOrganisation&&organisationName.length<2)){setError(language==="kn"?"ಹೆಸರು, ಮೊಬೈಲ್ ಮತ್ತು ಸ್ಥಳದ ವಿವರಗಳನ್ನು ಸರಿಯಾಗಿ ಭರ್ತಿ ಮಾಡಿ.":"Enter a valid name, mobile number and complete location.");setBusy(false);return;}
    const payload={display_name:displayName,phone,district,taluk,village,organization_name:organisationName||null,preferred_language:preferredLanguage,profile_completed:true};
    const {error}=await db.from("user_profiles").update(payload).eq("user_id",user.id);
    if(error)setError(friendlyErrorMessage(error, language, t.failed));else{setNotice(t.saved);setLanguage(payload.preferred_language as "en"|"kn");await refresh();onProfileUpdated?.();}
    setBusy(false);
  }

  async function submitReport(e:FormEvent<HTMLFormElement>){
    e.preventDefault();if(!db||!user)return;const form=e.currentTarget;const f=new FormData(form);
    if(!String(f.get("listing_id")||"")&&!String(f.get("reported_user_id")||"")){setError(language==="kn"?"ಪಟ್ಟಿ ಅಥವಾ ಭಾಗವಹಿಸುವವರನ್ನು ಆಯ್ಕೆಮಾಡಿ.":"Select a listing or participant to report.");return;}
    setBusy(true);
    const {error}=await db.from("participant_reports").insert({reporter_id:user.id,listing_id:String(f.get("listing_id")||"")||null,reported_user_id:String(f.get("reported_user_id")||"")||null,reason:String(f.get("reason")),description:String(f.get("description")??"").trim()});
    if(error)setError(friendlyErrorMessage(error, language, t.failed));else{setNotice(t.saved);form.reset();await refresh();}
    setBusy(false);
  }

  async function submitDispute(e:FormEvent<HTMLFormElement>){
    e.preventDefault();if(!db||!user)return;const form=e.currentTarget;const f=new FormData(form);
    setBusy(true);
    const {error}=await db.from("market_disputes").insert({offer_id:String(f.get("offer_id")),opened_by:user.id,issue_type:String(f.get("issue_type")),description:String(f.get("description")??"").trim()});
    if(error)setError(friendlyErrorMessage(error, language, t.failed));else{setNotice(t.saved);form.reset();await refresh();}
    setBusy(false);
  }

  async function submitAcceptance(e:FormEvent<HTMLFormElement>){
    e.preventDefault();if(!db||!user)return;const form=e.currentTarget;const f=new FormData(form),listing=listings.find(x=>x.id===String(f.get("listing_id")));
    if(!listing){setError(t.failed);return;}
    setBusy(true);
    const {error}=await db.from("farmloop_processor_acceptances").insert({listing_id:listing.id,listing_owner_id:listing.owner_id,processor_id:user.id,proposed_quantity:Number(f.get("quantity")),proposed_price_paise:Math.round(Number(f.get("price"))*100),material_specification:String(f.get("specification")??"").trim()});
    if(error)setError(friendlyErrorMessage(error, language, t.failed));else{setNotice(t.saved);form.reset();await refresh();}
    setBusy(false);
  }

  async function submitQuality(e:FormEvent<HTMLFormElement>){
    e.preventDefault();if(!db||!user)return;const form=e.currentTarget;const f=new FormData(form),listingId=String(f.get("listing_id"));
    setBusy(true);
    try{
      const file=f.get("report_file") as File|null;let objectPath:string|null=null;
      if(file&&file.size){
        if(file.size>10*1024*1024)throw new Error(t.reportFileLimit);
        if(!["application/pdf","image/jpeg","image/png","image/webp"].includes(file.type))throw new Error(language==="kn"?"PDF ಅಥವಾ JPG, PNG, WebP ಚಿತ್ರ ಮಾತ್ರ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.":"Upload a PDF or JPG, PNG, WebP image only.");
        const ext=file.name.split(".").pop()?.toLowerCase()||"pdf";
        objectPath=listingId+"/"+user.id+"/"+crypto.randomUUID()+"."+ext;
        const upload=await db.storage.from("quality-reports").upload(objectPath,file,{contentType:file.type,upsert:false});
        if(upload.error)throw upload.error;
      }
      const {error}=await db.from("material_quality_checks").insert({listing_id:listingId,submitted_by:user.id,moisture_pct:f.get("moisture")?Number(f.get("moisture")):null,contamination_pct:f.get("contamination")?Number(f.get("contamination")):null,test_method:String(f.get("method")??"").trim(),laboratory_name:String(f.get("lab")??"").trim()||null,report_reference:String(f.get("report_reference")??"").trim()||null,report_object_path:objectPath,tested_at:String(f.get("tested_at")??"")||null});
      if(error)throw error;
      setNotice(t.saved);form.reset();await refresh();
    }catch(err){setError(friendlyErrorMessage(err, language, t.failed));}
    setBusy(false);
  }

  async function updateBooking(id:string,patch:Row){
    if(!db)return;setBusy(true);
    const {error}=await db.from("machinery_bookings").update(patch).eq("id",id);
    if(error)setError(friendlyErrorMessage(error, language, t.failed));else{setNotice(t.saved);await refresh();}
    setBusy(false);
  }

  async function uploadBookingEvidence(e:FormEvent<HTMLFormElement>,bookingId:string){
    e.preventDefault();if(!db||!user)return;const form=e.currentTarget;const f=new FormData(form),file=f.get("file") as File;
    if(!file||!file.size){setError(t.failed);return;}
    if(file.size>10*1024*1024){setError(t.evidenceLimit);return;}
    if(!["image/jpeg","image/png","image/webp","application/pdf"].includes(file.type)){setError(language==="kn"?"PDF ಅಥವಾ JPG, PNG, WebP ಚಿತ್ರ ಮಾತ್ರ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.":"Upload a PDF or JPG, PNG, WebP image only.");return;}
    setBusy(true);
    try{
      const ext=file.name.split(".").pop()?.toLowerCase()||"jpg";
      const path=bookingId+"/"+user.id+"/"+crypto.randomUUID()+"."+ext;
      const uploaded=await db.storage.from("booking-evidence").upload(path,file,{contentType:file.type,upsert:false});
      if(uploaded.error)throw uploaded.error;
      const {error}=await db.from("machinery_booking_evidence").insert({booking_id:bookingId,uploaded_by:user.id,evidence_type:String(f.get("evidence_type")),object_path:path,note:String(f.get("note")??"").trim()||null});
      if(error)throw error;
      setNotice(t.saved);form.reset();await refresh();
    }catch(err){setError(friendlyErrorMessage(err, language, t.failed));}
    setBusy(false);
  }

  async function updateTransportJob(id:string,status:string,note:string,cancellationReason?:string){
    if(!db)return;setBusy(true);setError("");
    const {error}=await db.from("transport_jobs").update({status,status_note:note.trim()||null,cancellation_reason:cancellationReason??null}).eq("id",id);
    if(error)setError(friendlyErrorMessage(error, language, t.failed));else{setNotice(t.saved);await refresh();}
    setBusy(false);
  }

  async function uploadTransportEvidence(e:FormEvent<HTMLFormElement>,jobId:string){
    e.preventDefault();if(!db||!user)return;const form=e.currentTarget,f=new FormData(form),file=f.get("file") as File;
    if(!file||!file.size){setError(t.failed);return;}
    if(file.size>10*1024*1024){setError(t.evidenceLimit);return;}
    if(!["image/jpeg","image/png","image/webp","application/pdf"].includes(file.type)){setError(language==="kn"?"PDF ಅಥವಾ JPG, PNG, WebP ಚಿತ್ರ ಮಾತ್ರ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.":"Upload a PDF or JPG, PNG, WebP image only.");return;}
    setBusy(true);setError("");
    try{const ext=file.name.split(".").pop()?.toLowerCase()||"jpg",path=jobId+"/"+user.id+"/"+crypto.randomUUID()+"."+ext;
      const upload=await db.storage.from("transport-evidence").upload(path,file,{contentType:file.type,upsert:false});if(upload.error)throw upload.error;
      const {error}=await db.from("transport_job_events").insert({job_id:jobId,actor_id:user.id,event_type:"evidence_added",note:String(f.get("note")??"").trim()||null,object_path:path});if(error)throw error;
      setNotice(t.saved);form.reset();await refresh();
    }catch(err){setError(friendlyErrorMessage(err, language, t.failed))}
    setBusy(false);
  }

  async function openTransportEvidence(path:string){
    if(!db)return;const {data,error}=await db.storage.from("transport-evidence").createSignedUrl(path,60);if(error)setError(friendlyErrorMessage(error, language, t.failed));else if(data?.signedUrl)window.open(data.signedUrl,"_blank","noopener,noreferrer");
  }

  async function updateAcceptance(id:string,status:"accepted"|"rejected"|"withdrawn") {
    if(!db)return;setBusy(true);const {error}=await db.from("farmloop_processor_acceptances").update({status}).eq("id",id);if(error)setError(friendlyErrorMessage(error, language, t.failed));else{setNotice(t.saved);await refresh();}setBusy(false);
  }

  async function openEvidence(path:string){
    if(!db)return;const {data,error}=await db.storage.from("booking-evidence").createSignedUrl(path,60);if(error)setError(friendlyErrorMessage(error, language, t.failed));else if(data?.signedUrl)window.open(data.signedUrl,"_blank","noopener,noreferrer");
  }

  async function openQualityReport(path:string){
    if(!db)return;const {data,error}=await db.storage.from("quality-reports").createSignedUrl(path,60);if(error)setError(friendlyErrorMessage(error, language, t.failed));else if(data?.signedUrl)window.open(data.signedUrl,"_blank","noopener,noreferrer");
  }

  async function adminModerateListing(id:string,status:string,reason:string){
    if(!db||!admin)return;
    if(reason.trim().length<10){setError(language==="kn"?"ಕನಿಷ್ಠ 10 ಅಕ್ಷರಗಳ ಕಾರಣ ನೀಡಿ.":"Provide a moderation reason of at least 10 characters.");return;}
    setBusy(true);
    const {error}=await db.rpc("admin_moderate_listing",{p_listing_id:id,p_status:status,p_reason:reason.trim()});
    if(error)setError(friendlyErrorMessage(error, language, t.failed));else{setNotice(t.saved);await refresh();}
    setBusy(false);
  }

  async function adminProfileUpdate(id:string,patch:Row){
    if(!db||!admin)return;setBusy(true);
    const {error}=await db.from("user_profiles").update(patch).eq("user_id",id);
    if(error)setError(friendlyErrorMessage(error, language, t.failed));else{setNotice(t.saved);await refresh();}
    setBusy(false);
  }

  async function adminUpdate(table:string,id:string,patch:Row){
    if(!db||!admin)return;setBusy(true);
    const {error}=await db.from(table).update(patch).eq("id",id);
    if(error)setError(friendlyErrorMessage(error, language, t.failed));else{setNotice(t.saved);await refresh();}
    setBusy(false);
  }

  if(!user)return <section className="operations-panel" id="operations"><div className="operations-heading"><span>{language==="kn"?"ನಂಬಿಕೆ ಮತ್ತು ಕಾರ್ಯಾಚರಣೆ":"TRUST & OPERATIONS"}</span><h2>{t.title}</h2><p>{t.noAccount}</p></div></section>;

  const ownListings = listings.filter(row => row.owner_id === user.id);
  const ownOffers = offers.filter(row => row.buyer_id === user.id || row.owner_id === user.id);
  const incomingOffers = offers.filter(row => row.owner_id === user.id && row.status === "pending");
  const outgoingOffers = offers.filter(row => row.buyer_id === user.id);
  const acceptedBuyerOffers = offers.filter(row => row.buyer_id === user.id && ["accepted","completed"].includes(row.status));
  const ownAcceptances = acceptances.filter(row => row.processor_id === user.id || row.listing_owner_id === user.id);
  const ownBookings = bookings.filter(row => row.provider_id === user.id);
  const role = profile?.participant_type ?? "farmer";
  const roleStats = role === "farmer" ? [
    { label:{en:"Your produce listings",kn:"ನಿಮ್ಮ ಬೆಳೆ ಪಟ್ಟಿಗಳು"}, value:ownListings.filter(row=>row.category==="produce").length },
    { label:{en:"Offers to review",kn:"ಪರಿಶೀಲಿಸಬೇಕಾದ ಕೊಡುಗೆಗಳು"}, value:incomingOffers.length },
    { label:{en:"Your FarmLoop listings",kn:"ನಿಮ್ಮ ಫಾರ್ಮ್‌ಲೂಪ್ ಪಟ್ಟಿಗಳು"}, value:ownListings.filter(row=>row.category==="byproduct").length },
  ] : role === "buyer_trader" || role === "buyer" ? [
    { label:{en:"Active produce listings",kn:"ಸಕ್ರಿಯ ಬೆಳೆ ಪಟ್ಟಿಗಳು"}, value:listings.filter(row=>row.category==="produce"&&row.status==="active").length },
    { label:{en:"Offers sent",kn:"ಕಳುಹಿಸಿದ ಕೊಡುಗೆಗಳು"}, value:outgoingOffers.length },
    { label:{en:"Accepted offers",kn:"ಒಪ್ಪಿಕೊಂಡ ಕೊಡುಗೆಗಳು"}, value:acceptedBuyerOffers.length },
  ] : role === "machinery_owner" || role === "provider" ? [
    { label:{en:"Your machinery listings",kn:"ನಿಮ್ಮ ಯಂತ್ರೋಪಕರಣ ಪಟ್ಟಿಗಳು"}, value:ownListings.filter(row=>row.category==="machinery").length },
    { label:{en:"Bookings to manage",kn:"ನಿರ್ವಹಿಸಬೇಕಾದ ಬುಕಿಂಗ್‌ಗಳು"}, value:ownBookings.length },
    { label:{en:"Requests to review",kn:"ಪರಿಶೀಲಿಸಬೇಕಾದ ವಿನಂತಿಗಳು"}, value:incomingOffers.filter(row=>listings.find(item=>item.id===row.listing_id)?.category==="machinery").length },
  ] : role === "waste_processor" || role === "processor" ? [
    { label:{en:"Available by-product listings",kn:"ಲಭ್ಯವಿರುವ ಉಪಉತ್ಪನ್ನ ಪಟ್ಟಿಗಳು"}, value:listings.filter(row=>row.category==="byproduct"&&row.status==="active").length },
    { label:{en:"Your processor requests",kn:"ನಿಮ್ಮ ಸಂಸ್ಕಾರಕ ವಿನಂತಿಗಳು"}, value:ownAcceptances.filter(row=>row.processor_id===user.id).length },
    { label:{en:"Visible quality records",kn:"ಕಾಣುವ ಗುಣಮಟ್ಟ ದಾಖಲೆಗಳು"}, value:quality.length },
  ] : role === "transporter" ? [
    { label:{en:"Your transport listings",kn:"ನಿಮ್ಮ ಸಾರಿಗೆ ಪಟ್ಟಿಗಳು"}, value:ownListings.filter(row=>row.category==="transport").length },
    { label:{en:"Transport requests",kn:"ಸಾರಿಗೆ ವಿನಂತಿಗಳು"}, value:ownOffers.filter(row=>listings.find(item=>item.id===row.listing_id)?.category==="transport").length },
    { label:{en:"Active transport jobs",kn:"ಸಕ್ರಿಯ ಸಾರಿಗೆ ಕೆಲಸಗಳು"}, value:transportJobs.filter(row=>row.transporter_id===user.id&&!['completed','cancelled'].includes(row.status)).length },
  ] : role === "municipality" ? [
    { label:{en:"New local enquiries",kn:"ಹೊಸ ಸ್ಥಳೀಯ ವಿಚಾರಣೆಗಳು"}, value:municipalityEnquiries.filter(row=>row.status==="submitted").length },
    { label:{en:"Enquiries in progress",kn:"ಪ್ರಗತಿಯಲ್ಲಿರುವ ವಿಚಾರಣೆಗಳು"}, value:municipalityEnquiries.filter(row=>["acknowledged","information_provided","referred"].includes(row.status)).length },
    { label:{en:"Closed enquiries",kn:"ಮುಚ್ಚಿದ ವಿಚಾರಣೆಗಳು"}, value:municipalityEnquiries.filter(row=>row.status==="closed").length },
  ] : [
    { label:{en:"Your organisation listings",kn:"ನಿಮ್ಮ ಸಂಸ್ಥೆಯ ಪಟ್ಟಿಗಳು"}, value:ownListings.length },
    { label:{en:"Offers involving your lots",kn:"ನಿಮ್ಮ ಪಟ್ಟಿಗಳಿಗೆ ಸಂಬಂಧಿಸಿದ ಕೊಡುಗೆಗಳು"}, value:ownOffers.length },
    { label:{en:"Accepted offers",kn:"ಒಪ್ಪಿಕೊಂಡ ಕೊಡುಗೆಗಳು"}, value:ownOffers.filter(row=>["accepted","completed"].includes(row.status)).length },
  ];

  return <section className="operations-panel" id="operations">
    <div className="operations-heading"><div><span>{language==="kn"?"ನಂಬಿಕೆ / ಸೇವೆ / ಗುಣಮಟ್ಟ":"TRUST / SERVICE / QUALITY"}</span><h2>{t.title}</h2><p>{t.intro}</p></div><button className="button button-quiet" onClick={()=>void refresh()} disabled={busy}>↻ {t.refresh}</button></div>
    <RoleDashboard role={role} stats={roleStats} />
    {error&&<div className="inline-alert error" role="alert">{error}<button onClick={()=>setError("")}>×</button></div>}
    {notice&&<div className="inline-alert success" role="status">{notice}<button onClick={()=>setNotice("")}>×</button></div>}

    {profile?.participant_type === "fpo_cooperative" && <FpoWorkspace />}

    <div className="operations-grid">
      <article className="operations-card">
        <h3>{t.profile}</h3>
        <form key={profile?.user_id??"profile-loading"} onSubmit={saveProfile} className="operations-form">
          <label>{t.name}<input name="display_name" maxLength={80} minLength={2} required defaultValue={profile?.display_name??""} placeholder={t.displayNameHint}/></label>
          <label>{t.role}<input value={enumLabel(profile?.participant_type??"farmer")} readOnly aria-readonly="true"/></label>
          <div className="operations-two"><label>{t.phone}<input name="phone" type="tel" minLength={7} maxLength={20} required defaultValue={profile?.phone??""}/></label><label>{t.language}<select name="preferred_language" defaultValue={profile?.preferred_language??language}><option value="en">{language==="kn"?"ಇಂಗ್ಲಿಷ್":"English"}</option><option value="kn">ಕನ್ನಡ</option></select></label></div>
          <div className="operations-two"><label>{t.district}<input name="district" required maxLength={80} defaultValue={profile?.district??""}/></label><label>{t.taluk}<input name="taluk" required maxLength={80} defaultValue={profile?.taluk??""}/></label></div>
          <label>{t.village}<input name="village" required maxLength={100} defaultValue={profile?.village??""}/></label>
          <label>{t.organisation}<input name="organization_name" maxLength={160} required={["municipality","fpo_cooperative"].includes(profile?.participant_type??"")} defaultValue={profile?.organization_name??""}/></label>
          <p className="operations-note">{t.profileComplete}: {profile?.profile_completed ? (language==="kn"?"ಪೂರ್ಣಗೊಂಡಿದೆ":"Complete") : t.profileIncomplete}</p>
          <p className="operations-note">{t.status}: {profile?.verification_status??t.unverified}. {profile?.verification_note??""}</p>
          <div className="operations-actions"><button className="button button-primary" disabled={busy}>{t.save}</button>{profile&&profile.verification_status!=="pending"&&profile.verification_status!=="verified"&&<button type="button" className="button button-quiet" onClick={()=>void requestVerification()} disabled={busy}>{t.requestReview}</button>}<button type="button" className="button button-quiet" onClick={()=>{if(db)void db.auth.signOut();}} disabled={busy}>{t.signOut}</button></div>
        </form>
      </article>

      <article className="operations-card">
        <h3>{t.report}</h3>
        <form onSubmit={submitReport} className="operations-form">
          <label>{t.listing}<select name="listing_id" defaultValue=""><option value="">—</option>{listings.map(l=><option key={l.id} value={l.id}>{l.title}</option>)}</select></label>
          <label>{t.reportedParticipant}<select name="reported_user_id" defaultValue=""><option value="">—</option>{Array.from(new Map(listings.map(l=>[l.owner_id,l])).entries()).filter(([owner])=>owner!==user.id).map(([owner,l])=><option key={owner} value={owner}>{l.title} · {owner.slice(0,8)}</option>)}</select></label>
          <label>{t.reason}<select name="reason"><option value="misleading_listing">{t.misleading}</option><option value="fraud_suspicion">{t.fraud}</option><option value="harassment">{t.harassment}</option><option value="unsafe_practice">{t.unsafe}</option><option value="spam">{t.spam}</option><option value="other">{t.otherReason}</option></select></label>
          <label>{t.description}<textarea name="description" required minLength={10} maxLength={2000} rows={3}/></label>
          <button className="button button-dark" disabled={busy}>{t.submit}</button>
        </form>
      </article>

      <article className="operations-card">
        <h3>{t.dispute}</h3>
        <form onSubmit={submitDispute} className="operations-form">
          <label>{t.offer}<select name="offer_id" required defaultValue=""><option value="">—</option>{offers.filter(o=>["accepted","completed"].includes(o.status)).map(o=><option key={o.id} value={o.id}>{listings.find(l=>l.id===o.listing_id)?.title??o.id.slice(0,8)} · {o.status} · {money(o.offered_price_paise)}</option>)}</select></label>
          <label>{t.issue}<select name="issue_type"><option value="quality_mismatch">{t.qualityMismatch}</option><option value="quantity_mismatch">{t.quantityMismatch}</option><option value="late_or_missing">{t.late}</option><option value="machinery_service">{t.machinery}</option><option value="payment_disagreement">{t.payment}</option><option value="safety">{t.safety}</option><option value="other">{t.other}</option></select></label>
          <label>{t.description}<textarea name="description" required minLength={10} maxLength={3000} rows={3}/></label>
          <button className="button button-dark" disabled={busy}>{t.submit}</button>
        </form>
      </article>

      {["waste_processor","processor"].includes(profile?.participant_type??"")&&<>
      <article className="operations-card">
        <h3>{t.request}</h3>
        <form onSubmit={submitAcceptance} className="operations-form">
          <label>{t.listing}<select name="listing_id" required defaultValue=""><option value="">—</option>{listings.filter(l=>l.category==="byproduct"&&l.status==="active"&&l.owner_id!==user.id).map(l=><option key={l.id} value={l.id}>{l.title} · {l.quantity} {l.unit}</option>)}</select></label>
          <label>{t.quantity}<input name="quantity" type="number" min=".001" step=".001" required/></label>
          <label>{t.price}<input name="price" type="number" min="0" step=".01" required/></label>
          <label>{t.materialSpec}<textarea name="specification" required minLength={5} maxLength={1000} rows={3}/></label>
          <button className="button button-dark" disabled={busy}>{t.submit}</button>
          <small>{t.processorDisclosure}</small>
        </form>
      </article>
      </>}

      {["farmer","fpo_cooperative","waste_processor","processor"].includes(profile?.participant_type??"")&&<>
      <article className="operations-card">
        <h3>{t.quality}</h3>
        <form onSubmit={submitQuality} className="operations-form">
          <label>{t.listing}<select name="listing_id" required defaultValue=""><option value="">—</option>{listings.filter(l=>l.category==="byproduct"&&(l.owner_id===user.id||acceptances.some(a=>a.listing_id===l.id&&a.processor_id===user.id&&a.status==="accepted"))).map(l=><option key={l.id} value={l.id}>{l.title}</option>)}</select></label>
          <div className="operations-two"><label>{t.moisture}<input name="moisture" type="number" min="0" max="100" step=".01"/></label><label>{t.contamination}<input name="contamination" type="number" min="0" max="100" step=".01"/></label></div>
          <label>{t.method}<input name="method" required minLength={3} maxLength={300}/></label>
          <label>{t.lab}<input name="lab" maxLength={160}/></label>
          <label>{t.reportRef}<input name="report_reference" maxLength={200}/></label>
          <label>{t.tested}<input name="tested_at" type="date"/></label>
          <label>{t.reportFile}<input name="report_file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp"/></label>
          <button className="button button-dark" disabled={busy}>{t.submitCheck}</button>
          <small>{t.pendingQuality}</small>
        </form>
      </article>
      </>}
    </div>

    <div className="operations-section">
      <div className="operations-heading"><div><h3>{t.notifications}</h3><p className="operations-note">{notifications.filter(row=>!row.read_at).length} {t.unread}</p></div><button className="button button-quiet" onClick={()=>void refresh()} disabled={busy}>{t.refresh}</button></div>
      {notifications.length===0?<p className="operations-empty">{t.noNotifications}</p>:notifications.map(notification=><article className="operations-row" key={notification.id}>
        <div><b>{language==="kn"?notification.title_kn:notification.title_en}</b><p>{language==="kn"?notification.body_kn:notification.body_en}</p><small>{enumLabel(notification.event_type)} · {new Date(notification.created_at).toLocaleString(language==="kn"?"kn-IN":"en-IN")}</small></div>
        {!notification.read_at&&<button className="button button-quiet" onClick={()=>void markNotificationRead(notification.id)} disabled={busy}>{t.markRead}</button>}
      </article>)}
    </div>

    <div className="operations-section">
      <h3>{t.bookings}</h3>
      {bookings.length===0?<p className="operations-empty">{t.noBookings}</p>:bookings.map(b=><article className="operations-row" key={b.id}>
        <div><b>{listings.find(l=>l.id===b.listing_id)?.title??(language==="kn"?"ಯಂತ್ರೋಪಕರಣ ಸೇವೆ":"Machinery service")}</b><p>{new Date(b.scheduled_start).toLocaleString(language==="kn"?"kn-IN":"en-IN")} · {b.duration_hours} {language==="kn"?"ಗಂಟೆ":"hrs"} · {t[b.status as keyof typeof t]??b.status}</p><small>{language==="kn"?"ಬುಕಿಂಗ್":"Booking"} {b.id.slice(0,8)}</small></div>
        <div className="operations-actions">
          {b.provider_id===user.id&&["confirmed","rescheduled"].includes(b.status)&&<><form onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);void updateBooking(b.id,{status:"rescheduled",scheduled_start:new Date(String(f.get("start"))).toISOString()});}}><label>{t.startAt}<input type="datetime-local" name="start" required min={new Date(Date.now()+60000-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16)}/></label><button className="button button-quiet" disabled={busy}>{t.reschedule}</button></form><button className="button button-quiet" onClick={()=>void updateBooking(b.id,{status:"in_progress"})} disabled={busy}>{t.start}</button></>}
          {b.provider_id===user.id&&b.status==="in_progress"&&<button className="button button-primary" onClick={()=>void updateBooking(b.id,{status:"completed"})} disabled={busy}>{t.complete}</button>}
          {["confirmed","rescheduled"].includes(b.status)&&<form onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);void updateBooking(b.id,{status:"cancelled",cancellation_reason:String(f.get("reason"))});}}><label>{t.cancelReason}<input name="reason" minLength={5} maxLength={500} required/></label><button className="button button-danger" disabled={busy}>{t.cancel}</button></form>}
          <form className="evidence-form" onSubmit={e=>void uploadBookingEvidence(e,b.id)}><label>{t.evidenceType}<select name="evidence_type"><option value="before_photo">{t.before}</option><option value="after_photo">{t.after}</option><option value="work_note">{t.workNote}</option><option value="delivery_note">{t.delivery}</option><option value="other">{t.otherEvidence}</option></select></label><input name="file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required/><input name="note" placeholder={t.evidence}/><button className="button button-quiet" disabled={busy}>{t.upload}</button></form>
          <div className="booking-history"><b>{t.evidence}</b>{bookingEvidence.filter(x=>x.booking_id===b.id).map(x=><button key={x.id} className="button button-quiet" onClick={()=>void openEvidence(x.object_path)}>{enumLabel(x.evidence_type)} · {new Date(x.created_at).toLocaleDateString(language==="kn"?"kn-IN":"en-IN")} ↗</button>)}{bookingEvents.filter(x=>x.booking_id===b.id).map(x=><small key={x.id}>{enumLabel(x.event_type)} · {new Date(x.created_at).toLocaleString(language==="kn"?"kn-IN":"en-IN")}</small>)}</div>
        </div>
      </article>)}
    </div>

    {(transportJobs.length>0 || profile?.participant_type==="transporter")&&<div className="operations-section">
      <h3>{t.transportJobs}</h3>
      {transportJobs.length===0?<p className="operations-empty">{t.noTransportJobs}</p>:transportJobs.map(job=><article className="operations-row transport-job-row" key={job.id}>
        <div className="transport-job-summary"><b>{job.pickup_location} → {job.destination}</b><p>{job.vehicle_type} · {job.capacity_tonnes} t · {new Date(job.scheduled_pickup).toLocaleString(language==="kn"?"kn-IN":"en-IN")}</p><small>{t.status}: {enumLabel(job.status)} · {t.loading}: {enumLabel(job.loading_responsibility)} · {t.unloading}: {enumLabel(job.unloading_responsibility)}</small></div>
        <div className="transport-job-actions">
          {job.transporter_id===user.id&&job.status==="confirmed"&&<button className="button button-primary" onClick={()=>void updateTransportJob(job.id,"pickup_ready","")} disabled={busy}>{t.pickupReady}</button>}
          {job.transporter_id===user.id&&job.status==="pickup_ready"&&<button className="button button-primary" onClick={()=>void updateTransportJob(job.id,"picked_up","")} disabled={busy}>{t.pickedUp}</button>}
          {job.transporter_id===user.id&&job.status==="picked_up"&&<button className="button button-primary" onClick={()=>void updateTransportJob(job.id,"in_transit","")} disabled={busy}>{t.inTransit}</button>}
          {job.transporter_id===user.id&&job.status==="in_transit"&&<button className="button button-primary" onClick={()=>void updateTransportJob(job.id,"delivered_pending_confirmation","")} disabled={busy}>{t.deliveredPending}</button>}
          {job.requester_id===user.id&&job.status==="delivered_pending_confirmation"&&<button className="button button-primary" onClick={()=>void updateTransportJob(job.id,"completed","")} disabled={busy}>{t.transportComplete}</button>}
          {job.status==="confirmed"||job.status==="pickup_ready"?<form onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);void updateTransportJob(job.id,"cancelled","",String(f.get("reason")??""));}}><label>{t.cancelReason}<input name="reason" required minLength={5} maxLength={500}/></label><button className="button button-danger" disabled={busy}>{t.cancelTransport}</button></form>:null}
          <form className="evidence-form" onSubmit={e=>void uploadTransportEvidence(e,job.id)}><label>{t.transportEvidence}<input name="file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required/></label><input name="note" maxLength={500} placeholder={t.transportNote}/><button className="button button-quiet" disabled={busy}>{t.uploadTransportEvidence}</button></form>
          <div className="booking-history">{transportJobEvents.filter(x=>x.job_id===job.id).map(event=><div key={event.id}><small>{enumLabel(event.event_type)} · {new Date(event.created_at).toLocaleString(language==="kn"?"kn-IN":"en-IN")}{event.note?` · ${event.note}`:""}</small>{event.object_path&&<button className="button button-quiet" onClick={()=>void openTransportEvidence(event.object_path)}>{t.openReport} ↗</button>}</div>)}</div>
        </div>
      </article>)}
    </div>}

    <div className="operations-section">
      <h3>{language === "kn" ? "ಖಾತೆ ಮತ್ತು ಡೇಟಾ ಚಟುವಟಿಕೆ ಇತಿಹಾಸ" : "Account and data activity history"}</h3>
      <p className="operations-note">{language === "kn" ? "ನಿಮ್ಮ ಖಾತೆಗೆ ಸಂಬಂಧಿಸಿದ ದಾಖಲಾದ ಅಪ್ಲಿಕೇಶನ್ ಬದಲಾವಣೆಗಳು. ಭದ್ರತಾ ಲಾಗಿನ್ ಸೆಷನ್ ದಾಖಲೆಗಳನ್ನು Supabase Auth ನಿರ್ವಹಿಸುತ್ತದೆ." : "Recorded application changes associated with your account. Authentication session logs are maintained separately by Supabase Auth."}</p>
      {auditEvents.length === 0 ? <p className="operations-empty">{t.noItems}</p> : auditEvents.map(event => <article className="operations-row" key={event.id}><div><b>{event.action} · {event.table_name.replaceAll("_", " ")}</b><p>{(event.changed_fields ?? []).join(", ") || "—"}</p><small>{event.record_id ?? ""}</small></div><small>{new Date(event.occurred_at).toLocaleString(language === "kn" ? "kn-IN" : "en-IN")}</small></article>)}
    </div>

    <div className="operations-section">
      <h3>{t.farmloop}</h3>
      {acceptances.length===0?<p className="operations-empty">{t.noItems}</p>:acceptances.map(a=><article className="operations-row" key={a.id}><div><b>{listings.find(l=>l.id===a.listing_id)?.title??"By-product listing"}</b><p>{a.proposed_quantity} · {money(a.proposed_price_paise)} · {a.material_specification}</p><small>{t.status}: {t[a.status as keyof typeof t]??a.status}</small></div><div className="operations-actions">{a.listing_owner_id===user.id&&a.status==="pending"&&<><button className="button button-primary" onClick={()=>void updateAcceptance(a.id,"accepted")} disabled={busy}>{t.accepted}</button><button className="button button-danger" onClick={()=>void updateAcceptance(a.id,"rejected")} disabled={busy}>{t.reject}</button></>}{a.processor_id===user.id&&a.status==="pending"&&<button className="button button-quiet" onClick={()=>void updateAcceptance(a.id,"withdrawn")} disabled={busy}>{t.withdrawn}</button>}</div></article>)}
    </div>

    {admin&&<div className="operations-admin">
      <div className="operations-section"><h3>{t.admin} · {t.moderation}</h3><p className="operations-note">{t.adminOnly}</p>{listings.length===0?<p className="operations-empty">{t.noItems}</p>:listings.map(l=><article className="operations-row" key={l.id}><div><b>{l.title}</b><p>{enumLabel(l.category)} · {l.quantity} {l.unit} · {enumLabel(l.status)}</p><small>{moderationActions.find(a=>a.listing_id===l.id)?.reason??""}</small></div><div className="operations-actions"><form onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);void adminModerateListing(l.id,String(f.get("status")),String(f.get("reason")));}}><label>{t.status}<select name="status" defaultValue={l.status}><option value="active">{t.restore}</option><option value="paused">{t.pauseListing}</option><option value="closed">{t.closeListing}</option></select></label><label>{t.moderationReason}<input name="reason" required minLength={10} maxLength={1000}/></label><button className="button button-dark" disabled={busy}>{t.applyModeration}</button></form></div></article>)}</div>
      <div className="operations-section"><h3>{t.admin} · {t.reports}</h3>{reports.length===0?<p className="operations-empty">{t.noItems}</p>:reports.map(r=><article className="operations-row" key={r.id}><div><b>{enumLabel(r.reason)}</b><p>{r.description}</p><small>{r.id.slice(0,8)} · {enumLabel(r.status)}</small></div><div className="operations-actions"><select aria-label={t.status} defaultValue={r.status} onChange={e=>void adminUpdate("participant_reports",r.id,{status:e.target.value,reviewed_by:user.id})}><option value="open">{t.open}</option><option value="in_review">{t.inReview}</option><option value="resolved">{t.resolved}</option><option value="dismissed">{t.dismissed}</option></select><input aria-label={t.resolution} placeholder={t.resolution} onBlur={e=>{if(e.target.value.trim())void adminUpdate("participant_reports",r.id,{resolution_note:e.target.value.trim(),reviewed_by:user.id});}}/></div></article>)}</div>
      <div className="operations-section"><h3>{t.admin} · {t.disputes}</h3>{disputes.length===0?<p className="operations-empty">{t.noItems}</p>:disputes.map(d=><article className="operations-row" key={d.id}><div><b>{enumLabel(d.issue_type)}</b><p>{d.description}</p><small>{d.id.slice(0,8)} · {enumLabel(d.status)}</small></div><div className="operations-actions"><select aria-label={t.status} defaultValue={d.status} onChange={e=>void adminUpdate("market_disputes",d.id,{status:e.target.value,reviewed_by:user.id})}><option value="open">{t.open}</option><option value="in_review">{t.inReview}</option><option value="resolved">{t.resolved}</option><option value="rejected">{t.reject}</option></select><input aria-label={t.resolution} placeholder={t.resolution} onBlur={e=>{if(e.target.value.trim())void adminUpdate("market_disputes",d.id,{resolution_note:e.target.value.trim(),reviewed_by:user.id});}}/></div></article>)}</div>
      <div className="operations-section"><h3>{t.admin} · {t.qualityQueue}</h3>{quality.length===0?<p className="operations-empty">{t.noItems}</p>:quality.map(q=><article className="operations-row" key={q.id}><div><b>{listings.find(l=>l.id===q.listing_id)?.title??q.listing_id.slice(0,8)}</b><p>{q.moisture_pct??"—"}% {language==="kn"?"ತೇವಾಂಶ":"moisture"} · {q.contamination_pct??"—"}% {language==="kn"?"ಮಿಶ್ರಣ":"contamination"} · {q.test_method} · {q.laboratory_name??(language==="kn"?"ಪ್ರಯೋಗಾಲಯದ ಹೆಸರು ಇಲ್ಲ":"No lab listed")}</p><small>{enumLabel(q.verification_status)} · {q.report_reference??(language==="kn"?"ವರದಿ ಉಲ್ಲೇಖ ಇಲ್ಲ":"No report reference")}</small></div><div className="operations-actions">{q.report_object_path&&<button className="button button-quiet" onClick={()=>void openQualityReport(q.report_object_path)}>{t.openReport}</button>}<button className="button button-primary" onClick={()=>void adminUpdate("material_quality_checks",q.id,{verification_status:"verified",verified_by:user.id})} disabled={busy}>{t.verify}</button><button className="button button-danger" onClick={()=>void adminUpdate("material_quality_checks",q.id,{verification_status:"rejected",verified_by:user.id})} disabled={busy}>{t.reject}</button></div></article>)}</div>
      <div className="operations-section"><h3>{t.admin} · {t.verification}</h3><p className="operations-note">{t.adminOnly}</p><p className="operations-note">{t.verificationDisclosure}</p>
        {participants.map(p=><article className="operations-row" key={p.user_id}><div><b>{p.display_name??p.user_id.slice(0,8)}</b><p>{enumLabel(p.participant_type)} · {p.preferred_language}</p><small>{p.user_id}</small></div><div className="operations-actions"><select aria-label={t.verification} defaultValue={p.verification_status} onChange={e=>void adminProfileUpdate(p.user_id,{verification_status:e.target.value,verification_note:p.verification_note})}><option value="unverified">{t.unverified}</option><option value="pending">{t.pending}</option><option value="verified">{t.verified}</option><option value="rejected">{t.rejectedStatus}</option></select><input aria-label={t.resolution} defaultValue={p.verification_note??""} placeholder={t.resolution} onBlur={e=>{if(e.target.value!==(p.verification_note??""))void adminProfileUpdate(p.user_id,{verification_note:e.target.value.trim()||null});}}/></div></article>)}
      </div>
    </div>}
  </section>;
}
