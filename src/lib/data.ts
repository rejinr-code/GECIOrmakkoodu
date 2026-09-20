import { siteConfig } from "@/config/site";
import { publicEnv, isSupabaseConfigured } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { imageStore } from "@/lib/imageStore.server";
import type { Database } from "@/types/database";

export const WALL_PAGE_SIZE = 24;

export type PhotoCard = {
  id: string;
  caption: string | null;
  altText: string;
  batchYear: number;
  branch: string | null;
  width: number;
  height: number;
  thumbUrl: string | null;
  contributorName: string;
  contributorId: string | null;
  anonymised: boolean;
};

export type ArticleCard = {
  id: string;
  title: string;
  slug: string;
  batchYear: number | null;
  publishedAt: string | null;
};

export type SettingsRow = Database["public"]["Tables"]["settings"]["Row"];

export async function getSettings(): Promise<SettingsRow | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("settings").select("*").eq("id", 1).maybeSingle();
  return data;
}

export function contactEmail(settings: SettingsRow | null): string {
  return settings?.contact_email || publicEnv.contactEmail || siteConfig.contact.email;
}

export async function getPublicProfile(id: string) {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("public_profiles")
    .select("id, name, batch_year, branch, bio, current_city, current_role")
    .eq("id", id)
    .maybeSingle();
  return data;
}

export async function getLegalDocument(slug: string) {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("legal_documents")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

export async function listLegalDocuments() {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("legal_documents")
    .select("slug, title")
    .order("slug");
  return data ?? [];
}

export async function listApprovedPhotos(options: {
  batchYear?: number;
  branch?: string | null;
  uploaderId?: string;
  page: number;
}): Promise<{ photos: PhotoCard[]; total: number }> {
  if (!isSupabaseConfigured()) return { photos: [], total: 0 };

  const supabase = await createServerSupabaseClient();
  const from = (options.page - 1) * WALL_PAGE_SIZE;
  const to = from + WALL_PAGE_SIZE - 1;

  let query = supabase
    .from("photos")
    .select(
      "id, caption, alt_text, batch_year, branch, width, height, thumb_key, uploader_id, anonymised",
      { count: "exact" },
    )
    .eq("status", "approved")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (options.batchYear) {
    query = query.eq("batch_year", options.batchYear);
  }
  if (options.branch) {
    query = query.eq("branch", options.branch);
  }
  if (options.uploaderId) {
    query = query.eq("uploader_id", options.uploaderId).eq("anonymised", false);
  }

  const { data, count } = await query;
  const rows = data ?? [];

  const uploaderIds = [
    ...new Set(
      rows
        .filter((row) => !row.anonymised && row.uploader_id)
        .map((row) => row.uploader_id as string),
    ),
  ];

  const names = new Map<string, string>();
  if (uploaderIds.length > 0) {
    const { data: profiles } = await supabase
      .from("public_profiles")
      .select("id, name")
      .in("id", uploaderIds);
    for (const profile of profiles ?? []) {
      names.set(profile.id, profile.name);
    }
  }

  const photos: PhotoCard[] = [];
  for (const row of rows) {
    let thumbUrl: string | null = null;
    try {
      thumbUrl = await imageStore.getUrl(row.thumb_key, "thumb");
    } catch {
      thumbUrl = null;
    }

    photos.push({
      id: row.id,
      caption: row.caption,
      altText: row.alt_text,
      batchYear: row.batch_year,
      branch: row.branch,
      width: row.width,
      height: row.height,
      thumbUrl,
      contributorName: row.anonymised || !row.uploader_id
        ? "Former member"
        : (names.get(row.uploader_id) ?? "GECIAN"),
      contributorId:
        row.anonymised || !row.uploader_id || !names.has(row.uploader_id)
          ? null
          : row.uploader_id,
      anonymised: row.anonymised,
    });
  }

  return { photos, total: count ?? 0 };
}

export async function getPhoto(id: string) {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("photos")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data;
}

export async function listPublishedArticles(
  limit = 6,
  options?: { authorId?: string },
): Promise<ArticleCard[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("articles")
    .select("id, title, slug, batch_year, published_at")
    .eq("status", "published")
    .is("deleted_at", null)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (options?.authorId) {
    query = query.eq("author_id", options.authorId).eq("anonymised", false);
  }
  const { data } = await query;
  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    batchYear: row.batch_year,
    publishedAt: row.published_at,
  }));
}

