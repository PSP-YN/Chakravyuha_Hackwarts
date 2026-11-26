"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { friendlyErrorMessage } from "@/lib/error-message";
import { AudioGuideButton, useLanguage } from "@/components/language-provider";

type Contact = {
  id: string; district: string; taluk: string | null; jurisdiction: string;
  office_name: string; contact_person: string | null; phone: string | null;
  email: string | null; address: string | null; services: string[];
  source_url: string; verified_at: string | null; verified_by: string | null;
};

const civicKannada: Record<string,string> = {
  "Bengaluru Urban":"ಬೆಂಗಳೂರು ನಗರ ಜಿಲ್ಲೆ", "Mysuru":"ಮೈಸೂರು", "Tumakuru":"ತುಮಕೂರು",
  "Special Commissioner (SWM)":"ವಿಶೇಷ ಆಯುಕ್ತರು (ಘನ ತ್ಯಾಜ್ಯ ನಿರ್ವಹಣೆ)",
  "Joint Commissioner (Health and SWM)":"ಜಂಟಿ ಆಯುಕ್ತರು (ಆರೋಗ್ಯ ಮತ್ತು ಘನ ತ್ಯಾಜ್ಯ ನಿರ್ವಹಣೆ)",
  "Chief Engineer (SWM)":"ಮುಖ್ಯ ಇಂಜಿನಿಯರ್ (ಘನ ತ್ಯಾಜ್ಯ ನಿರ್ವಹಣೆ)",
  "Solid waste management":"ಘನ ತ್ಯಾಜ್ಯ ನಿರ್ವಹಣೆ",
  "Waste collection service enquiries":"ತ್ಯಾಜ್ಯ ಸಂಗ್ರಹ ಸೇವೆಗಳ ವಿಚಾರಣೆ",
  "Illegal dumping and burning complaint routing":"ಅಕ್ರಮ ತ್ಯಾಜ್ಯ ಸುರಿಯುವಿಕೆ ಮತ್ತು ಸುಡುವಿಕೆ ದೂರುಗಳು",
  "Health and SWM department enquiries":"ಆರೋಗ್ಯ ಮತ್ತು ಘನ ತ್ಯಾಜ್ಯ ನಿರ್ವಹಣಾ ಇಲಾಖೆಯ ವಿಚಾರಣೆ",
  "Solid waste management engineering enquiries":"ಘನ ತ್ಯಾಜ್ಯ ನಿರ್ವಹಣಾ ತಾಂತ್ರಿಕ ವಿಚಾರಣೆ",
  "Non-collection complaints":"ತ್ಯಾಜ್ಯ ಸಂಗ್ರಹಿಸದಿರುವ ಕುರಿತು ದೂರುಗಳು",
  "Illegal dumping complaints":"ಅಕ್ರಮ ತ್ಯಾಜ್ಯ ಸುರಿಯುವಿಕೆ ಕುರಿತು ದೂರುಗಳು",
  "Illegal waste burning complaints":"ಅಕ್ರಮ ತ್ಯಾಜ್ಯ ಸುಡುವಿಕೆ ಕುರಿತು ದೂರುಗಳು",
  "Municipal civic services":"ಪುರಸಭೆಯ ನಾಗರಿಕ ಸೇವೆಗಳು",
  "Solid waste management enquiries":"ಘನ ತ್ಯಾಜ್ಯ ನಿರ್ವಹಣೆ ಕುರಿತು ವಿಚಾರಣೆ",
  "Municipal civic office contact":"ಪುರಸಭೆ ಕಚೇರಿ ಸಂಪರ್ಕ",
  "Ask about local waste collection and residue disposal services":"ಸ್ಥಳೀಯ ತ್ಯಾಜ್ಯ ಸಂಗ್ರಹಣೆ ಮತ್ತು ಕೃಷಿ ಅವಶೇಷ ವಿಲೇವಾರಿ ಸೇವೆಗಳ ಬಗ್ಗೆ ವಿಚಾರಿಸಿ",
  "Official address and website published by Tumakuru District Administration":"ತುಮಕೂರು ಜಿಲ್ಲಾಡಳಿತ ಪ್ರಕಟಿಸಿದ ಅಧಿಕೃತ ವಿಳಾಸ ಮತ್ತು ವೆಬ್‌ಸೈಟ್",
  "Sira":"ಸಿರಾ","Tiptur":"ತಿಪಟೂರು","Gubbi":"ಗುಬ್ಬಿ","Koratagere":"ಕೊರಟಗೆರೆ","Turuvekere":"ತುರುವೇಕೆರೆ","Madhugiri":"ಮಧುಗಿರಿ","Chikkanayakanahalli":"ಚಿಕ್ಕನಾಯಕನಹಳ್ಳಿ","Kunigal":"ಕುಣಿಗಲ್","Pavagada":"ಪಾವಗಡ","H.D. Kote":"ಹೆಚ್.ಡಿ.ಕೋಟೆ","Hunsur":"ಹುಣಸೂರು","Krishnarajanagara":"ಕೆ.ಆರ್.ನಗರ","Periyapatna":"ಪಿರಿಯಾಪಟ್ಟಣ","Sargur":"ಸರಗೂರು","Bannur":"ಬನ್ನೂರು","T. Narasipura":"ತಿ.ನರಸೀಪುರ",
  "BBMP SWM Department — Chief Engineer":"ಬಿಬಿಎಂಪಿ ಘನ ತ್ಯಾಜ್ಯ ನಿರ್ವಹಣಾ ಇಲಾಖೆ — ಮುಖ್ಯ ಇಂಜಿನಿಯರ್","BBMP SWM Department — Joint Commissioner":"ಬಿಬಿಎಂಪಿ ಘನ ತ್ಯಾಜ್ಯ ನಿರ್ವಹಣಾ ಇಲಾಖೆ — ಜಂಟಿ ಆಯುಕ್ತರು","BBMP SWM Department — Special Commissioner":"ಬಿಬಿಎಂಪಿ ಘನ ತ್ಯಾಜ್ಯ ನಿರ್ವಹಣಾ ಇಲಾಖೆ — ವಿಶೇಷ ಆಯುಕ್ತರು","BBMP SWM Public Grievance Helpline":"ಬಿಬಿಎಂಪಿ ಘನ ತ್ಯಾಜ್ಯ ಸಾರ್ವಜನಿಕ ದೂರು ಸಹಾಯವಾಣಿ","Mysuru City Corporation — Main Office":"ಮೈಸೂರು ಮಹಾನಗರ ಪಾಲಿಕೆ — ಮುಖ್ಯ ಕಚೇರಿ","Bannur Town Municipal Council":"ಬನ್ನೂರು ಪಟ್ಟಣ ಪುರಸಭೆ","H.D. Kote Town Municipal Council":"ಹೆಚ್.ಡಿ.ಕೋಟೆ ಪಟ್ಟಣ ಪುರಸಭೆ","Hunsur City Municipal Council":"ಹುಣಸೂರು ನಗರಸಭೆ","Krishnarajanagara Town Municipal Council":"ಕೆ.ಆರ್.ನಗರ ಪಟ್ಟಣ ಪುರಸಭೆ","Nanjangud City Municipal Council":"ನಂಜನಗೂಡು ನಗರಸಭೆ","Periyapatna Town Municipal Council":"ಪಿರಿಯಾಪಟ್ಟಣ ಪಟ್ಟಣ ಪುರಸಭೆ","Sargur Town Panchayat":"ಸರಗೂರು ಪಟ್ಟಣ ಪಂಚಾಯಿತಿ","T. Narasipura Town Municipal Council":"ತಿ.ನರಸೀಪುರ ಪಟ್ಟಣ ಪುರಸಭೆ","Tumakuru City Corporation":"ತುಮಕೂರು ಮಹಾನಗರ ಪಾಲಿಕೆ","City Municipal Council Sira":"ಸಿರಾ ನಗರಸಭೆ","City Municipal Council Tiptur":"ತಿಪಟೂರು ನಗರಸಭೆ","Town Panchayat Gubbi":"ಗುಬ್ಬಿ ಪಟ್ಟಣ ಪಂಚಾಯಿತಿ","Town Panchayat Koratagere":"ಕೊರಟಗೆರೆ ಪಟ್ಟಣ ಪಂಚಾಯಿತಿ","Town Panchayat Turuvekere":"ತುರುವೇಕೆರೆ ಪಟ್ಟಣ ಪಂಚಾಯಿತಿ","Town Municipal Council Madhugiri":"ಮಧುಗಿರಿ ಪಟ್ಟಣ ಪುರಸಭೆ","Town Municipal Council Chikkanayakanahalli":"ಚಿಕ್ಕನಾಯಕನಹಳ್ಳಿ ಪಟ್ಟಣ ಪುರಸಭೆ","Town Municipal Council Kunigal":"ಕುಣಿಗಲ್ ಪಟ್ಟಣ ಪುರಸಭೆ","Town Municipal Council Pavagada":"ಪಾವಗಡ ಪಟ್ಟಣ ಪುರಸಭೆ",
  "City Municipal Council jurisdiction — Sira taluk":"ಸಿರಾ ತಾಲ್ಲೂಕು ನಗರಸಭೆ ವ್ಯಾಪ್ತಿ","City Municipal Council jurisdiction — Tiptur taluk":"ತಿಪಟೂರು ತಾಲ್ಲೂಕು ನಗರಸಭೆ ವ್ಯಾಪ್ತಿ","Town Panchayat jurisdiction — Gubbi taluk":"ಗುಬ್ಬಿ ತಾಲ್ಲೂಕು ಪಟ್ಟಣ ಪಂಚಾಯಿತಿ ವ್ಯಾಪ್ತಿ","Town Panchayat jurisdiction — Koratagere taluk":"ಕೊರಟಗೆರೆ ತಾಲ್ಲೂಕು ಪಟ್ಟಣ ಪಂಚಾಯಿತಿ ವ್ಯಾಪ್ತಿ","Town Panchayat jurisdiction — Turuvekere taluk":"ತುರುವೇಕೆರೆ ತಾಲ್ಲೂಕು ಪಟ್ಟಣ ಪಂಚಾಯಿತಿ ವ್ಯಾಪ್ತಿ","Town Municipal Council jurisdiction — Madhugiri taluk":"ಮಧುಗಿರಿ ತಾಲ್ಲೂಕು ಪಟ್ಟಣ ಪುರಸಭೆ ವ್ಯಾಪ್ತಿ","Town Municipal Council jurisdiction — Chikkanayakanahalli taluk":"ಚಿಕ್ಕನಾಯಕನಹಳ್ಳಿ ತಾಲ್ಲೂಕು ಪಟ್ಟಣ ಪುರಸಭೆ ವ್ಯಾಪ್ತಿ","Town Municipal Council jurisdiction — Kunigal taluk":"ಕುಣಿಗಲ್ ತಾಲ್ಲೂಕು ಪಟ್ಟಣ ಪುರಸಭೆ ವ್ಯಾಪ್ತಿ","Town Municipal Council jurisdiction — Pavagada taluk":"ಪಾವಗಡ ತಾಲ್ಲೂಕು ಪಟ್ಟಣ ಪುರಸಭೆ ವ್ಯಾಪ್ತಿ",
  "Municipal civic services enquiries":"ಪುರಸಭೆಯ ನಾಗರಿಕ ಸೇವೆಗಳ ವಿಚಾರಣೆಗಳು","Confirm local waste collection service availability":"ಸ್ಥಳೀಯ ತ್ಯಾಜ್ಯ ಸಂಗ್ರಹ ಸೇವೆಗಳ ಲಭ್ಯತೆಯನ್ನು ದೃಢಪಡಿಸಿ",
};

