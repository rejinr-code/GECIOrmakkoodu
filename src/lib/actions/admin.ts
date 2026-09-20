"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSession, isAdmin, isStaff } from "@/lib/session";

async function requireAdmin() {
  const session = await getSession();
  if (!isAdmin(session.profile)) {
    throw new Error("Admin only");
  }
  return { session, supabase: await createServerSupabaseClient() };
}

async function requireStaff() {
  const session = await getSession();
  if (!isStaff(session.profile)) {
    throw new Error("Staff only");
  }
  return { session, supabase: await createServerSupabaseClient() };
}

export async function setVerification(
  userId: string,
  status: "verified" | "rejected",
): Promise<void> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("profiles")
    .update({ status })
    .eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function addRegisterRow(formData: FormData): Promise<void> {
  const { supabase, session } = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const batchYear = Number(formData.get("batch_year"));
  const branch = String(formData.get("branch") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  if (!name || !batchYear || !branch) {
    throw new Error("Name, batch year, and branch are required.");
  }
  const { error } = await supabase.from("alumni_register").insert({
    name,
    batch_year: batchYear,
    branch,
    notes: notes || null,
    created_by: session.userId,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function saveBatchGroup(formData: FormData): Promise<void> {
  const { supabase, session } = await requireAdmin();
  const batchYear = Number(formData.get("batch_year"));
  const branch = String(formData.get("branch") ?? "").trim();
  const coordinatorName = String(formData.get("coordinator_name") ?? "").trim();
  const whatsapp = String(formData.get("whatsapp_invite_url") ?? "").trim();
  const coordinatorContact = String(formData.get("coordinator_contact") ?? "").trim();

  if (!batchYear || !branch) {
    throw new Error("Batch year and branch are required.");
  }

  const { error } = await supabase.from("batch_groups").upsert({
    batch_year: batchYear,
    branch,
    coordinator_name: coordinatorName || null,
    whatsapp_invite_url: whatsapp || null,
    coordinator_contact: coordinatorContact || null,
    updated_by: session.userId,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/batches");
  revalidatePath("/batches");
}

export async function saveSettings(formData: FormData): Promise<void> {
  const { supabase, session } = await requireAdmin();
  const contactEmail = String(formData.get("contact_email") ?? "").trim();
  const consentVersion = String(formData.get("consent_version") ?? "").trim();
  const uploadLimit = Number(formData.get("upload_limit_per_day"));
  const commentLimit = Number(formData.get("comment_limit_per_day"));
  const featureComments = formData.get("feature_comments") === "on";

  const { error } = await supabase
    .from("settings")
    .update({
      contact_email: contactEmail,
      consent_version: consentVersion,
      upload_limit_per_day: uploadLimit,
      comment_limit_per_day: commentLimit,
      feature_comments: featureComments,
      updated_by: session.userId,
    })
    .eq("id", 1);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
}

export async function saveLegalDocument(formData: FormData): Promise<void> {
  const { supabase, session } = await requireAdmin();
  const slug = String(formData.get("slug") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const version = String(formData.get("version") ?? "").trim();
  const body = String(formData.get("body_markdown") ?? "");

  const { error } = await supabase
    .from("legal_documents")
    .update({
      title,
      version,
      body_markdown: body,
      updated_by: session.userId,
    })
    .eq("slug", slug);

  if (error) throw new Error(error.message);
  revalidatePath(`/legal/${slug}`);
  revalidatePath("/admin/legal");
}

export async function removeFlaggedComment(formData: FormData): Promise<void> {
  const { supabase, session } = await requireStaff();
  const commentId = String(formData.get("comment_id") ?? "");
  const photoId = String(formData.get("photo_id") ?? "");
  if (!commentId) throw new Error("Missing note.");

  const { error: commentError } = await supabase
    .from("comments")
    .update({ status: "removed" })
    .eq("id", commentId);
  if (commentError) throw new Error(commentError.message);

  const { error: reportError } = await supabase
    .from("reports")
    .update({
      status: "actioned",
      handled_by: session.userId,
      notes: "Comment removed",
    })
    .eq("target_type", "comment")
    .eq("target_id", commentId)
    .eq("status", "open");
  if (reportError) throw new Error(reportError.message);

  revalidatePath("/admin/reports");
  if (photoId) revalidatePath(`/photos/${photoId}`);
}

export async function dismissCommentReport(formData: FormData): Promise<void> {
  const { supabase, session } = await requireStaff();
  const reportId = String(formData.get("report_id") ?? "");
  if (!reportId) throw new Error("Missing report.");

  const { error } = await supabase
    .from("reports")
    .update({
      status: "dismissed",
      handled_by: session.userId,
    })
    .eq("id", reportId)
    .eq("status", "open");
  if (error) throw new Error(error.message);
  revalidatePath("/admin/reports");
}
