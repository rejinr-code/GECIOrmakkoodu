"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSession, canVerifyProfile, isAdmin, isStaff } from "@/lib/session";

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

function collectIds(formData: FormData): string[] {
  const many = formData
    .getAll("ids")
    .map((value) => String(value).trim())
    .filter(Boolean);
  const one = String(formData.get("id") ?? "").trim();
  const ids = [...new Set(many.length > 0 ? many : one ? [one] : [])];
  return ids.slice(0, 40);
}

export async function setVerification(
  userId: string,
  status: "verified" | "rejected",
): Promise<void> {
  const { session, supabase } = await requireStaff();
  const { data: person, error: loadError } = await supabase
    .from("profiles")
    .select("batch_year, branch")
    .eq("id", userId)
    .maybeSingle();
  if (loadError) throw new Error(loadError.message);
  if (!person) throw new Error("No such member.");
  if (!canVerifyProfile(session.profile, person)) {
    throw new Error("You can only verify alumni from your batch and branch.");
  }
  const { error } = await supabase
    .from("profiles")
    .update({ status })
    .eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function setMemberRole(formData: FormData): Promise<void> {
  const { session, supabase } = await requireAdmin();
  const userId = String(formData.get("id") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  if (!userId) throw new Error("Choose a member.");
  if (role !== "member" && role !== "moderator" && role !== "admin") {
    throw new Error("Choose member, batch representative, or admin.");
  }
  if (userId === session.userId && role !== "admin") {
    throw new Error("You cannot remove your own admin access.");
  }

  const { data: person, error: loadError } = await supabase
    .from("profiles")
    .select("status")
    .eq("id", userId)
    .maybeSingle();
  if (loadError) throw new Error(loadError.message);
  if (!person) throw new Error("No such member.");
  if (role !== "member" && person.status !== "verified") {
    throw new Error("Verify them first, then make them a representative.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/volunteers");
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
  const featureMonthlyPrompt = formData.get("feature_monthly_prompt") === "on";
  const featureDirectory = formData.get("feature_directory") === "on";
  const featureMentoring = formData.get("feature_mentoring") === "on";

  const { error } = await supabase
    .from("settings")
    .update({
      contact_email: contactEmail,
      consent_version: consentVersion,
      upload_limit_per_day: uploadLimit,
      comment_limit_per_day: commentLimit,
      feature_comments: featureComments,
      feature_monthly_prompt: featureMonthlyPrompt,
      feature_directory: featureDirectory,
      feature_mentoring: featureMentoring,
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
  if (!commentId) throw new Error("Missing note.");

  const { data: comment } = await supabase
    .from("comments")
    .select("parent_type, parent_id")
    .eq("id", commentId)
    .maybeSingle();

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
  if (comment?.parent_type === "photo" && comment.parent_id) {
    revalidatePath(`/photos/${comment.parent_id}`);
  }
  if (comment?.parent_type === "article" && comment.parent_id) {
    const { data: article } = await supabase
      .from("articles")
      .select("slug")
      .eq("id", comment.parent_id)
      .maybeSingle();
    if (article?.slug) revalidatePath(`/articles/${article.slug}`);
    revalidatePath("/articles");
  }
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

export async function removePublishedItem(formData: FormData): Promise<void> {
  const { supabase } = await requireStaff();
  const targetType = String(formData.get("target_type") ?? "");
  const targetId = String(formData.get("target_id") ?? "");
  if (!targetId) throw new Error("Choose an item to hide.");
  if (targetType !== "photo" && targetType !== "article") {
    throw new Error("Choose a photograph or letter.");
  }

  if (targetType === "photo") {
    const { error } = await supabase
      .from("photos")
      .update({ status: "removed" })
      .eq("id", targetId);
    if (error) throw new Error(error.message);
    revalidatePath(`/photos/${targetId}`);
    revalidatePath("/");
    revalidatePath("/account");
    return;
  }

  const slug = String(formData.get("slug") ?? "").trim();
  const { error } = await supabase
    .from("articles")
    .update({ status: "removed" })
    .eq("id", targetId);
  if (error) throw new Error(error.message);
  if (slug) revalidatePath(`/articles/${slug}`);
  revalidatePath("/articles");
  revalidatePath("/");
  revalidatePath("/account");
}

export async function removeReportedItem(formData: FormData): Promise<void> {
  const { supabase, session } = await requireStaff();
  const reportId = String(formData.get("report_id") ?? "");
  const targetType = String(formData.get("target_type") ?? "");
  const targetId = String(formData.get("target_id") ?? "");
  if (!reportId || !targetId) throw new Error("Missing report.");
  if (targetType !== "photo" && targetType !== "article") {
    throw new Error("Choose a photograph or letter.");
  }

  if (targetType === "photo") {
    const { error } = await supabase.from("photos").update({ status: "removed" }).eq("id", targetId);
    if (error) throw new Error(error.message);
    revalidatePath(`/photos/${targetId}`);
    revalidatePath("/");
  } else {
    const { error } = await supabase.from("articles").update({ status: "removed" }).eq("id", targetId);
    if (error) throw new Error(error.message);
    revalidatePath("/articles");
  }

  const { error: reportError } = await supabase
    .from("reports")
    .update({
      status: "actioned",
      handled_by: session.userId,
      notes: "Item removed",
    })
    .eq("id", reportId)
    .eq("status", "open");
  if (reportError) throw new Error(reportError.message);

  revalidatePath("/admin/reports");
}

export async function moderatePhoto(formData: FormData): Promise<void> {
  const { supabase } = await requireStaff();
  const ids = collectIds(formData);
  const decision = String(formData.get("decision") ?? "");
  const reason = String(formData.get("rejection_reason") ?? "").trim();
  if (ids.length === 0) throw new Error("Choose a photograph.");
  if (decision !== "approved" && decision !== "rejected") {
    throw new Error("Choose approve or reject.");
  }

  const { error } = await supabase
    .from("photos")
    .update({
      status: decision,
      rejection_reason: decision === "rejected" ? reason || "Not suitable for the archive." : null,
    })
    .in("id", ids)
    .eq("status", "pending");
  if (error) throw new Error(error.message);

  revalidatePath("/admin/photos");
  revalidatePath("/");
  revalidatePath("/account");
  for (const id of ids) {
    revalidatePath(`/photos/${id}`);
  }
}

export async function moderateTag(formData: FormData): Promise<void> {
  const { supabase } = await requireStaff();
  const slug = String(formData.get("slug") ?? "").trim();
  const decision = String(formData.get("decision") ?? "");
  if (!slug) throw new Error("Choose a tag.");
  if (decision !== "approved" && decision !== "rejected") {
    throw new Error("Choose approve or reject.");
  }

  const { error } = await supabase
    .from("event_tags")
    .update({ status: decision })
    .eq("slug", slug)
    .eq("status", "pending");
  if (error) throw new Error(error.message);

  revalidatePath("/admin/photos");
  revalidatePath("/");
  revalidatePath("/contribute");
}

export async function moderateArticle(formData: FormData): Promise<void> {
  const { supabase } = await requireStaff();
  const ids = collectIds(formData);
  const decision = String(formData.get("decision") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const reason = String(formData.get("rejection_reason") ?? "").trim();
  if (ids.length === 0) throw new Error("Choose a letter.");
  if (decision !== "published" && decision !== "rejected") {
    throw new Error("Choose publish or reject.");
  }

  const { error } = await supabase
    .from("articles")
    .update({
      status: decision,
      rejection_reason: decision === "rejected" ? reason || "Not suitable for the archive." : null,
    })
    .in("id", ids)
    .eq("status", "pending");
  if (error) throw new Error(error.message);

  revalidatePath("/admin/letters");
  if (slug) revalidatePath(`/articles/${slug}`);
  revalidatePath("/articles");
  revalidatePath("/");
  revalidatePath("/account");
}

export async function moderateOffer(formData: FormData): Promise<void> {
  const { supabase } = await requireStaff();
  const ids = collectIds(formData);
  const decision = String(formData.get("decision") ?? "");
  const reason = String(formData.get("rejection_reason") ?? "").trim();
  if (ids.length === 0) throw new Error("Choose an offer.");
  if (decision !== "approved" && decision !== "rejected") {
    throw new Error("Choose approve or reject.");
  }

  const { error } = await supabase
    .from("mentoring_offers")
    .update({
      status: decision,
      rejection_reason: decision === "rejected" ? reason || "Not suitable for the board." : null,
    })
    .in("id", ids)
    .eq("status", "pending");
  if (error) throw new Error(error.message);

  revalidatePath("/admin/offers");
  revalidatePath("/offers");
  revalidatePath("/account");
  for (const id of ids) {
    revalidatePath(`/offers/${id}`);
  }
}

export async function saveMonthlyPrompt(formData: FormData): Promise<void> {
  const { supabase, session } = await requireAdmin();
  const theme = String(formData.get("theme") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const startsAt = String(formData.get("starts_at") ?? "").trim();
  const endsAt = String(formData.get("ends_at") ?? "").trim();
  if (!theme) throw new Error("Give the month a theme.");
  if (!startsAt) throw new Error("Choose when this prompt starts.");

  const { error } = await supabase.from("monthly_prompts").insert({
    theme,
    body: body || null,
    starts_at: new Date(startsAt).toISOString(),
    ends_at: endsAt ? new Date(endsAt).toISOString() : null,
    created_by: session.userId,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/prompts");
  revalidatePath("/", "layout");
}