export async function getArticle(slug: string) {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

export async function getArticleById(id: string) {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("articles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data;
}

export type ModeratedArticle = {
  id: string;
  title: string;
  slug: string;
  body: string;
  batchYear: number | null;
  status: Database["public"]["Tables"]["articles"]["Row"]["status"];
  rejectionReason: string | null;
  authorName: string;
  createdAt: string;
};

async function mapArticles(
  rows: Array<{
    id: string;
    title: string;
    slug: string;
    body: string;
    batch_year: number | null;
    status: Database["public"]["Tables"]["articles"]["Row"]["status"];
    rejection_reason: string | null;
    author_id: string | null;
    created_at: string;
  }>,
  nameSource: "public" | "profiles",
): Promise<ModeratedArticle[]> {
  const ids = [
    ...new Set(rows.map((row) => row.author_id).filter((id): id is string => Boolean(id))),
  ];
  const names = new Map<string, string>();
  if (ids.length > 0) {
    const supabase = await createServerSupabaseClient();
    if (nameSource === "profiles") {
      const { data } = await supabase.from("profiles").select("id, name").in("id", ids);
      for (const profile of data ?? []) names.set(profile.id, profile.name);
    } else {
      const { data } = await supabase.from("public_profiles").select("id, name").in("id", ids);
      for (const profile of data ?? []) names.set(profile.id, profile.name);
    }
  }

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    body: row.body,
    batchYear: row.batch_year,
    status: row.status,
    rejectionReason: row.rejection_reason,
    authorName: row.author_id ? (names.get(row.author_id) ?? "GECIAN") : "Former member",
    createdAt: row.created_at,
  }));
}

export async function listPendingArticles(): Promise<ModeratedArticle[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("articles")
    .select("id, title, slug, body, batch_year, status, rejection_reason, author_id, created_at")
    .eq("status", "pending")
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  return mapArticles(data ?? [], "profiles");
}

