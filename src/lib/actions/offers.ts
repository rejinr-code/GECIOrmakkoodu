"use server";

import { revalidatePath } from "next/cache";
import { CITY_MAX } from "@/lib/profiles";
import {
  looksLikeDirectContact,
  OFFER_BODY_MAX,
  OFFER_NOTE_MAX,
  OFFER_TITLE_MAX,
} from "@/lib/offers";
import { getSettings } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";
import { getSession, isVerified } from "@/lib/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { OfferKind } from "@/config/site";

export type OfferResult = { error: string } | { id: string };

function parseKind(value: string): OfferKind | null {
  if (value === "mentoring" || value === "internship") return value;
  return null;
}

export async function saveOffer(formData: FormData): Promise<OfferResult> {
  if (!isSupabaseConfigured()) {
    return { error: "The archive is not connected yet." };
  }

  const session = await getSession();
  if (!session.userId) return { error: "Sign in to post an offer." };
  if (!isVerified(session.profile)) {
    return { error: "Verification comes first, then offers." };
  }

  const settings = await getSettings();
  if (settings?.feature_mentoring !== true) {
    return { error: "Offers are paused." };
  }

  const kind = parseKind(String(formData.get("kind") ?? ""));
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const id = String(formData.get("id") ?? "").trim();

  if (!kind) return { error: "Choose mentoring or an internship." };
  if (!title) return { error: "Give the offer a title." };
  if (title.length > OFFER_TITLE_MAX) {
    return { error: `Keep the title under ${OFFER_TITLE_MAX} characters.` };
  }
  if (!body) return { error: "Write what you can offer." };
  if (body.length > OFFER_BODY_MAX) {
    return { error: `Keep the offer under ${OFFER_BODY_MAX} characters.` };
  }
  if (city.length > CITY_MAX) return { error: "City names need to stay short." };
  if (looksLikeDirectContact(`${title}\n${body}\n${city}`)) {
    return { error: "Do not put an email or phone here. People reach you through I'm interested." };
  }

  const supabase = await createServerSupabaseClient();

  if (id) {
    const { data: existing } = await supabase
      .from("mentoring_offers")
      .select("id, status, author_id")
      .eq("id", id)
      .maybeSingle();
    if (!existing || existing.author_id !== session.userId) {
      return { error: "That offer could not be found." };
    }
    if (existing.status !== "pending" && existing.status !== "rejected") {
      return { error: "Published offers are not edited here." };
    }

    const { error } = await supabase
      .from("mentoring_offers")
      .update({
        kind,
        title,
        body,
        city: city || null,
        status: "pending",
        rejection_reason: null,
      })
      .eq("id", id);

    if (error) return { error: error.message };
    revalidatePath("/offers");
    revalidatePath(`/offers/${id}`);
    revalidatePath("/account");
    revalidatePath("/admin/offers");
    return { id };
  }

  const { data, error } = await supabase
    .from("mentoring_offers")
    .insert({
      author_id: session.userId,
      kind,
      title,
      body,
      city: city || null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Could not save the offer." };
  }

  revalidatePath("/offers");
  revalidatePath("/account");
  revalidatePath("/admin/offers");
  return { id: data.id };
}

export async function expressInterest(formData: FormData): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) {
    return { error: "The archive is not connected yet." };
  }

  const session = await getSession();
  if (!session.userId) return { error: "Sign in first." };
  if (!isVerified(session.profile)) {
    return { error: "Verification comes first." };
  }

  const settings = await getSettings();
  if (settings?.feature_mentoring !== true) {
    return { error: "Offers are paused." };
  }

  const offerId = String(formData.get("offer_id") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  if (!offerId) return { error: "Missing offer." };
  if (note.length > OFFER_NOTE_MAX) {
    return { error: `Keep the note under ${OFFER_NOTE_MAX} characters.` };
  }
  if (note && looksLikeDirectContact(note)) {
    return { error: "Do not put an email or phone in the note." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("mentoring_interest").insert({
    offer_id: offerId,
    member_id: session.userId,
    note: note || null,
  });
  if (error) {
    if (error.code === "23505") return { error: "You already said you are interested." };
    return { error: error.message };
  }

  revalidatePath(`/offers/${offerId}`);
  return {};
}

export async function withdrawInterest(formData: FormData): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session.userId) return { error: "Sign in first." };

  const offerId = String(formData.get("offer_id") ?? "").trim();
  if (!offerId) return { error: "Missing offer." };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("mentoring_interest")
    .delete()
    .eq("offer_id", offerId)
    .eq("member_id", session.userId);
  if (error) return { error: error.message };

  revalidatePath(`/offers/${offerId}`);
  return {};
}
