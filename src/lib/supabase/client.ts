import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env";

const { supabaseUrl, supabasePublishableKey } = getSupabaseEnv();

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
