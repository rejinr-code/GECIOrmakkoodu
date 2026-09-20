import { allBatchYears, siteConfig, type OfferKind } from "@/config/site";
import { publicEnv, isSupabaseConfigured } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { imageStore } from "@/lib/imageStore.server";
import { DIRECTORY_PAGE_SIZE } from "@/lib/profiles";
import { OFFERS_PAGE_SIZE } from "@/lib/offers";
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
  likeCount: number;
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
    .select(
      "id, name, batch_year, branch, bio, current_city, current_role, directory_opt_in, directory_show_city, directory_show_role, directory_show_bio",
    )
    .eq("id", id)
    .maybeSingle();
  return data;
}

export type DirectoryPerson = {
  id: string;
  name: string;
  batchYear: number | null;
  branch: string | null;
  city: string | null;
  role: string | null;
  bio: string | null;
};

export async function listDirectory(options: {
  q?: string;
  year?: number | null;
  branch?: string | null;
  page: number;
}): Promise<{ people: DirectoryPerson[]; total: number }> {
  if (!isSupabaseConfigured()) return { people: [], total: 0 };

  const supabase = await createServerSupabaseClient();
  const from = (options.page - 1) * DIRECTORY_PAGE_SIZE;
  const to = from + DIRECTORY_PAGE_SIZE - 1;

  let query = supabase
    .from("public_profiles")
    .select("id, name, batch_year, branch, bio, current_city, current_role", { count: "exact" })
    .eq("directory_opt_in", true)
    .order("name", { ascending: true })
    .range(from, to);

  if (options.q) {
    query = query.ilike("name", `%${options.q}%`);
  }
  if (options.year) {
    query = query.eq("batch_year", options.year);
  }
  if (options.branch) {
    query = query.eq("branch", options.branch);
  }

  const { data, count } = await query;
  return {
    people: (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      batchYear: row.batch_year,
      branch: row.branch,
      city: row.current_city,
      role: row.current_role,
      bio: row.bio,
    })),
    total: count ?? 0,
  };
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
  eventTag?: string | null;
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
  if (options.eventTag) {
    query = query.eq("event_tag", options.eventTag);
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
      likeCount: 0,
    });
  }

  return { photos: await withLikeCounts(photos), total: count ?? 0 };
}

async function withLikeCounts(photos: PhotoCard[]): Promise<PhotoCard[]> {
  if (photos.length === 0 || !isSupabaseConfigured()) return photos;
  const counts = await reactionCounts(
    "photo",
    photos.map((photo) => photo.id),
  );
  return photos.map((photo) => ({
    ...photo,
    likeCount: counts.get(photo.id) ?? 0,
  }));
}

async function reactionCounts(
  parentType: "photo" | "article",
  ids: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (ids.length === 0 || !isSupabaseConfigured()) return counts;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("reactions")
    .select("parent_id")
    .eq("parent_type", parentType)
    .in("parent_id", ids)
    .is("deleted_at", null);
  for (const row of data ?? []) {
    counts.set(row.parent_id, (counts.get(row.parent_id) ?? 0) + 1);
  }
  return counts;
}

export type YearAlbum = {
  year: number;
  count: number;
  cover: PhotoCard | null;
};

export async function listYearAlbums(limit?: number): Promise<YearAlbum[]> {
  const years = allBatchYears();
  const take = (chosen: number[]) =>
    Promise.all(
      [...chosen]
        .sort((a, b) => a - b)
        .map((year) => toAlbum(year)),
    );

  if (!isSupabaseConfigured()) {
    const chosen = limit ? years.slice(0, limit) : years;
    return chosen.map((year) => ({ year, count: 0, cover: null }));
  }

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("photos")
    .select("id, caption, alt_text, batch_year, branch, width, height, thumb_key, uploader_id, anonymised")
    .eq("status", "approved")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(800);

  const rows = data ?? [];
  const counts = await reactionCounts(
    "photo",
    rows.map((row) => row.id),
  );
  const byYear = new Map<number, typeof rows>();
  for (const row of rows) {
    const list = byYear.get(row.batch_year) ?? [];
    list.push(row);
    byYear.set(row.batch_year, list);
  }

  const toAlbum = async (year: number): Promise<YearAlbum> => {
    const list = byYear.get(year) ?? [];
    const ranked = [...list].sort(
      (a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0),
    );
    const coverRow = ranked[0];
    let cover: PhotoCard | null = null;
    if (coverRow) {
      let thumbUrl: string | null = null;
      try {
        thumbUrl = await imageStore.getUrl(coverRow.thumb_key, "thumb");
      } catch {
        thumbUrl = null;
      }
      cover = {
        id: coverRow.id,
        caption: coverRow.caption,
        altText: coverRow.alt_text,
        batchYear: coverRow.batch_year,
        branch: coverRow.branch,
        width: coverRow.width,
        height: coverRow.height,
        thumbUrl,
        contributorName: "GECIAN",
        contributorId: null,
        anonymised: coverRow.anonymised,
        likeCount: counts.get(coverRow.id) ?? 0,
      };
    }
    return { year, count: list.length, cover };
  };

  if (!limit) {
    return take(years);
  }

  return take(years.slice(0, limit));
}

