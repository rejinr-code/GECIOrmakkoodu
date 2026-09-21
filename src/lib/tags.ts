export const PHOTO_TAG_MAX = 8;
export const PHOTO_TAG_LABEL_MAX = 40;

export type PhotoTag = {
  slug: string;
  label: string;
  status: "pending" | "approved" | "rejected";
};

export function normalizeTagLabel(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").slice(0, PHOTO_TAG_LABEL_MAX);
}

export function tagSlug(label: string): string | null {
  const base = normalizeTagLabel(label)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(base) && base.length >= 2) return base;
  return null;
}

export function tagLine(tags: PhotoTag[]): string | null {
  const visible = tags.filter((tag) => tag.status !== "rejected");
  if (visible.length === 0) return null;
  return visible.map((tag) => tag.label).join(" · ");
}
