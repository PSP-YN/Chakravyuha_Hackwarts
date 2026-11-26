import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;
const localAuthQueues = new Map<string, Promise<void>>();

async function serializedAuthLock<R>(
  name: string,
  _acquireTimeout: number,
  fn: () => Promise<R>,
): Promise<R> {
  const previous = localAuthQueues.get(name) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  localAuthQueues.set(name, current);

  await previous;
  try {
    if (typeof navigator !== "undefined" && navigator.locks?.request) {
      // Wait for an in-flight auth operation instead of rejecting concurrent
      // component initialization with Supabase's zero-timeout lock attempt.
      return await navigator.locks.request(name, { mode: "exclusive" }, fn);
    }
    return await fn();
  } finally {
    release();
    if (localAuthQueues.get(name) === current) localAuthQueues.delete(name);
  }
}

export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  if (!client) {
    client = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        lock: serializedAuthLock,
      },
    });
  }
  return client;
}
