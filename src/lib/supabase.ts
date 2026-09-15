import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured =
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  !supabaseUrl.includes("your_supabase_url") &&
  !supabaseAnonKey.includes("your_supabase_anon_key");

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface Candidate {
  id: string;
  name: string;
  position: string;
  active?: boolean;
}

export interface Community {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  active?: boolean;
}

export interface VoteRecord {
  id: string;
  community_id: string;
  candidate_id: string;
  votes: number;
  recorded_at: string;
  notes?: string;
  candidate?: Candidate;
  community?: Community;
}
