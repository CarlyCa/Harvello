import { createClient } from "@supabase/supabase-js";
import { env, hasSupabase } from "./env";

export function getServiceSupabase() {
  const secretKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  if (!hasSupabase || !env.NEXT_PUBLIC_SUPABASE_URL || !secretKey) return null;
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
}