export async function listRememberedPhotos(limit = 12): Promise<PhotoCard[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createServerSupabaseClient();
  const { data: reactions } = await supabase
    .from("reactions")
    .select("parent_id")
    .eq("parent_type", "photo")
    .is("deleted_at", null)
    .limit(3000);

  const counts = new Map<string, number>();
  for (const row of reactions ?? []) {
    counts.set(row.parent_id, (counts.get(row.parent_id) ?? 0) + 1);
  }
  const rankedIds = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id)
    .slice(0, limit * 2);

  const remembered: PhotoCard[] = [];
  if (rankedIds.length > 0) {
    const { data } = await supabase
      .from("photos")
      .select("id, caption, alt_text, batch_year, branch, width, height, thumb_key, uploader_id, anonymised")
      .eq("status", "approved")
      .is("deleted_at", null)
      .in("id", rankedIds);
    const byId = new Map((data ?? []).map((row) => [row.id, row]));
    for (const id of rankedIds) {
      const row = byId.get(id);
      if (!row || remembered.length >= limit) continue;
      let thumbUrl: string | null = null;
      try {
        thumbUrl = await imageStore.getUrl(row.thumb_key, "thumb");
      } catch {
        thumbUrl = null;
      }
      remembered.push({
        id: row.id,
        caption: row.caption,
        altText: row.alt_text,
        batchYear: row.batch_year,
        branch: row.branch,
        width: row.width,
        height: row.height,
        thumbUrl,
        contributorName: row.anonymised ? "Former member" : "GECIAN",
        contributorId: null,
        anonymised: row.anonymised,
        likeCount: counts.get(row.id) ?? 0,
      });
    }
  }

  if (remembered.length >= limit) return remembered.slice(0, limit);

  const { photos } = await listApprovedPhotos({ page: 1 });
  const seen = new Set(remembered.map((photo) => photo.id));
  for (const photo of photos) {
    if (seen.has(photo.id)) continue;
    remembered.push(photo);
    if (remembered.length >= limit) break;
  }
  return remembered;
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

export async function listVerifiedMembers(): Promise<
  Pick<
    Database["public"]["Tables"]["profiles"]["Row"],
    "id" | "name" | "batch_year" | "branch" | "role" | "status"
  >[]
> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, name, batch_year, branch, role, status")
    .eq("status", "verified")
    .is("deleted_at", null)
    .order("name", { ascending: true });
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

export async function getPhotoNeighbors(
  photo: { id: string; created_at: string; batch_year: number },
  options: {
    timeline?: boolean;
    branch?: string | null;
    eventTag?: string | null;
  },
): Promise<{ previousId: string | null; nextId: string | null }> {
  if (!isSupabaseConfigured()) return { previousId: null, nextId: null };
  const supabase = await createServerSupabaseClient();

  const apply = <T extends { eq: (c: string, v: string | number) => T }>(query: T) => {
    let next = query;
    if (!options.timeline) {
      next = next.eq("batch_year", photo.batch_year);
    }
    if (options.branch) next = next.eq("branch", options.branch);
    if (options.eventTag) next = next.eq("event_tag", options.eventTag);
    return next;
  };

  const newerQuery = apply(
    supabase
      .from("photos")
      .select("id")
      .eq("status", "approved")
      .is("deleted_at", null)
      .gt("created_at", photo.created_at)
      .order("created_at", { ascending: true })
      .limit(1),
  );
  const olderQuery = apply(
    supabase
      .from("photos")
      .select("id")
      .eq("status", "approved")
      .is("deleted_at", null)
      .lt("created_at", photo.created_at)
      .order("created_at", { ascending: false })
      .limit(1),
  );

  const [{ data: newer }, { data: older }] = await Promise.all([
    newerQuery.maybeSingle(),
    olderQuery.maybeSingle(),
  ]);

  return {
    previousId: newer?.id ?? null,
    nextId: older?.id ?? null,
  };
}

