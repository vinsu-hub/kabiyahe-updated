import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!url || !key) {
  // Surfaced loudly in dev; the app can't do anything useful without it.
  console.error(
    "[El-Biyahe!] Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY. " +
      "Copy .env.example to .env.local and fill them in.",
  );
}

export const supabase = createClient(url ?? "http://localhost", key ?? "public-anon-key", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
