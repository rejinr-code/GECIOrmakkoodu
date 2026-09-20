import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export type SessionState = {
  userId: string | null;
  email: string | null;
  profile: Profile | null;
};

export function isProfileComplete(profile: Profile | null): boolean {
  if (!profile) return false;
  return Boolean(
    profile.name.trim() &&
      profile.batch_year &&
      profile.branch &&
      profile.consent_accepted_at &&
      profile.consent_version,
  );
}

export function isVerified(profile: Profile | null): boolean {
  return profile?.status === "verified";
}

export function isStaff(profile: Profile | null): boolean {
  return profile?.role === "moderator" || profile?.role === "admin";
}

export function isAdmin(profile: Profile | null): boolean {
  return profile?.role === "admin";
}

export function canVerifyProfile(
  staff: Profile | null,
  person: { batch_year: number | null; branch: string | null },
): boolean {
  if (isAdmin(staff)) return true;
  if (!isStaff(staff) || !staff?.batch_year || !staff.branch) return false;
  return person.batch_year === staff.batch_year && person.branch === staff.branch;
}

export const getSession = cache(async (): Promise<SessionState> => {
  if (!isSupabaseConfigured()) {
    return { userId: null, email: null, profile: null };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { userId: null, email: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return { userId: user.id, email: user.email ?? null, profile };
});
