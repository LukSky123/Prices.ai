import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  // In dev, we avoid throwing at import time; runtime routes can validate
  // eslint-disable-next-line no-console
  console.warn("Supabase env vars are not set. API routes may fail until configured.");
}

export const supabase = createClient(url || "", serviceKey || "");



