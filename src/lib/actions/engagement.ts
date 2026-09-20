"use server";

import { revalidatePath } from "next/cache";
import {
  COMMENT_MAX_LENGTH,
  isFlagReason,
  isMemoryParent,
  type MemoryParent,
} from "@/lib/engagement";
import { isSupabaseConfigured } from "@/lib/env";
import { getSession, isVerified } from "@/lib/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ActionResult = { error?: string } | void;

function revalidateMemory(parentType: MemoryParent, parentId: string, next: string) {
  if (next.startsWith("/photos/") || next.startsWith("/articles/")) {
    revalidatePath(next);
  } else if (parentType === "photo") {
    revalidatePath(`/photos/${parentId}`);
  } else {
    revalidatePath("/articles");
  }
  revalidatePath("/admin/reports");
}

function readParent(formData: FormData): { parentType: MemoryParent; parentId: string } | { error: string } {
  const parentType = String(formData.get("parent_type") ?? "");
  const parentId = String(formData.get("parent_id") ?? "");
  if (!isMemoryParent(parentType) || !parentId) {
    return { error: "Missing item." };
  }
  return { parentType, parentId };
}

export async function toggleLike(formData: FormData): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { error: "The archive is not connected yet." };
  }

  const parent = readParent(formData);
  if ("error" in parent) return parent;
  const next = String(formData.get("next") ?? "");

  const session = await getSession();
  if (!session.userId) return { error: "Sign in to like this." };
  if (!isVerified(session.profile)) {
    return { error: "Verification comes first, then likes." };
  }

  const supabase = await createServerSupabaseClient();
  const { data: existing } = await supabase
    .from("reactions")
    .select("id")
    .eq("parent_type", parent.parentType)
    .eq("parent_id", parent.parentId)
    .eq("user_id", session.userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("reactions").delete().eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("reactions").insert({
      parent_type: parent.parentType,
      parent_id: parent.parentId,
      user_id: session.userId,
    });
    if (error && error.code !== "23505") {
      if (error.message.toLowerCase().includes("row-level security")) {
        return { error: "Could not like this yet. If you were just verified, sign out and back in." };
      }
      return { error: error.message };
    }
  }

  revalidateMemory(parent.parentType, parent.parentId, next);
}

export async function addComment(formData: FormData): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { error: "The archive is not connected yet." };
  }

  const parent = readParent(formData);
  if ("error" in parent) return parent;
  const next = String(formData.get("next") ?? "");
  const body = String(formData.get("body") ?? "").trim();

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
    parent_type: parent.parentType,
    parent_id: parent.parentId,
    author_id: session.userId,
    body,
  });

  if (error) {
    if (error.message.toLowerCase().includes("row-level security")) {
      return { error: "Could not save that note. If you were just verified, sign out and back in. You may also have reached today's comment limit." };
    }
    return { error: error.message };
  }

  revalidateMemory(parent.parentType, parent.parentId, next);
}

export async function flagComment(formData: FormData): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { error: "The archive is not connected yet." };
  }

  const commentId = String(formData.get("comment_id") ?? "");
  const parent = readParent(formData);
  const next = String(formData.get("next") ?? "");
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

  if (!("error" in parent)) {
    revalidateMemory(parent.parentType, parent.parentId, next);
  } else {
    revalidatePath("/admin/reports");
  }
}

export async function flagItem(formData: FormData): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { error: "The archive is not connected yet." };
  }

  const parent = readParent(formData);
  if ("error" in parent) return parent;
  const next = String(formData.get("next") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!isFlagReason(reason)) return { error: "Choose a reason." };

  const session = await getSession();
  if (!session.userId) return { error: "Sign in to flag this." };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("reports").insert({
    target_type: parent.parentType,
    target_id: parent.parentId,
    reporter_id: session.userId,
    reason,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "You already flagged this." };
    }
    return { error: error.message };
  }

  revalidateMemory(parent.parentType, parent.parentId, next);
}
