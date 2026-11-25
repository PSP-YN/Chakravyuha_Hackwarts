export type Category = "produce" | "machinery" | "byproduct";
export type Listing = { id:string; owner_id:string; category:Category; title:string; description:string|null; quantity:number; unit:string; price_paise:number; location:string; quality:string|null; status:string; created_at:string };
export type Offer = { id:string; listing_id:string; buyer_id:string; owner_id:string; offered_price_paise:number; accepted_quantity:number; transport_cost_paise:number; handling_cost_paise:number; commission_cost_paise:number; other_cost_paise:number; status:string; created_at:string };
export const toPaise = (value:string) => { const n=Number(value); if(!Number.isFinite(n)||n<0||!Number.isSafeInteger(Math.round(n*100))) throw new Error("Enter a valid amount."); return Math.round(n*100); };
export const money = (paise:number) => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(paise/100);
export const netPaise = (o:Offer) => o.offered_price_paise*o.accepted_quantity-o.transport_cost_paise-o.handling_cost_paise-o.commission_cost_paise-o.other_cost_paise;
