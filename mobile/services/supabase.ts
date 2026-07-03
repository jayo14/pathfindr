// =============================================================================
// SUPABASE — NOT ACTIVE IN CURRENT BUILD
// =============================================================================
// This file is a placeholder for a possible future feature (e.g. Supabase
// Storage for profile-image uploads). It is NOT imported by any screen, hook,
// or service in the current build and plays no role in the demo.
//
// Rules:
//   • Do NOT use supabase.auth — authentication is handled exclusively by
//     Django JWT via auth-service.ts.
//   • Do NOT read buildings, events, or lost items from Supabase — all campus
//     data is served by the Django REST API via campus-service.ts.
//   • If Supabase Storage is adopted, create a dedicated storage-service.ts
//     rather than expanding this file.
//
// See services/README.md for the full backend map.
// =============================================================================

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