export async function listMyArticles(userId: string): Promise<ModeratedArticle[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("articles")
    .select("id, title, slug, body, batch_year, status, rejection_reason, author_id, created_at")
    .eq("author_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(40);
  return mapArticles(data ?? [], "public");
}

export async function listBatchGroups() {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("batch_groups")
    .select("*")
    .order("batch_year", { ascending: true })
    .order("branch", { ascending: true });
  return data ?? [];
}

export async function listPublicBatchGroups() {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("batch_groups_public")
    .select("*")
    .order("batch_year", { ascending: true });
  return data ?? [];
}

export async function listPendingProfiles() {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("status", "pending")
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function listAlumniRegister() {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("alumni_register")
    .select("*")
    .order("batch_year", { ascending: false })
    .order("name", { ascending: true });
  return data ?? [];
}

export async function listEventTags() {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("event_tags")
    .select("slug, label")
    .order("sort_order", { ascending: true });
  return data ?? [];
}

export type ModeratedPhotoCard = PhotoCard & {
  status: Database["public"]["Tables"]["photos"]["Row"]["status"];
  eventTag: string | null;
  peopleTagged: string[];
  rejectionReason: string | null;
  createdAt: string;
};

async function mapPhotoCards(
  rows: Array<{
    id: string;
    caption: string | null;
    alt_text: string;
    batch_year: number;
    branch: string | null;
    width: number;
    height: number;
    thumb_key: string;
    uploader_id: string | null;
    anonymised: boolean;
    status: Database["public"]["Tables"]["photos"]["Row"]["status"];
    event_tag: string | null;
    people_tagged: string[];
    rejection_reason: string | null;
    created_at: string;
  }>,
  access?: { viewerId?: string; viewerIsModerator?: boolean },
): Promise<ModeratedPhotoCard[]> {
  const names = new Map<string, string>();
  const uploaderIds = [
    ...new Set(
      rows
        .filter((row) => !row.anonymised && row.uploader_id)
        .map((row) => row.uploader_id as string),
    ),
  ];
  if (uploaderIds.length > 0) {
    const supabase = await createServerSupabaseClient();
    const { data: profiles } = await supabase
      .from("public_profiles")
      .select("id, name")
      .in("id", uploaderIds);
    for (const profile of profiles ?? []) {
      names.set(profile.id, profile.name);
    }
  }

  const photos: ModeratedPhotoCard[] = [];
  for (const row of rows) {
    let thumbUrl: string | null = null;
    try {
      thumbUrl = await imageStore.getUrl(row.thumb_key, "thumb", 3600, access);
    } catch {
      thumbUrl = null;
    }
    photos.push({
      id: row.id,
      caption: row.caption,
      altText: row.alt_text,
      batchYear: row.batch_year,
      branch: row.branch,
      width: row.width,
      height: row.height,
      thumbUrl,
      contributorName:
        row.anonymised || !row.uploader_id
          ? "Former member"
          : (names.get(row.uploader_id) ?? "GECIAN"),
      contributorId:
        row.anonymised || !row.uploader_id || !names.has(row.uploader_id)
          ? null
          : row.uploader_id,
      anonymised: row.anonymised,
      status: row.status,
      eventTag: row.event_tag,
      peopleTagged: row.people_tagged,
      rejectionReason: row.rejection_reason,
      createdAt: row.created_at,
    });
  }
  return photos;
}

export async function listPendingPhotos(): Promise<ModeratedPhotoCard[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("photos")
    .select(
      "id, caption, alt_text, batch_year, branch, width, height, thumb_key, uploader_id, anonymised, status, event_tag, people_tagged, rejection_reason, created_at",
    )
    .eq("status", "pending")
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  return mapPhotoCards(data ?? [], { viewerIsModerator: true });
}

export async function listMyPhotos(userId: string): Promise<ModeratedPhotoCard[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("photos")
    .select(
      "id, caption, alt_text, batch_year, branch, width, height, thumb_key, uploader_id, anonymised, status, event_tag, people_tagged, rejection_reason, created_at",
    )
    .eq("uploader_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(40);
  return mapPhotoCards(data ?? [], { viewerId: userId });
}

export async function getStorageStats() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("admin_storage_stats");
  if (error || !data || typeof data !== "object") return null;
  const stats = data as {
    photo_bytes?: number;
    photo_count?: number;
    pending_count?: number;
    approved_count?: number;
    free_tier_bytes?: number;
  };
  return {
    photoBytes: Number(stats.photo_bytes ?? 0),
    photoCount: Number(stats.photo_count ?? 0),
    pendingCount: Number(stats.pending_count ?? 0),
    approvedCount: Number(stats.approved_count ?? 0),
    freeTierBytes: Number(stats.free_tier_bytes ?? 1073741824),
  };
}

export type PhotoComment = {
  id: string;
  body: string;
  createdAt: string;
  authorId: string | null;
  profileId: string | null;
  authorName: string;
};

export type PhotoReactionState = {
  count: number;
  liked: boolean;
};

export type OpenCommentReport = {
  id: string;
  reason: string;
  createdAt: string;
  reporterName: string;
  commentId: string;
  commentBody: string;
  photoId: string | null;
  commentStatus: string | null;
};

async function namesForIds(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  ids: string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))];
  const names = new Map<string, string>();
  if (unique.length === 0) return names;
  const { data } = await supabase
    .from("public_profiles")
    .select("id, name")
    .in("id", unique);
  for (const profile of data ?? []) {
    names.set(profile.id, profile.name);
  }
  return names;
}

