"use server";

import { formatAlbumLabel, photoHref } from "@/config/site";
import {
  getPhoto,
  getPhotoNeighbors,
  getPublicProfile,
  getReactionState,
  listComments,
  listTagsForPhoto,
  type MemoryComment,
} from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";
import { imageStore } from "@/lib/imageStore.server";
import { getSession } from "@/lib/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { tagLine } from "@/lib/tags";

export type ViewerContext = {
  timeline?: boolean;
  year?: number | null;
  branch?: string | null;
  event?: string | null;
  college?: boolean;
};

export type PhotoSlide = {
  id: string;
  src: string;
  alt: string;
  caption: string | null;
  width: number;
  height: number;
  batchYear: number | null;
  batchLabel: string;
  branch: string | null;
  eventLabel: string | null;
  contributorName: string;
  likeCount: number;
  liked: boolean;
  comments: MemoryComment[];
  previousId: string | null;
  nextId: string | null;
  previousSrc: string | null;
  nextSrc: string | null;
  href: string;
};

function hrefOptions(context: ViewerContext) {
  return {
    year: context.timeline ? null : context.year,
    branch: context.timeline ? null : context.branch,
    event: context.event,
    college: context.timeline ? false : context.college,
    view: context.timeline ? ("timeline" as const) : undefined,
  };
}

async function signedFull(storageKey: string): Promise<string | null> {
  try {
    return await imageStore.getUrl(storageKey, "full", 3600);
  } catch {
    return null;
  }
}

export async function loadPhotoSlide(
  id: string,
  context: ViewerContext,
): Promise<PhotoSlide | null> {
  if (!isSupabaseConfigured()) return null;
  const photo = await getPhoto(id);
  if (!photo || photo.deleted_at || photo.status !== "approved") return null;

  const session = await getSession();
  const src = await signedFull(photo.storage_key);
  if (!src) return null;

  const [comments, reaction, photoTags, neighbors] = await Promise.all([
    listComments("photo", photo.id),
    getReactionState("photo", photo.id, session.userId),
    listTagsForPhoto(photo.id),
    getPhotoNeighbors(photo, {
      timeline: context.timeline,
      college: context.college,
      branch: context.branch,
      eventTag: context.event,
    }),
  ]);

  const contributor =
    !photo.anonymised && photo.uploader_id
      ? await getPublicProfile(photo.uploader_id)
      : null;

  const neighborIds = [neighbors.previousId, neighbors.nextId].filter(
    (value): value is string => Boolean(value),
  );
  const neighborSrc = new Map<string, string>();
  if (neighborIds.length > 0) {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from("photos")
      .select("id, storage_key")
      .in("id", neighborIds)
      .eq("status", "approved");
    await Promise.all(
      (data ?? []).map(async (row) => {
        const url = await signedFull(row.storage_key);
        if (url) neighborSrc.set(row.id, url);
      }),
    );
  }

  const options = hrefOptions(context);
  return {
    id: photo.id,
    src,
    alt: photo.alt_text,
    caption: photo.caption,
    width: photo.width,
    height: photo.height,
    batchYear: photo.batch_year,
    batchLabel: formatAlbumLabel(photo.batch_year),
    branch: photo.branch,
    eventLabel: tagLine(photoTags),
    contributorName: photo.courtesy?.trim()
      ? photo.courtesy.trim()
      : photo.anonymised
        ? "Former member"
        : (contributor?.name ?? (photo.uploader_id ? "GECIAN" : "Former member")),
    likeCount: reaction.count,
    liked: reaction.liked,
    comments,
    previousId: neighbors.previousId,
    nextId: neighbors.nextId,
    previousSrc: neighbors.previousId ? (neighborSrc.get(neighbors.previousId) ?? null) : null,
    nextSrc: neighbors.nextId ? (neighborSrc.get(neighbors.nextId) ?? null) : null,
    href: photoHref(photo.id, { ...options, open: true }),
  };
}
