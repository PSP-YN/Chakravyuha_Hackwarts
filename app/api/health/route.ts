import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const startedAt = Date.now();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ status: "degraded", dependencies: { database: "not_configured" } }, { status: 503 });
  }

  try {
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
    const { error } = await db.from("market_listings").select("id", { head: true, count: "exact" }).limit(1);
    if (error) throw error;
    return NextResponse.json({
      status: "ok",
      dependencies: { database: "ok" },
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString()
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({
      status: "degraded",
      dependencies: { database: "unavailable" },
      timestamp: new Date().toISOString()
    }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
