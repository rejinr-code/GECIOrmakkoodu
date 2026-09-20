"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession, isVerified } from "@/lib/session";
import { isBranchOffered } from "@/config/site";
import { isSupabaseConfigured } from "@/lib/env";
import { BIO_MAX, CITY_MAX, NAME_MAX, ROLE_MAX } from "@/lib/profiles";

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

export type PublicDetailsResult = { error: string } | { id: string };

export async function savePublicDetails(formData: FormData): Promise<PublicDetailsResult> {
  if (!isSupabaseConfigured()) {
    return { error: "The archive is not connected to a database yet." };
  }

  const session = await getSession();
  if (!session.userId) {
    return { error: "Sign in first." };
  }
  if (!isVerified(session.profile)) {
    return { error: "A volunteer has to verify you before this page is public." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const city = String(formData.get("current_city") ?? "").trim();
  const role = String(formData.get("current_role") ?? "").trim();

  if (!name || name.length > NAME_MAX) {
    return { error: "Please give your name." };
  }
  if (bio.length > BIO_MAX) {
    return { error: "That note is a little long." };
  }
  if (city.length > CITY_MAX) {
    return { error: "City names need to stay short." };
  }
  if (role.length > ROLE_MAX) {
    return { error: "Keep the role to a short line." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      name,
      bio: bio || null,
      current_city: city || null,
      current_role: role || null,
      directory_opt_in: formData.get("directory_opt_in") === "on",
      directory_show_city: formData.get("directory_show_city") === "on",
      directory_show_role: formData.get("directory_show_role") === "on",
      directory_show_bio: formData.get("directory_show_bio") === "on",
    })
    .eq("id", session.userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/people");
  revalidatePath(`/people/${session.userId}`);
  revalidatePath("/account");
  return { id: session.userId };
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
