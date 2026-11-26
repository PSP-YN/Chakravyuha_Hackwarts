export type Category = "produce" | "machinery" | "byproduct" | "transport";
export type Listing = { id:string; owner_id:string; category:Category; title:string; description:string|null; quantity:number; unit:string; price_paise:number; location:string; latitude?:number|null; longitude?:number|null; service_radius_km?:number|null; quality:string|null; status:string; created_at:string; machinery_operation?:string|null; machinery_hp_min?:number|null; machinery_hp_max?:number|null; machinery_implement?:string|null; machinery_operator_included?:boolean|null; machinery_fuel_responsibility?:string|null; machinery_min_hours?:number|null; machinery_available_from?:string|null; machinery_available_until?:string|null; byproduct_material?:string|null; byproduct_moisture_pct?:number|null; byproduct_contamination_pct?:number|null; byproduct_collection_radius_km?:number|null; byproduct_available_until?:string|null; transport_vehicle_type?:string|null; transport_capacity_tonnes?:number|null; transport_origin?:string|null; transport_destination?:string|null; transport_service_radius_km?:number|null; transport_available_from?:string|null; transport_available_until?:string|null };
export type Offer = { id:string; listing_id:string; buyer_id:string; owner_id:string; offered_price_paise:number; accepted_quantity:number; transport_cost_paise:number; handling_cost_paise:number; commission_cost_paise:number; other_cost_paise:number; requested_start_at?:string|null; requested_duration_hours?:number|null; status:string; created_at:string };
export const toPaise = (value:string) => { const n=Number(value); if(!Number.isFinite(n)||n<0||!Number.isSafeInteger(Math.round(n*100))) throw new Error("Enter a valid amount."); return Math.round(n*100); };
export const money = (paise:number) => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",minimumFractionDigits:0,maximumFractionDigits:2}).format(paise/100);
export const netPaise = (o:Offer) => o.offered_price_paise*o.accepted_quantity-o.transport_cost_paise-o.handling_cost_paise-o.commission_cost_paise-o.other_cost_paise;


export type TransportJobStatus = "confirmed" | "pickup_ready" | "picked_up" | "in_transit" | "delivered_pending_confirmation" | "completed" | "cancelled";
export function canTransitionTransportJob(from: TransportJobStatus, to: TransportJobStatus, actor: "requester" | "transporter"): boolean {
  if (from === "confirmed" && to === "pickup_ready") return actor === "transporter";
  if (from === "pickup_ready" && to === "picked_up") return actor === "transporter";
  if (from === "picked_up" && to === "in_transit") return actor === "transporter";
  if (from === "in_transit" && to === "delivered_pending_confirmation") return actor === "transporter";
  if (from === "delivered_pending_confirmation" && to === "completed") return actor === "requester";
  if ((from === "confirmed" || from === "pickup_ready") && to === "cancelled") return true;
  return false;
}

export function validateFpoAllocations(total: number, allocations: { memberId: string; quantity: number }[], activeMemberIds: Set<string>): boolean {
  if (!Number.isFinite(total) || total <= 0 || allocations.length === 0) return false;
  const ids = allocations.map((item) => item.memberId);
  if (ids.some((id) => !id || !activeMemberIds.has(id)) || new Set(ids).size !== ids.length) return false;
  if (allocations.some((item) => !Number.isFinite(item.quantity) || item.quantity <= 0)) return false;
  const sum = allocations.reduce((value, item) => value + item.quantity, 0);
  return Math.abs(sum - total) < 0.0005;
}


export function canMakeOffer(role: string, category: Category): boolean {
  if (role === "farmer" || role === "fpo_cooperative" || role === "fpo") return ["produce", "machinery", "transport"].includes(category);
  if (role === "buyer_trader" || role === "buyer" || role === "machinery_owner" || role === "provider") return ["produce", "transport"].includes(category);
  return false;
}
