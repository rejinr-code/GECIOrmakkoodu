"use server";

import { revalidatePath } from "next/cache";
import { COMMENT_MAX_LENGTH, isFlagReason } from "@/lib/engagement";
import { isSupabaseConfigured } from "@/lib/env";
import { getSession, isVerified } from "@/lib/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ActionResult = { error?: string } | void;

function revalidatePhoto(photoId: string) {
  revalidatePath(`/photos/${photoId}`);
  revalidatePath("/admin/reports");
}

export async function togglePhotoLike(formData: FormData): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { error: "The archive is not connected yet." };
  }

  const photoId = String(formData.get("photo_id") ?? "");
  if (!photoId) return { error: "Missing photograph." };

  const session = await getSession();
  if (!session.userId) return { error: "Sign in to like a photograph." };
  if (!isVerified(session.profile)) {
    return { error: "Verification comes first, then likes." };
  }

  const supabase = await createServerSupabaseClient();
  const { data: existing } = await supabase
    .from("reactions")
    .select("id")
    .eq("parent_type", "photo")
    .eq("parent_id", photoId)
    .eq("user_id", session.userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("reactions").delete().eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("reactions").insert({
      parent_type: "photo",
      parent_id: photoId,
      user_id: session.userId,
    });
    if (error && error.code !== "23505") {
      if (error.message.toLowerCase().includes("row-level security")) {
        return { error: "Could not like this yet. If you were just verified, sign out and back in." };
      }
      return { error: error.message };
    }
  }

  revalidatePhoto(photoId);
}

export async function addPhotoComment(formData: FormData): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { error: "The archive is not connected yet." };
  }

  const photoId = String(formData.get("photo_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!photoId) return { error: "Missing photograph." };
  if (!body) return { error: "Write a short note first." };
  if (body.length > COMMENT_MAX_LENGTH) {
    return { error: `Keep notes under ${COMMENT_MAX_LENGTH} characters.` };
  }

  const session = await getSession();
  if (!session.userId) return { error: "Sign in to leave a note." };
  if (!isVerified(session.profile)) {
    return { error: "Verification comes first, then comments." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("comments").insert({
    parent_type: "photo",
    parent_id: photoId,
    author_id: session.userId,
    body,
  });

  if (error) {
    if (error.message.toLowerCase().includes("row-level security")) {
      return { error: "Could not save that note. If you were just verified, sign out and back in. You may also have reached today's comment limit." };
    }
    return { error: error.message };
  }

  revalidatePhoto(photoId);
}

export async function flagPhotoComment(formData: FormData): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { error: "The archive is not connected yet." };
  }

  const commentId = String(formData.get("comment_id") ?? "");
  const photoId = String(formData.get("photo_id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!commentId) return { error: "Missing note." };
  if (!isFlagReason(reason)) return { error: "Choose a reason." };

  const session = await getSession();
  if (!session.userId) return { error: "Sign in to flag a note." };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("reports").insert({
    target_type: "comment",
    target_id: commentId,
    reporter_id: session.userId,
    reason,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "You already flagged this note." };
    }
    return { error: error.message };
  }

  if (photoId) revalidatePhoto(photoId);
  else revalidatePath("/admin/reports");
}
