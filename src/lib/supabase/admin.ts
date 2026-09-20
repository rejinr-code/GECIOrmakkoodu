import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig, getServiceRoleKey } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Service-role client. Server and operator scripts only.
 * Bypasses RLS — never import this into a Client Component.
 */
export function createAdminClient() {
  const { url } = getPublicSupabaseConfig();
  return createClient<Database>(url, getServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
