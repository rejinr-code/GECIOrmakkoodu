"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/session";
import { isBranchOffered } from "@/config/site";
import { isSupabaseConfigured } from "@/lib/env";

export async function signOut() {
  if (!isSupabaseConfigured()) redirect("/");
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function saveProfile(formData: FormData) {
  if (!isSupabaseConfigured()) {
    return { error: "The archive is not connected to a database yet." };
  }

  const session = await getSession();
  if (!session.userId) {
    return { error: "Sign in first." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const batchYear = Number(formData.get("batch_year"));
  const branch = String(formData.get("branch") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const consent = formData.get("consent") === "on";
  const consentVersion = String(formData.get("consent_version") ?? "");

  if (!name || !batchYear || !branch) {
    return { error: "Name, batch year, and branch are required." };
  }
  if (!isBranchOffered(branch, batchYear)) {
    return { error: "That branch was not offered in this admission year." };
  }
  if (!consent) {
    return { error: "Please accept the privacy notice to continue." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      name,
      batch_year: batchYear,
      branch,
      phone: phone || null,
      consent_accepted_at: new Date().toISOString(),
      consent_version: consentVersion,
    })
    .eq("id", session.userId);

  if (error) {
    return { error: error.message };
  }

  redirect("/");
}

export async function exportMyData() {
  const session = await getSession();
  if (!session.userId) {
    return { error: "Sign in first." };
  }
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("export_own_data");
  if (error) return { error: error.message };
  return { data };
}

export async function deleteMyAccount() {
  const session = await getSession();
  if (!session.userId) {
    return { error: "Sign in first." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("delete_own_account");
  if (error) return { error: error.message };

  try {
    const admin = createAdminClient();
    await admin.auth.admin.deleteUser(session.userId);
  } catch {
    // Profile already anonymised even if Auth deletion fails.
  }

  await supabase.auth.signOut();
  redirect("/");
}
