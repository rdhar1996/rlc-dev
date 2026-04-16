import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://wzgaxjwecpizcdzcpcqg.supabase.co";
const supabaseAnonKey = "sb_publishable_IVgMu5aZJOn_awEoH0L4Ww_nFHXNOCl";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);