export function MunicipalityDirectory() {
  const { language } = useLanguage();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  useEffect(() => {
    const db = getSupabase();
    if (!db) { setLoading(false); setError(language === "kn" ? "ಸಂಪರ್ಕಿಸಲು ಡೇಟಾಬೇಸ್ ಲಭ್ಯವಿಲ್ಲ." : "Directory database is unavailable."); return; }
    db.auth.getSession().then(({ data }) => { const u = data.session?.user; setIsAdmin(u?.app_metadata?.role === "admin"); setAdminUserId(u?.id ?? null); });
    db.from("municipality_contacts").select("id,district,taluk,jurisdiction,office_name,contact_person,phone,email,address,services,source_url,verified_at,verified_by")
      .eq("is_active", true).order("district").then(({ data, error: queryError }) => {
        if (queryError) setError(language === "kn" ? "ಸಂಪರ್ಕ ವಿವರಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ." : "Could not load contact records.");
        else setContacts((data ?? []) as Contact[]);
        setLoading(false);
      });
  }, [language]);
  const kn = language === "kn";
  async function addContact(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const db = getSupabase();
    if (!db || !isAdmin || !adminUserId) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const { error: insertError } = await db.from("municipality_contacts").insert({
      district: String(form.get("district")), taluk: String(form.get("taluk") || "") || null,
      jurisdiction: String(form.get("jurisdiction")), office_name: String(form.get("office_name")),
      contact_person: String(form.get("contact_person") || "") || null, phone: String(form.get("phone") || "") || null,
      email: String(form.get("email") || "") || null, address: String(form.get("address") || "") || null,
      services: String(form.get("services") || "").split(",").map(x => x.trim()).filter(Boolean),
      source_url: String(form.get("source_url")), verified_at: String(form.get("verified_at")) || null,
      verified_by: adminUserId, is_active: form.get("is_active") === "on"
    });
    if (insertError) { setError(friendlyErrorMessage(insertError, language, language==="kn"?"ಸಂಪರ್ಕ ಸೇರಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.":"Unable to add this contact.")); return; }
    const { data } = await db.from("municipality_contacts").select("id,district,taluk,jurisdiction,office_name,contact_person,phone,email,address,services,source_url,verified_at,verified_by").eq("is_active", true).order("district");
    setContacts((data ?? []) as Contact[]);
    formElement.reset();
  }
type Enquiry = { id:string;contact_id:string;requester_id:string;material_type:string;quantity:number|null;unit:string|null;pickup_location:string;message:string;status:string;municipality_user_id:string|null;response_note:string|null;created_at:string;updated_at:string };
type EnquiryEvent = { id:number;enquiry_id:string;event_type:string;old_status:string|null;new_status:string;note:string|null;created_at:string };

function MunicipalityRequests({contacts}:{contacts:Contact[]}) {
  const {language}=useLanguage();const kn=language==="kn";const db=getSupabase();
  const [userId,setUserId]=useState<string|null>(null),[role,setRole]=useState(""),[profileComplete,setProfileComplete]=useState(false),[district,setDistrict]=useState(""),[verificationStatus,setVerificationStatus]=useState("pending");
  const [requests,setRequests]=useState<Enquiry[]>([]),[events,setEvents]=useState<EnquiryEvent[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
  const [selectedContact,setSelectedContact]=useState("");
  useEffect(()=>{if(!db)return;let alive=true;db.auth.getSession().then(({data})=>{if(alive)setUserId(data.session?.user.id??null)});const {data}=db.auth.onAuthStateChange((_event,session)=>{setUserId(session?.user.id??null);if(!session){setRole("");setProfileComplete(false);setDistrict("");setVerificationStatus("pending")}});return()=>{alive=false;data.subscription.unsubscribe()}},[db]);
  useEffect(()=>{if(!db||!userId)return;let alive=true;db.from("user_profiles").select("participant_type,profile_completed,district,verification_status").eq("user_id",userId).maybeSingle().then(({data})=>{if(alive&&data){setRole(data.participant_type);setProfileComplete(data.profile_completed);setDistrict(data.district??"");setVerificationStatus(data.verification_status??"pending")}});return()=>{alive=false}},[db,userId]);
  const t={title:kn?"ಪುರಸಭೆ ಸೇವಾ ವಿಚಾರಣೆಗಳು":"Municipal service enquiries",intro:kn?"ಸ್ಥಳೀಯ ತ್ಯಾಜ್ಯ ಸಂಗ್ರಹ ಅಥವಾ ಸುರಕ್ಷಿತ ವಿಲೇವಾರಿ ಕುರಿತು ಅಧಿಕೃತ ಕಚೇರಿಗೆ ವಿಚಾರಣೆ ಕಳುಹಿಸಿ. ಇದು ಸಂಗ್ರಹಣೆಯ ದೃಢೀಕೃತ ಬುಕಿಂಗ್ ಅಲ್ಲ.":"Send an enquiry to an official local-body contact about waste collection or safe disposal. This is not a confirmed collection booking.",login:kn?"ವಿಚಾರಣೆ ಸಲ್ಲಿಸಲು ಸೈನ್ ಇನ್ ಮಾಡಿ ಮತ್ತು ಪ್ರೊಫೈಲ್ ಪೂರ್ಣಗೊಳಿಸಿ.":"Sign in and complete your profile to submit an enquiry.",contact:kn?"ಪುರಸಭೆ / ಸ್ಥಳೀಯ ಸಂಸ್ಥೆ":"Municipal / local-body office",material:kn?"ವಸ್ತುವಿನ ಪ್ರಕಾರ":"Material type",quantity:kn?"ಪ್ರಮಾಣ (ಐಚ್ಛಿಕ)":"Quantity (optional)",unit:kn?"ಘಟಕ":"Unit",location:kn?"ಪಿಕಪ್ ಸ್ಥಳ":"Pickup location",message:kn?"ವಿವರಗಳು":"Details",send:kn?"ವಿಚಾರಣೆ ಕಳುಹಿಸಿ":"Send enquiry",history:kn?"ವಿಚಾರಣೆ ಇತಿಹಾಸ":"Enquiry history",empty:kn?"ಇನ್ನೂ ವಿಚಾರಣೆಗಳಿಲ್ಲ.":"No enquiries yet.",submit:kn?"ಸಲ್ಲಿಸಲಾಗಿದೆ":"Submitted",ack:kn?"ಸ್ವೀಕರಿಸಲಾಗಿದೆ":"Acknowledged",info:kn?"ಮಾಹಿತಿ ನೀಡಲಾಗಿದೆ":"Information provided",referred:kn?"ಸಂಬಂಧಿತ ಇಲಾಖೆಗೆ ಕಳುಹಿಸಲಾಗಿದೆ":"Referred",closed:kn?"ಮುಚ್ಚಲಾಗಿದೆ":"Closed",withdrawn:kn?"ಹಿಂಪಡೆಯಲಾಗಿದೆ":"Withdrawn",respond:kn?"ಸ್ಥಿತಿ ನವೀಕರಿಸಿ":"Update status",response:kn?"ಪುರಸಭೆಯ ಪ್ರತಿಕ್ರಿಯೆ":"Municipality response",withdraw:kn?"ವಿಚಾರಣೆ ಹಿಂಪಡೆಯಿರಿ":"Withdraw enquiry",submitted:kn?"ವಿಚಾರಣೆ ಸಲ್ಲಿಸಲಾಗಿದೆ.":"Enquiry submitted.",updated:kn?"ವಿಚಾರಣೆ ನವೀಕರಿಸಲಾಗಿದೆ.":"Enquiry updated.",needProfile:kn?"ಮುಂದುವರಿಯಲು ಪ್ರೊಫೈಲ್ ಪೂರ್ಣಗೊಳಿಸಿ.":"Complete your profile to continue.",noContacts:kn?"ನಿಮ್ಮ ಜಿಲ್ಲೆಯಲ್ಲಿ ಪ್ರಕಟಿತ ಅಧಿಕೃತ ಸಂಪರ್ಕ ಇಲ್ಲ.":"No published official contact is available for your district.",verificationRequired:kn?"ಪುರಸಭೆ ಖಾತೆಯ ಜಿಲ್ಲಾವಾರು ವಿಚಾರಣೆಗಳನ್ನು ನೋಡಲು ವೇದಿಕೆ ನಿರ್ವಾಹಕರ ಪರಿಶೀಲನೆ ಅಗತ್ಯ.":"A platform administrator must verify this municipality account before it can access district enquiries.",error:kn?"ವಿಚಾರಣೆಯನ್ನು ಪೂರ್ಣಗೊಳಿಸಲಾಗಲಿಲ್ಲ. ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಜಿಲ್ಲೆಯನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.":"Could not complete the municipal enquiry. Check your profile district and try again."};
  const refresh=useCallback(async()=>{if(!db||!userId)return;const {data,error}=await db.from("municipality_service_enquiries").select("id,contact_id,requester_id,material_type,quantity,unit,pickup_location,message,status,municipality_user_id,response_note,created_at,updated_at").order("created_at",{ascending:false}).limit(60);if(error){setError(friendlyErrorMessage(error, language, language === "kn" ? "ವಿಚಾರಣೆಯನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ." : "Unable to load enquiries."));return}const rows=(data??[]) as Enquiry[];setRequests(rows);const ids=rows.map(x=>x.id);if(ids.length){const {data:timeline,error:timelineError}=await db.from("municipality_service_enquiry_events").select("id,enquiry_id,event_type,old_status,new_status,note,created_at").in("enquiry_id",ids).order("created_at",{ascending:false});if(timelineError)setError(friendlyErrorMessage(timelineError, language, language === "kn" ? "ವಿಚಾರಣೆ ಇತಿಹಾಸವನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ." : "Unable to load enquiry history."));setEvents((timeline??[]) as EnquiryEvent[])}else setEvents([])},[db,userId,language]);
  useEffect(()=>{void refresh()},[refresh]);
  const isMunicipality=role==="municipality";
  const localContacts=contacts.filter(c=>!district||c.district.toLowerCase().trim()===district.toLowerCase().trim());
  const availableContacts=district?localContacts:contacts;
  useEffect(()=>{if(availableContacts.length&&!availableContacts.some(c=>c.id===selectedContact))setSelectedContact(availableContacts[0].id)},[availableContacts,selectedContact]);
  const materialLabels:Record<string,string>=kn?{crop_residue:"ಬೆಳೆ ಅವಶೇಷ",animal_manure:"ಪಶು ಗೊಬ್ಬರ",plastic_packaging:"ಪ್ಲಾಸ್ಟಿಕ್ ಪ್ಯಾಕಿಂಗ್",chemical_container:"ರಾಸಾಯನಿಕ ಪಾತ್ರೆ",contaminated:"ಕಲುಷಿತ ವಸ್ತು",mixed:"ಮಿಶ್ರ ತ್ಯಾಜ್ಯ",other:"ಇತರೆ"}:{crop_residue:"Crop residue",animal_manure:"Animal manure",plastic_packaging:"Plastic packaging",chemical_container:"Chemical container",contaminated:"Contaminated material",mixed:"Mixed waste",other:"Other"};
  const statusLabel=(status:string)=>({submitted:t.submit,acknowledged:t.ack,information_provided:t.info,referred:t.referred,closed:t.closed,withdrawn:t.withdrawn}[status]??status);
  async function submitEnquiry(e:FormEvent<HTMLFormElement>){e.preventDefault();if(!db||!userId)return;const form=e.currentTarget,v=new FormData(form),qty=String(v.get("quantity")??"").trim(),unit=String(v.get("unit")??"");setBusy(true);setError("");setNotice("");const {error}=await db.from("municipality_service_enquiries").insert({contact_id:String(v.get("contact_id")),requester_id:userId,material_type:String(v.get("material_type")),quantity:qty?Number(qty):null,unit:qty?unit:null,pickup_location:String(v.get("pickup_location")??"").trim(),message:String(v.get("message")??"").trim()});if(error)setError(friendlyErrorMessage(error, language, language === "kn" ? "ವಿಚಾರಣೆಯನ್ನು ಸಲ್ಲಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ." : "Unable to submit the enquiry."));else{form.reset();setNotice(t.submitted);await refresh()}setBusy(false)}
  async function updateEnquiry(e:FormEvent<HTMLFormElement>,request:Enquiry){e.preventDefault();if(!db||!userId)return;const v=new FormData(e.currentTarget),status=String(v.get("status")),response_note=String(v.get("response_note")??"").trim();setBusy(true);setError("");const {error}=await db.from("municipality_service_enquiries").update({status,response_note:response_note||null,municipality_user_id:userId}).eq("id",request.id);if(error)setError(friendlyErrorMessage(error, language, language === "kn" ? "ಪುರಸಭೆಯ ಪ್ರತಿಕ್ರಿಯೆಯನ್ನು ಉಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ." : "Unable to save the municipality response."));else{setNotice(t.updated);await refresh()}setBusy(false)}
  async function withdrawEnquiry(request:Enquiry){if(!db)return;const confirmed=window.confirm(kn?"ಈ ಸಲ್ಲಿಸಿದ ವಿಚಾರಣೆಯನ್ನು ಹಿಂಪಡೆಯಬೇಕೇ?":"Withdraw this submitted enquiry?");if(!confirmed)return;setBusy(true);setError("");const {error}=await db.from("municipality_service_enquiries").update({status:"withdrawn"}).eq("id",request.id);if(error)setError(friendlyErrorMessage(error, language, language === "kn" ? "ವಿಚಾರಣೆಯನ್ನು ಹಿಂಪಡೆಯಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ." : "Unable to withdraw the enquiry."));else{setNotice(t.updated);await refresh()}setBusy(false)}
  const nextStatuses=(status:string)=>status==="submitted"?["acknowledged","information_provided","referred","closed"]:status==="acknowledged"?["information_provided","referred","closed"]:status==="referred"?["acknowledged","information_provided","closed"]:status==="information_provided"?["closed"]:[];
  return <section className="municipality-requests" aria-labelledby="municipality-requests-title"><div className="civic-heading"><div><span className="kicker">{kn?"ಸ್ಥಳೀಯ ಸೇವೆಗಳ ಸಂಯೋಜನೆ":"LOCAL SERVICE COORDINATION"}</span><h2 id="municipality-requests-title">{t.title}</h2><p>{t.intro}</p></div></div>
    {notice&&<p className="inline-alert success" role="status">{notice}</p>}{error&&<p className="inline-alert error" role="alert">{error}</p>}
    {!userId?<div className="civic-empty"><p>{t.login}</p><a className="button button-primary" href="/login">{kn?"ಸೈನ್ ಇನ್":"Sign in"} ↗</a></div>:!profileComplete?<p className="civic-empty">{t.needProfile} <a href="/workspace#operations">{kn?"ಪ್ರೊಫೈಲ್ ತೆರೆಯಿರಿ":"Open profile"} ↗</a></p>:isMunicipality&&verificationStatus!=="verified"?<p className="civic-empty">{t.verificationRequired} <a href="/workspace#operations">{kn?"ಖಾತೆ ಸ್ಥಿತಿ ನೋಡಿ":"Review account status"} ↗</a></p>:<>
      {!isMunicipality&&<form className="municipality-enquiry-form" onSubmit={submitEnquiry}><label>{t.contact}<select name="contact_id" value={selectedContact} onChange={e=>setSelectedContact(e.target.value)} required><option value="">—</option>{availableContacts.map(c=><option key={c.id} value={c.id}>{c.office_name} · {c.district}</option>)}</select></label><div className="civic-form-grid"><label>{t.material}<select name="material_type">{Object.entries(materialLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label>{t.quantity}<input name="quantity" type="number" min="0.001" step="0.001"/></label><label>{t.unit}<select name="unit"><option value="kg">kg</option><option value="quintal">quintal</option><option value="tonne">tonne</option><option value="lot">lot</option></select></label><label>{t.location}<input name="pickup_location" required minLength={2} maxLength={160} defaultValue="" placeholder={kn?"ಗ್ರಾಮ, ತಾಲೂಕು, ಜಿಲ್ಲೆ":"Village, taluk, district"}/></label></div><label>{t.message}<textarea name="message" required minLength={10} maxLength={1000} rows={3}/></label><button className="button button-primary" disabled={busy||availableContacts.length===0}>{busy?(kn?"ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ…":"Sending…"):t.send}</button>{availableContacts.length===0&&<small>{t.noContacts}</small>}</form>}
      <div className="municipality-enquiry-history"><h3>{t.history}</h3>{requests.length===0?<p className="operations-empty">{t.empty}</p>:requests.map(request=><article className="municipality-enquiry-card" key={request.id}><div className="municipality-enquiry-head"><div><b>{contacts.find(c=>c.id===request.contact_id)?.office_name??(kn?"ಸ್ಥಳೀಯ ಕಚೇರಿ":"Local office")}</b><small>{materialLabels[request.material_type]??request.material_type} · {request.quantity?`${request.quantity} ${request.unit}`:""} · {request.pickup_location}</small></div><span className={`municipality-status status-${request.status}`}>{statusLabel(request.status)}</span></div><p>{request.message}</p>{request.response_note&&<div className="municipality-response"><b>{t.response}</b><p>{request.response_note}</p></div>}
        {isMunicipality&&nextStatuses(request.status).length>0&&<form className="municipality-response-form" onSubmit={e=>void updateEnquiry(e,request)}><label>{t.respond}<select name="status" defaultValue={nextStatuses(request.status)[0]}>{nextStatuses(request.status).map(st=><option key={st} value={st}>{statusLabel(st)}</option>)}</select></label><label>{t.response}<textarea name="response_note" minLength={5} maxLength={1000} rows={2} required defaultValue={request.response_note??""}/></label><button className="button button-primary" disabled={busy}>{t.respond}</button></form>}
        {!isMunicipality&&request.requester_id===userId&&request.status==="submitted"&&<button className="button button-quiet" onClick={()=>void withdrawEnquiry(request)} disabled={busy}>{t.withdraw}</button>}
        <div className="municipality-enquiry-timeline">{events.filter(ev=>ev.enquiry_id===request.id).map(ev=><small key={ev.id}>{statusLabel(ev.event_type)} · {new Date(ev.created_at).toLocaleString(kn?"kn-IN":"en-IN")}{ev.note?` · ${ev.note}`:""}</small>)}</div>
      </article>)}</div>
    </>}
  </section>;
}

  return <section className="civic-directory" id="municipality-directory" aria-labelledby="civic-title">
    <div className="civic-heading"><div><span className="kicker">{kn ? "ಸ್ಥಳೀಯ ಸಾರ್ವಜನಿಕ ಸೇವೆಗಳು" : "LOCAL PUBLIC SERVICES"}</span><h2 id="civic-title">{kn ? "ಪುರಸಭೆ ಮತ್ತು ತ್ಯಾಜ್ಯ ಸಂಗ್ರಹ ಸಂಪರ್ಕಗಳು" : "Municipality & waste collection contacts"}</h2><p>{kn ? "ಮರುಬಳಕೆ ಮಾಡಲಾಗದ ಕೃಷಿ ತ್ಯಾಜ್ಯ ಅಥವಾ ಸ್ಥಳೀಯ ಸಂಗ್ರಹ ಸೇವೆಗಳಿಗಾಗಿ ಅಧಿಕೃತ ಮೂಲದೊಂದಿಗೆ ಪರಿಶೀಲಿಸಿದ ಸಂಪರ್ಕ ವಿವರಗಳನ್ನು ಬಳಸಿ." : "Use official, source-checked contacts for non-reusable farm waste and municipal collection services."}</p></div><AudioGuideButton guide="municipality" compact /></div>
    {isAdmin && <form className="civic-admin-form" onSubmit={addContact}><b>{kn ? "ನಿರ್ವಾಹಕ: ಪರಿಶೀಲಿತ ಸಂಪರ್ಕ ಸೇರಿಸಿ" : "Admin: add a verified contact"}</b><div className="civic-admin-grid"><input name="office_name" required placeholder={kn ? "ಕಚೇರಿ ಹೆಸರು" : "Office name"}/><input name="jurisdiction" required placeholder={kn ? "ಅಧಿಕಾರ ವ್ಯಾಪ್ತಿ" : "Jurisdiction"}/><input name="district" required placeholder={kn ? "ಜಿಲ್ಲೆ" : "District"}/><input name="taluk" placeholder={kn ? "ತಾಲೂಕು" : "Taluk"}/><input name="contact_person" placeholder={kn ? "ಸಂಪರ್ಕ ವ್ಯಕ್ತಿ" : "Contact person"}/><input name="phone" placeholder={kn ? "ದೂರವಾಣಿ" : "Phone"}/><input name="email" type="email" placeholder="Email"/><input name="address" placeholder={kn ? "ವಿಳಾಸ" : "Address"}/><input name="services" placeholder={kn ? "ಸೇವೆಗಳು (ಅಲ್ಪವಿರಾಮದಿಂದ ಬೇರ್ಪಡಿಸಿ)" : "Services (comma separated)"}/><input name="source_url" type="url" required placeholder="Official source URL"/><input name="verified_at" type="date" required aria-label={kn ? "ಪರಿಶೀಲಿಸಿದ ದಿನಾಂಕ" : "Verified date"}/><label><input name="is_active" type="checkbox"/> {kn ? "ಸಾರ್ವಜನಿಕವಾಗಿ ಪ್ರಕಟಿಸಿ" : "Publish publicly"}</label></div><button className="button button-primary">{kn ? "ಸಂಪರ್ಕ ಉಳಿಸಿ" : "Save contact"}</button></form>}
    {loading ? <p className="operations-empty">{kn ? "ಸಂಪರ್ಕಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ…" : "Loading contacts…"}</p>
      : error ? <p className="inline-alert warning">{error}</p>
      : contacts.length === 0 ? <div className="civic-empty"><b>{kn ? "ಇನ್ನೂ ಮೂಲ ಪರಿಶೀಲಿತ ಸಂಪರ್ಕ ದಾಖಲೆಗಳಿಲ್ಲ." : "No source-checked municipal contacts have been published yet."}</b><p>{kn ? "ತಪ್ಪಾದ ಸಂಖ್ಯೆಯನ್ನು ತೋರಿಸುವುದಕ್ಕಿಂತ, ನಿಮ್ಮ ಗ್ರಾಮ ಪಂಚಾಯಿತಿ ಅಥವಾ ಪುರಸಭೆಯ ಅಧಿಕೃತ ಕಚೇರಿಯಲ್ಲಿ ಸಂಪರ್ಕ ವಿವರಗಳನ್ನು ದೃಢಪಡಿಸಿ. ನಿರ್ವಾಹಕರು ಮೂಲ ಮತ್ತು ಪರಿಶೀಲನೆ ದಿನಾಂಕದೊಂದಿಗೆ ಸಂಪರ್ಕವನ್ನು ಸೇರಿಸಬಹುದು." : "Rather than display an unverified number, confirm the contact with your Gram Panchayat or municipal office. An administrator can publish a contact with its source and verification date."}</p></div>
      : <div className="civic-grid">{contacts.map(c => <article className="civic-card" key={c.id}>
        <span className="civic-location">{[c.taluk,c.district].filter((v):v is string=>Boolean(v)).map(v=>kn?(civicKannada[v]??v):v).join(" · ")}</span><h3>{kn?(civicKannada[c.office_name]??c.office_name):c.office_name}</h3><p>{kn?(civicKannada[c.jurisdiction]??c.jurisdiction):c.jurisdiction}</p>
        {c.contact_person && <p>{kn ? "ಸಂಪರ್ಕ ವ್ಯಕ್ತಿ" : "Contact"}: {kn?(civicKannada[c.contact_person]??c.contact_person):c.contact_person}</p>}
        {c.address && <p>{c.address}</p>}
        {c.services?.length > 0 && <p>{c.services.map(service=>kn?(civicKannada[service]??service):service).join(" · ")}</p>}
        <div className="civic-actions">{c.phone && <a href={`tel:${c.phone}`}>{kn ? "ಕರೆ ಮಾಡಿ" : "Call"} {c.phone}</a>}{c.email && <a href={`mailto:${c.email}`}>{kn ? "ಇಮೇಲ್" : "Email"}</a>}</div>
        <small>{kn ? "ಮೂಲ" : "Source"}: <a href={c.source_url} target="_blank" rel="noreferrer">{kn ? "ಪರಿಶೀಲಿಸಿ" : "Verify source"} ↗</a> · {c.verified_at ? (c.verified_by ? (kn ? "ನಿರ್ವಾಹಕರು ಪರಿಶೀಲಿಸಿದ್ದಾರೆ" : "Admin verified") : (kn ? "ಅಧಿಕೃತ ಮೂಲ ಪರಿಶೀಲಿಸಲಾಗಿದೆ" : "Official source checked")) + ": " + c.verified_at : (kn ? "ಪರಿಶೀಲನೆ ದಿನಾಂಕ ದಾಖಲಾಗಿಲ್ಲ" : "Verification date not recorded")}</small>
      </article>)}</div>}
    <MunicipalityRequests contacts={contacts}/>
  </section>;
}

export function FarmWasteGuide() {
  const { language } = useLanguage();
  const kn = language === "kn";
  const sections = kn ? [
    ["ಹೊಲದಲ್ಲೇ ಉಪಯೋಗಿಸಬಹುದಾದ ಅವಶೇಷಗಳು","ಮಣ್ಣಿಗೆ ಹೊಂದುವ ಮತ್ತು ರೋಗ/ರಾಸಾಯನಿಕಗಳಿಂದ ಕಲುಷಿತವಾಗದ ಬೆಳೆ ಅವಶೇಷಗಳನ್ನು ಮಲ್ಚ್ ಅಥವಾ ಕಾಂಪೋಸ್ಟ್ ಆಗಿ ಬಳಸುವ ಸಾಧ್ಯತೆಯನ್ನು ಪರಿಶೀಲಿಸಿ. ಸ್ಥಳೀಯ ಕೃಷಿ ಅಧಿಕಾರಿಯ ಸಲಹೆ ಪಡೆಯಿರಿ."],
    ["ಪಶು ಆಹಾರ ಅಥವಾ ಜೈವಿಕ ಅನಿಲ","ಬೆಳೆ ಅವಶೇಷವನ್ನು ಪಶು ಆಹಾರವಾಗಿ ಬಳಸುವ ಮೊದಲು ಅದು ಆ ಪ್ರಾಣಿಗೆ ಸುರಕ್ಷಿತವೇ ಎಂದು ಪಶುವೈದ್ಯರು ಅಥವಾ ಕೃಷಿ ತಜ್ಞರಿಂದ ದೃಢಪಡಿಸಿ. ಸೂಕ್ತ ವಸ್ತುಗಳನ್ನು ಮಾತ್ರ ಜೈವಿಕ ಅನಿಲ ಘಟಕಕ್ಕೆ ನೀಡಿ."],
    ["ಮಾರಾಟ ಅಥವಾ ಸಂಗ್ರಹಕ್ಕೆ ಯೋಗ್ಯವಲ್ಲದ ತ್ಯಾಜ್ಯ","ಪ್ಲಾಸ್ಟಿಕ್, ರಾಸಾಯನಿಕ ಪಾತ್ರೆಗಳು, ಕಲುಷಿತ ವಸ್ತುಗಳು ಮತ್ತು ಅಪಾಯಕಾರಿ ತ್ಯಾಜ್ಯವನ್ನು ಬೆಳೆ ಅವಶೇಷಗಳೊಂದಿಗೆ ಮಿಶ್ರಣ ಮಾಡಬೇಡಿ. ಸ್ಥಳೀಯ ಪಂಚಾಯಿತಿ ಅಥವಾ ಪುರಸಭೆಯ ಅಧಿಕೃತ ಸಂಗ್ರಹ ಸೇವೆಯನ್ನು ಸಂಪರ್ಕಿಸಿ."],
    ["ಮುಖ್ಯ ಸುರಕ್ಷತಾ ಸೂಚನೆ","ಬೆಳೆ ಅವಶೇಷಗಳನ್ನು ತೆರೆದ ಬೆಂಕಿಯಲ್ಲಿ ಸುಡಬೇಡಿ. ಕಲುಷಿತ ಅಥವಾ ಗುರುತಿಸದ ವಸ್ತುವನ್ನು ಪಶುಗಳಿಗೆ ತಿನ್ನಿಸಬೇಡಿ ಅಥವಾ ಮಣ್ಣಿಗೆ ಸೇರಿಸಬೇಡಿ."]
  ] : [
    ["Residues you may reuse on the farm","For crop residues that are suitable and free from disease or chemical contamination, assess mulching or composting. Follow local agricultural extension advice for your crop and soil."],
    ["Animal feed or biogas","Before using residues as animal feed, confirm species-specific safety with a veterinarian or agricultural expert. Supply only suitable material to a biogas facility."],
    ["Waste unsuitable for reuse or sale","Keep plastics, chemical containers, contaminated material and hazardous waste separate from crop residues. Contact the official collection service of your Gram Panchayat or municipality."],
    ["Important safety instruction","Do not burn crop residues in the open. Do not feed contaminated or unidentified material to animals or incorporate it into soil."]
  ];
  return <section className="waste-guide" id="waste-guide">
    <div className="civic-heading"><div><span className="kicker">{kn ? "ಫಾರ್ಮ್‌ಲೂಪ್ / ಹೊಲದ ಮಾರ್ಗದರ್ಶನ" : "FARMLOOP / ON-FARM GUIDANCE"}</span><h2>{kn ? "ನಿಮ್ಮ ಹೊಲದ ತ್ಯಾಜ್ಯವನ್ನು ಹೇಗೆ ನಿರ್ವಹಿಸಬೇಕು?" : "What should you do with waste on your farm?"}</h2><p>{kn ? "ವಸ್ತುವಿನ ಪ್ರಕಾರ ಮತ್ತು ಸ್ಥಳೀಯ ನಿಯಮಗಳನ್ನು ಅವಲಂಬಿಸಿ ಆಯ್ಕೆಮಾಡಿ. ಎಲ್ಲಾ ಅವಶೇಷಗಳಿಗೂ ಒಂದೇ ಪರಿಹಾರ ಸೂಕ್ತವಲ್ಲ." : "Choose based on material type and local rules. One disposal method is not suitable for every residue."}</p></div><AudioGuideButton guide="waste" compact /></div>
    <div className="waste-guide-grid">{sections.map(([heading, body], i) => <article className="waste-guide-card" key={heading}><span>0{i+1}</span><h3>{heading}</h3><p>{body}</p></article>)}</div>
  </section>;
}
