/* Compatibility shim: the app previously used a Manus-OAuth `useAuth`.
   El-Biyahe! now runs on Supabase Auth — re-export the Supabase hook, keeping the
   older surface (`logout`) that a few legacy components still import. */
import { useAuth as useSupabaseAuth } from "@/lib/supabase/AuthProvider";

export function useAuth() {
  const auth = useSupabaseAuth();
  return { ...auth, logout: auth.signOut };
}
