// NOTE: Supabase is imported but PathFindr currently uses Django JWT auth.
// This file is reserved for future Supabase Storage integration (image uploads).
// Do NOT use supabase.auth — use auth-service.ts instead.
// TODO: Remove if Supabase Storage is not adopted before launch.

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;
