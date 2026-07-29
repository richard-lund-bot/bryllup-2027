import { createClient } from "@supabase/supabase-js";

// Offentlige nøkler – trygge å ha i klientkoden (tilgang styres av RLS).
export const SUPABASE_URL = "https://ugpxjjufoxzsyfiegkzq.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_RAD0qUL3RB9GDkc5Sytn9Q_5WyDq6BI";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const PLANLEGGERE = [
  "richard-lund@hotmail.com",
  "jennie.lundgaard@gmail.com",
];

export function erPlanlegger(email: string | undefined | null): boolean {
  return !!email && PLANLEGGERE.includes(email.toLowerCase());
}