export async function getCurrentPrompt() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.rpc("current_prompt");
  const row = Array.isArray(data) ? data[0] : data;
  return row ?? null;
}

export async function listMonthlyPrompts() {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("monthly_prompts")
    .select("id, theme, body, starts_at, ends_at")
    .order("starts_at", { ascending: false })
    .limit(12);
  return data ?? [];
}

export async function hasOpenItemFlag(
  userId: string,
  targetType: "photo" | "article",
  targetId: string,
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("reports")
    .select("id")
    .eq("reporter_id", userId)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .eq("status", "open")
    .maybeSingle();
  return Boolean(data);
}

export type OpenItemReport = {
  id: string;
  reason: string;
  createdAt: string;
  reporterName: string;
  targetType: "photo" | "article";
  targetId: string;
  photoId: string | null;
  articleSlug: string | null;
};

export async function listOpenItemReports(): Promise<OpenItemReport[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createServerSupabaseClient();
  const { data: reports } = await supabase
    .from("reports")
    .select("id, reason, created_at, reporter_id, target_id, target_type")
    .in("target_type", ["photo", "article"])
    .eq("status", "open")
    .order("created_at", { ascending: true });

  const rows = reports ?? [];
  if (rows.length === 0) return [];

  const articleIds = rows.filter((row) => row.target_type === "article").map((row) => row.target_id);
  const articleSlugs = new Map<string, string>();
  if (articleIds.length > 0) {
    const { data: articles } = await supabase.from("articles").select("id, slug").in("id", articleIds);
    for (const article of articles ?? []) articleSlugs.set(article.id, article.slug);
  }
  const reporterIds = rows.map((row) => row.reporter_id).filter((id): id is string => Boolean(id));
  const names = new Map<string, string>();
  if (reporterIds.length > 0) {
    const { data: reporters } = await supabase.from("profiles").select("id, name").in("id", reporterIds);
    for (const profile of reporters ?? []) names.set(profile.id, profile.name);
  }

  return rows.map((row) => ({
    id: row.id,
    reason: row.reason,
    createdAt: row.created_at,
    reporterName: row.reporter_id ? (names.get(row.reporter_id) ?? "Member") : "Former member",
    targetType: row.target_type as "photo" | "article",
    targetId: row.target_id,
    photoId: row.target_type === "photo" ? row.target_id : null,
    articleSlug: row.target_type === "article" ? (articleSlugs.get(row.target_id) ?? null) : null,
  }));
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
      likeCount: 0,
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

export type MemoryComment = {
  id: string;
  body: string;
  createdAt: string;
  authorId: string | null;
  profileId: string | null;
  authorName: string;
};

export type ReactionState = {
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
  articleSlug: string | null;
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

export async function listComments(
  parentType: "photo" | "article",
  parentId: string,
): Promise<MemoryComment[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("comments")
    .select("id, body, created_at, author_id, anonymised")
    .eq("parent_type", parentType)
    .eq("parent_id", parentId)
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

export async function getReactionState(
  parentType: "photo" | "article",
  parentId: string,
  userId: string | null,
): Promise<ReactionState> {
  if (!isSupabaseConfigured()) return { count: 0, liked: false };
  const supabase = await createServerSupabaseClient();
  const { count } = await supabase
    .from("reactions")
    .select("id", { count: "exact", head: true })
    .eq("parent_type", parentType)
    .eq("parent_id", parentId)
    .is("deleted_at", null);

  let liked = false;
  if (userId) {
    const { data } = await supabase
      .from("reactions")
      .select("id")
      .eq("parent_type", parentType)
      .eq("parent_id", parentId)
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
  const articleIds = [
    ...new Set(
      (comments ?? [])
        .filter((row) => row.parent_type === "article")
        .map((row) => row.parent_id),
    ),
  ];
  const articleSlugs = new Map<string, string>();
  if (articleIds.length > 0) {
    const { data: articles } = await supabase
      .from("articles")
      .select("id, slug")
      .in("id", articleIds);
    for (const article of articles ?? []) {
      articleSlugs.set(article.id, article.slug);
    }
  }
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
      photoId: comment?.parent_type === "photo" ? comment.parent_id : null,
      articleSlug:
        comment?.parent_type === "article"
          ? (articleSlugs.get(comment.parent_id) ?? null)
          : null,
      commentStatus: comment?.status ?? null,
    };
  });
}

export type OfferCard = {
  id: string;
  kind: OfferKind;
  title: string;
  body: string;
  city: string | null;
  status: Database["public"]["Tables"]["mentoring_offers"]["Row"]["status"];
  rejectionReason: string | null;
  authorId: string | null;
  authorName: string;
  createdAt: string;
};

async function mapOffers(
  rows: Array<{
    id: string;
    kind: OfferKind;
    title: string;
    body: string;
    city: string | null;
    status: OfferCard["status"];
    rejection_reason: string | null;
    author_id: string | null;
    created_at: string;
    anonymised?: boolean;
  }>,
  nameSource: "public" | "profiles",
): Promise<OfferCard[]> {
  const ids = [
    ...new Set(
      rows
        .filter((row) => !row.anonymised && row.author_id)
        .map((row) => row.author_id as string),
    ),
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
    kind: row.kind,
    title: row.title,
    body: row.body,
    city: row.city,
    status: row.status,
    rejectionReason: row.rejection_reason,
    authorId: row.anonymised ? null : row.author_id,
    authorName: row.anonymised
      ? "Former member"
      : row.author_id
        ? (names.get(row.author_id) ?? "GECIAN")
        : "Former member",
    createdAt: row.created_at,
  }));
}

