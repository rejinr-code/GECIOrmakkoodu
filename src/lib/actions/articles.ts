"use server";

import { revalidatePath } from "next/cache";
import { allBatchYears, parseAdmissionYear } from "@/config/site";
import { getSettings } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";
import { BODY_MAX, TITLE_MAX } from "@/lib/letters";
import { getSession, isVerified } from "@/lib/session";
import { letterSlug } from "@/lib/slug";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type LetterResult = { error: string } | { id: string; slug: string };

async function uniqueSlug(title: string, supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const slug = letterSlug(title, attempt === 0 ? "" : crypto.randomUUID().slice(0, 6));
    const { data } = await supabase.from("articles").select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug;
  }
  return letterSlug(title, crypto.randomUUID().slice(0, 8));
}

export async function saveLetter(formData: FormData): Promise<LetterResult> {
  if (!isSupabaseConfigured()) {
    return { error: "The archive is not connected yet." };
  }

  const session = await getSession();
  if (!session.userId) return { error: "Sign in to write a letter." };
  if (!isVerified(session.profile)) {
    return { error: "Verification comes first, then letters." };
  }

  const settings = await getSettings();
  if (settings?.feature_articles === false) {
    return { error: "Letters are paused." };
  }

  const intent = String(formData.get("intent") ?? "draft");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const id = String(formData.get("id") ?? "").trim();
  const batchRaw = String(formData.get("batch_year") ?? "").trim();
  const batchYear = batchRaw ? parseAdmissionYear(batchRaw) : null;

  if (!title) return { error: "Give the letter a title." };
  if (title.length > TITLE_MAX) return { error: `Keep the title under ${TITLE_MAX} characters.` };
  if (body.length > BODY_MAX) return { error: `Keep the letter under ${BODY_MAX} characters.` };
  if (batchRaw && !batchYear) return { error: "That batch is outside the archive." };
  if (batchYear && !allBatchYears().includes(batchYear)) {
    return { error: "That batch is outside the archive." };
  }

  const status = intent === "review" ? "pending" : "draft";
  if (status === "pending" && !body) {
    return { error: "Write the letter before sending it for review." };
  }

  const supabase = await createServerSupabaseClient();

  if (id) {
    const { data: existing } = await supabase
      .from("articles")
      .select("id, slug, status, author_id")
      .eq("id", id)
      .maybeSingle();
    if (!existing || existing.author_id !== session.userId) {
      return { error: "That letter could not be found." };
    }
    if (existing.status !== "draft" && existing.status !== "pending") {
      return { error: "Published letters are not edited here." };
    }

    const { error } = await supabase
      .from("articles")
      .update({
        title,
        body,
        batch_year: batchYear,
        status,
      })
      .eq("id", id)
      .eq("author_id", session.userId);
    if (error) {
      if (error.message.toLowerCase().includes("row-level security")) {
        return { error: "Could not save. If you were just verified, sign out and back in." };
      }
      return { error: error.message };
    }

    revalidatePath("/write");
    revalidatePath(`/write/${id}`);
    revalidatePath(`/articles/${existing.slug}`);
    revalidatePath("/articles");
    revalidatePath("/admin/letters");
    revalidatePath("/account");
    return { id, slug: existing.slug };
  }

  const slugBase = await uniqueSlug(title, supabase);
  let created: { id: string; slug: string } | null = null;
  let lastError: string | null = null;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const slug = attempt === 0 ? slugBase : letterSlug(title, crypto.randomUUID().slice(0, 6));
    const { data, error } = await supabase
      .from("articles")
      .insert({
        title,
        slug,
        body,
        batch_year: batchYear,
        author_id: session.userId,
        status,
      })
      .select("id, slug")
      .maybeSingle();
    if (!error && data) {
      created = data;
      break;
    }
    if (error?.code === "23505") {
      lastError = error.message;
      continue;
    }
    if (error?.message.toLowerCase().includes("row-level security")) {
      return { error: "Could not save. If you were just verified, sign out and back in." };
    }
    return { error: error?.message ?? "Could not save the letter." };
  }

  if (!created) {
    return { error: lastError ?? "Could not save the letter." };
  }

  revalidatePath("/articles");
  revalidatePath("/admin/letters");
  revalidatePath("/account");
  return { id: created.id, slug: created.slug };
}