export async function listPhotoComments(photoId: string): Promise<PhotoComment[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("comments")
    .select("id, body, created_at, author_id, anonymised")
    .eq("parent_type", "photo")
    .eq("parent_id", photoId)
    .eq("status", "visible")
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(100);

  const rows = data ?? [];
  const names = await namesForIds(
    supabase,
    rows
      .filter((row) => !row.anonymised && row.author_id)
      .map((row) => row.author_id as string),
  );

  return rows.map((row) => ({
    id: row.id,
    body: row.body,
    createdAt: row.created_at,
    authorId: row.author_id,
    profileId:
      row.anonymised || !row.author_id || !names.has(row.author_id)
        ? null
        : row.author_id,
    authorName:
      row.anonymised || !row.author_id
        ? "Former member"
        : (names.get(row.author_id) ?? "GECIAN"),
  }));
}

export async function getPhotoReactionState(
  photoId: string,
  userId: string | null,
): Promise<PhotoReactionState> {
  if (!isSupabaseConfigured()) return { count: 0, liked: false };
  const supabase = await createServerSupabaseClient();
  const { count } = await supabase
    .from("reactions")
    .select("id", { count: "exact", head: true })
    .eq("parent_type", "photo")
    .eq("parent_id", photoId)
    .is("deleted_at", null);

  let liked = false;
  if (userId) {
    const { data } = await supabase
      .from("reactions")
      .select("id")
      .eq("parent_type", "photo")
      .eq("parent_id", photoId)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .maybeSingle();
    liked = Boolean(data);
  }

  return { count: count ?? 0, liked };
}

export async function listMyOpenCommentFlags(
  userId: string,
  commentIds: string[],
): Promise<Set<string>> {
  const flagged = new Set<string>();
  if (!isSupabaseConfigured() || commentIds.length === 0) return flagged;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("reports")
    .select("target_id")
    .eq("reporter_id", userId)
    .eq("target_type", "comment")
    .eq("status", "open")
    .in("target_id", commentIds);
  for (const row of data ?? []) {
    flagged.add(row.target_id);
  }
  return flagged;
}

export async function listOpenCommentReports(): Promise<OpenCommentReport[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createServerSupabaseClient();
  const { data: reports } = await supabase
    .from("reports")
    .select("id, reason, created_at, reporter_id, target_id")
    .eq("target_type", "comment")
    .eq("status", "open")
    .order("created_at", { ascending: true });

  const rows = reports ?? [];
  if (rows.length === 0) return [];

  const commentIds = rows.map((row) => row.target_id);
  const { data: comments } = await supabase
    .from("comments")
    .select("id, body, parent_id, parent_type, status")
    .in("id", commentIds);

  const commentsById = new Map((comments ?? []).map((row) => [row.id, row]));
  const reporterIds = rows
    .map((row) => row.reporter_id)
    .filter((id): id is string => Boolean(id));
  const names = new Map<string, string>();
  if (reporterIds.length > 0) {
    const { data: reporters } = await supabase
      .from("profiles")
      .select("id, name")
      .in("id", reporterIds);
    for (const profile of reporters ?? []) {
      names.set(profile.id, profile.name);
    }
  }

  return rows.map((row) => {
    const comment = commentsById.get(row.target_id);
    return {
      id: row.id,
      reason: row.reason,
      createdAt: row.created_at,
      reporterName: row.reporter_id
        ? (names.get(row.reporter_id) ?? "Member")
        : "Former member",
      commentId: row.target_id,
      commentBody: comment?.body ?? "This note is no longer visible.",
      photoId:
        comment?.parent_type === "photo" ? comment.parent_id : null,
      commentStatus: comment?.status ?? null,
    };
  });
}
