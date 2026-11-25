"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { AudioGuideButton, useLanguage } from "@/components/language-provider";

type Contact = {
  id: string; district: string; taluk: string | null; jurisdiction: string;
  office_name: string; contact_person: string | null; phone: string | null;
  email: string | null; address: string | null; services: string[];
  source_url: string; verified_at: string | null; verified_by: string | null;
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
    if (insertError) { setError(insertError.message); return; }
    const { data } = await db.from("municipality_contacts").select("id,district,taluk,jurisdiction,office_name,contact_person,phone,email,address,services,source_url,verified_at,verified_by").eq("is_active", true).order("district");
    setContacts((data ?? []) as Contact[]);
    formElement.reset();
  }
  return <section className="civic-directory" id="municipality-directory" aria-labelledby="civic-title">
    <div className="civic-heading"><div><span className="kicker">{kn ? "ಸ್ಥಳೀಯ ಸಾರ್ವಜನಿಕ ಸೇವೆಗಳು" : "LOCAL PUBLIC SERVICES"}</span><h2 id="civic-title">{kn ? "ಪುರಸಭೆ ಮತ್ತು ತ್ಯಾಜ್ಯ ಸಂಗ್ರಹ ಸಂಪರ್ಕಗಳು" : "Municipality & waste collection contacts"}</h2><p>{kn ? "ಮರುಬಳಕೆ ಮಾಡಲಾಗದ ಕೃಷಿ ತ್ಯಾಜ್ಯ ಅಥವಾ ಸ್ಥಳೀಯ ಸಂಗ್ರಹ ಸೇವೆಗಳಿಗಾಗಿ ಅಧಿಕೃತ ಮೂಲದೊಂದಿಗೆ ಪರಿಶೀಲಿಸಿದ ಸಂಪರ್ಕ ವಿವರಗಳನ್ನು ಬಳಸಿ." : "Use official, source-checked contacts for non-reusable farm waste and municipal collection services."}</p></div><AudioGuideButton guide="municipality" compact /></div>
    {isAdmin && <form className="civic-admin-form" onSubmit={addContact}><b>{kn ? "ನಿರ್ವಾಹಕ: ಪರಿಶೀಲಿತ ಸಂಪರ್ಕ ಸೇರಿಸಿ" : "Admin: add a verified contact"}</b><div className="civic-admin-grid"><input name="office_name" required placeholder={kn ? "ಕಚೇರಿ ಹೆಸರು" : "Office name"}/><input name="jurisdiction" required placeholder={kn ? "ಅಧಿಕಾರ ವ್ಯಾಪ್ತಿ" : "Jurisdiction"}/><input name="district" required placeholder={kn ? "ಜಿಲ್ಲೆ" : "District"}/><input name="taluk" placeholder={kn ? "ತಾಲೂಕು" : "Taluk"}/><input name="contact_person" placeholder={kn ? "ಸಂಪರ್ಕ ವ್ಯಕ್ತಿ" : "Contact person"}/><input name="phone" placeholder={kn ? "ದೂರವಾಣಿ" : "Phone"}/><input name="email" type="email" placeholder="Email"/><input name="address" placeholder={kn ? "ವಿಳಾಸ" : "Address"}/><input name="services" placeholder={kn ? "ಸೇವೆಗಳು (ಅಲ್ಪವಿರಾಮದಿಂದ ಬೇರ್ಪಡಿಸಿ)" : "Services (comma separated)"}/><input name="source_url" type="url" required placeholder="Official source URL"/><input name="verified_at" type="date" required aria-label={kn ? "ಪರಿಶೀಲಿಸಿದ ದಿನಾಂಕ" : "Verified date"}/><label><input name="is_active" type="checkbox"/> {kn ? "ಸಾರ್ವಜನಿಕವಾಗಿ ಪ್ರಕಟಿಸಿ" : "Publish publicly"}</label></div><button className="button button-primary">{kn ? "ಸಂಪರ್ಕ ಉಳಿಸಿ" : "Save contact"}</button></form>}
    {loading ? <p className="operations-empty">{kn ? "ಸಂಪರ್ಕಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ…" : "Loading contacts…"}</p>
      : error ? <p className="inline-alert warning">{error}</p>
      : contacts.length === 0 ? <div className="civic-empty"><b>{kn ? "ಇನ್ನೂ ಮೂಲ ಪರಿಶೀಲಿತ ಸಂಪರ್ಕ ದಾಖಲೆಗಳಿಲ್ಲ." : "No source-checked municipal contacts have been published yet."}</b><p>{kn ? "ತಪ್ಪಾದ ಸಂಖ್ಯೆಯನ್ನು ತೋರಿಸುವುದಕ್ಕಿಂತ, ನಿಮ್ಮ ಗ್ರಾಮ ಪಂಚಾಯಿತಿ ಅಥವಾ ಪುರಸಭೆಯ ಅಧಿಕೃತ ಕಚೇರಿಯಲ್ಲಿ ಸಂಪರ್ಕ ವಿವರಗಳನ್ನು ದೃಢಪಡಿಸಿ. ನಿರ್ವಾಹಕರು ಮೂಲ ಮತ್ತು ಪರಿಶೀಲನೆ ದಿನಾಂಕದೊಂದಿಗೆ ಸಂಪರ್ಕವನ್ನು ಸೇರಿಸಬಹುದು." : "Rather than display an unverified number, confirm the contact with your Gram Panchayat or municipal office. An administrator can publish a contact with its source and verification date."}</p></div>
      : <div className="civic-grid">{contacts.map(c => <article className="civic-card" key={c.id}>
        <span className="civic-location">{[c.taluk,c.district].filter(Boolean).join(" · ")}</span><h3>{c.office_name}</h3><p>{c.jurisdiction}</p>
        {c.contact_person && <p>{kn ? "ಸಂಪರ್ಕ ವ್ಯಕ್ತಿ" : "Contact"}: {c.contact_person}</p>}
        {c.address && <p>{c.address}</p>}
        {c.services?.length > 0 && <p>{c.services.join(" · ")}</p>}
        <div className="civic-actions">{c.phone && <a href={`tel:${c.phone}`}>{kn ? "ಕರೆ ಮಾಡಿ" : "Call"} {c.phone}</a>}{c.email && <a href={`mailto:${c.email}`}>{kn ? "ಇಮೇಲ್" : "Email"}</a>}</div>
        <small>{kn ? "ಮೂಲ" : "Source"}: <a href={c.source_url} target="_blank" rel="noreferrer">{kn ? "ಪರಿಶೀಲಿಸಿ" : "Verify source"} ↗</a> · {c.verified_at ? (c.verified_by ? (kn ? "ನಿರ್ವಾಹಕರು ಪರಿಶೀಲಿಸಿದ್ದಾರೆ" : "Admin verified") : (kn ? "ಅಧಿಕೃತ ಮೂಲ ಪರಿಶೀಲಿಸಲಾಗಿದೆ" : "Official source checked")) + ": " + c.verified_at : (kn ? "ಪರಿಶೀಲನೆ ದಿನಾಂಕ ದಾಖಲಾಗಿಲ್ಲ" : "Verification date not recorded")}</small>
      </article>)}</div>}
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
