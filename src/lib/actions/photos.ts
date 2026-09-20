"use server";

import { revalidatePath } from "next/cache";
import {
  allBatchYears,
  isBranchOffered,
  parseAdmissionYear,
} from "@/config/site";
import { getSettings } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";
import {
  FULL_MAX_BYTES,
  FULL_MAX_EDGE,
  objectKey,
  THUMB_MAX_BYTES,
} from "@/lib/imageStore";
import { imageStore } from "@/lib/imageStore.server";
import { getSession, isVerified } from "@/lib/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type UploadResult = { error: string } | { id: string };

function parseNames(raw: string): string[] {
  const names = raw
    .split(/[,;\n]/)
    .map((name) => name.trim())
    .filter(Boolean)
    .slice(0, 20);
  return names.filter((name) => name.length <= 80);
}

async function asWebpFile(value: FormDataEntryValue | null, label: string) {
  if (!(value instanceof File) || value.size === 0) {
    throw new Error(`Missing ${label} file.`);
  }
  if (value.type !== "image/webp") {
    throw new Error("Photographs must be sent as WebP.");
  }
  return value;
}

export async function uploadPhotograph(formData: FormData): Promise<UploadResult> {
  if (!isSupabaseConfigured()) {
    return { error: "The archive is not connected yet." };
  }

  const session = await getSession();
  if (!session.userId) return { error: "Sign in to add a photograph." };
  if (!isVerified(session.profile)) {
    return { error: "Verification comes first, then photographs." };
  }

  const settings = await getSettings();
  if (settings?.feature_photos === false) {
    return { error: "Photograph upload is paused." };
  }

  const licence = formData.get("licence") === "on";
  if (!licence) {
    return { error: "Please confirm you have the right to share this photograph." };
  }

  const altText = String(formData.get("alt_text") ?? "").trim();
  if (!altText) return { error: "Please describe what is in the photograph." };
  if (altText.length > 240) {
    return { error: "Keep the description under 240 characters." };
  }

  const caption = String(formData.get("caption") ?? "").trim();
  if (caption.length > 280) {
    return { error: "Keep the caption under 280 characters." };
  }

  const batchYear = parseAdmissionYear(String(formData.get("batch_year") ?? ""));
  if (!batchYear) return { error: "Choose a batch album." };
  if (!allBatchYears().includes(batchYear)) {
    return { error: "That batch is outside the archive." };
  }

  const branchRaw = String(formData.get("branch") ?? "").trim();
  const branch = branchRaw || null;
  if (branch && !isBranchOffered(branch, batchYear)) {
    return { error: "That branch was not offered in this admission year." };
  }

  const eventTag = String(formData.get("event_tag") ?? "").trim() || null;
  const peopleTagged = parseNames(String(formData.get("people_tagged") ?? ""));
  const width = Number(formData.get("width"));
  const height = Number(formData.get("height"));
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
    return { error: "The photograph size looks wrong." };
  }
  if (Math.max(width, height) > FULL_MAX_EDGE) {
    return { error: "The photograph is larger than the archive allows." };
  }

  let full: File;
  let thumb: File;
  try {
    full = await asWebpFile(formData.get("full"), "photograph");
    thumb = await asWebpFile(formData.get("thumb"), "thumbnail");
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not read the files." };
  }

  if (full.size > FULL_MAX_BYTES) {
    return { error: "The photograph is still too large after compression." };
  }
  if (thumb.size > THUMB_MAX_BYTES) {
    return { error: "The thumbnail is too large." };
  }

  const photoId = crypto.randomUUID();
  const storageKey = objectKey(session.userId, photoId, "full");
  const thumbKey = objectKey(session.userId, photoId, "thumb");
  const supabase = await createServerSupabaseClient();

  const { error: insertError } = await supabase.from("photos").insert({
    id: photoId,
    uploader_id: session.userId,
    storage_key: storageKey,
    thumb_key: thumbKey,
    caption: caption || null,
    alt_text: altText,
    batch_year: batchYear,
    branch,
    event_tag: eventTag,
    people_tagged: peopleTagged,
    status: "pending",
    licence_confirmed: true,
    width,
    height,
    bytes: full.size,
  });

  if (insertError) {
    if (insertError.message.toLowerCase().includes("row-level security")) {
      return {
        error:
          "Could not save the photograph. If you were just verified, sign out and back in. You may also have reached today's upload limit.",
      };
    }
    return { error: insertError.message };
  }

  try {
    await imageStore.upload({
      bytes: full,
      contentType: "image/webp",
      ownerId: session.userId,
      photoId,
      variant: "full",
    });
    await imageStore.upload({
      bytes: thumb,
      contentType: "image/webp",
      ownerId: session.userId,
      photoId,
      variant: "thumb",
    });
  } catch (error) {
    await supabase
      .from("photos")
      .update({ status: "removed", deleted_at: new Date().toISOString() })
      .eq("id", photoId)
      .eq("uploader_id", session.userId);
    try {
      await imageStore.delete(storageKey, "full");
      await imageStore.delete(thumbKey, "thumb");
    } catch {
      // Row is already hidden; storage can be cleaned later.
    }
    return {
      error:
        error instanceof Error
          ? error.message
          : "The photograph details saved, but the file did not. Please try again.",
    };
  }

  revalidatePath("/");
  revalidatePath("/account");
  revalidatePath("/admin/photos");
  return { id: photoId };
}