const OFFER_COLUMNS =
  "id, kind, title, body, city, status, rejection_reason, author_id, anonymised, created_at";

export async function listApprovedOffers(options: {
  kind?: OfferKind | null;
  page: number;
}): Promise<{ offers: OfferCard[]; total: number }> {
  if (!isSupabaseConfigured()) return { offers: [], total: 0 };

  const supabase = await createServerSupabaseClient();
  const from = (options.page - 1) * OFFERS_PAGE_SIZE;
  const to = from + OFFERS_PAGE_SIZE - 1;

  let query = supabase
    .from("mentoring_offers")
    .select(OFFER_COLUMNS, { count: "exact" })
    .eq("status", "approved")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (options.kind) {
    query = query.eq("kind", options.kind);
  }

  const { data, count } = await query;
  return {
    offers: await mapOffers(data ?? [], "public"),
    total: count ?? 0,
  };
}

export async function getVisibleOffer(id: string): Promise<OfferCard | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("mentoring_offers")
    .select(OFFER_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const [offer] = await mapOffers([data], "public");
  return offer ?? null;
}

export async function listPendingOffers(): Promise<OfferCard[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("mentoring_offers")
    .select(OFFER_COLUMNS)
    .eq("status", "pending")
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  return mapOffers(data ?? [], "profiles");
}

export async function listMyOffers(userId: string): Promise<OfferCard[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("mentoring_offers")
    .select(OFFER_COLUMNS)
    .eq("author_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(40);
  return mapOffers(data ?? [], "public");
}

export type InterestRow = {
  memberId: string;
  name: string;
  batchYear: number | null;
  branch: string | null;
  note: string | null;
  createdAt: string;
};

export async function listOfferInterest(offerId: string): Promise<InterestRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("mentoring_interest")
    .select("member_id, note, created_at")
    .eq("offer_id", offerId)
    .order("created_at", { ascending: true });
  const rows = data ?? [];
  const ids = rows.map((row) => row.member_id);
  const names = new Map<string, { name: string; batchYear: number | null; branch: string | null }>();
  if (ids.length > 0) {
    const { data: profiles } = await supabase
      .from("public_profiles")
      .select("id, name, batch_year, branch")
      .in("id", ids);
    for (const profile of profiles ?? []) {
      names.set(profile.id, {
        name: profile.name,
        batchYear: profile.batch_year,
        branch: profile.branch,
      });
    }
  }
  return rows.map((row) => {
    const profile = names.get(row.member_id);
    return {
      memberId: row.member_id,
      name: profile?.name ?? "GECIAN",
      batchYear: profile?.batchYear ?? null,
      branch: profile?.branch ?? null,
      note: row.note,
      createdAt: row.created_at,
    };
  });
}

export async function hasExpressedInterest(offerId: string, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("mentoring_interest")
    .select("offer_id")
    .eq("offer_id", offerId)
    .eq("member_id", userId)
    .maybeSingle();
  return Boolean(data);
}
