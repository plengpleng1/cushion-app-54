import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://gwmogfwjjlamsfchdwio.supabase.co";
const supabaseAnonKey = "sb_publishable_rMQ1fqpeWT6y7VXQPw492w_5iacWcQ-";

let supabase: ReturnType<typeof createClient>;

if (typeof window !== "undefined") {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: window.localStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export { supabase };

