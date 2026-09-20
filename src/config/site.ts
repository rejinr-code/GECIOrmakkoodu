/**
 * Association configuration — the only file that may contain GECIAN / Ormakkoodu
 * branding, colours, batch range, branches, and legal identity copy.
 *
 * Secrets, project URLs, and the public contact email live in .env / .env.local.
 * Do not hardcode those strings in components; import from here or from env.
 */

export const siteConfig = {
  name: "Ormakkoodu",
  nameMl: "ഓർമ്മക്കൂട്",
  meaning: "a nest of memories",
  tagline: "the GECIAN archive",
  association: {
    shortName: "GECIAN",
    name: "GECIAN",
    fullName: "GECIAN Alumni Association",
    collegeName: "Government Engineering College Idukki",
    collegeShort: "GEC Idukki",
    collegeLocation: "Painavu, Idukki, Kerala",
    /** Admission year of the first batch. The year rail starts here. */
    openedYear: 2000,
    /** Used to render "2007–2011" from an admission year. */
    programmeYears: 4,
  },
  logo: {
    src: "/branding/geci-idukki.png",
    alt: "Government Engineering College Idukki",
  },
  colors: {
    ink: "#1C1915",
    surface: "#E8E0D4",
    paper: "#F6F1E8",
    green: "#1E7A46",
    gold: "#C9A227",
    muted: "#7D7468",
  },
  fonts: {
    sans: "Poppins",
    malayalam: "Manjari",
  },
  /**
   * `from` is the first admission year the branch existed.
   * Mechanical Engineering started in 2013.
   * Robotics and Artificial Intelligence started in 2025.
   */
  branches: [
    { id: "CSE", label: "Computer Science and Engineering", from: 2000 },
    { id: "ECE", label: "Electronics and Communication Engineering", from: 2000 },
    { id: "EEE", label: "Electrical and Electronics Engineering", from: 2000 },
    { id: "IT", label: "Information Technology", from: 2000 },
    { id: "ME", label: "Mechanical Engineering", from: 2013 },
    { id: "RAI", label: "Robotics and Artificial Intelligence", from: 2025 },
  ],
  legal: {
    currentConsentVersion: "1.0",
    governingLaw: "India",
    jurisdiction: "Idukki, Kerala",
    slugs: [
      "privacy",
      "terms",
      "content-policy",
      "takedown",
      "contact",
    ] as const,
  },
  contact: {
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "",
  },
  licenceCheckbox:
    "I took this photograph or have permission to share it, and I grant GECIAN a non-exclusive licence to publish and archive it.",
} as const;

export type BranchId = (typeof siteConfig.branches)[number]["id"];
export type LegalSlug = (typeof siteConfig.legal.slugs)[number];

export function currentBatchYear(now = new Date()): number {
  return now.getFullYear();
}

export function batchYearRange(now = new Date()): { from: number; to: number } {
  return { from: siteConfig.association.openedYear, to: currentBatchYear(now) };
}

/** Admission year of the most recently graduated cohort, e.g. 2022 in 2026. */
export function defaultGalleryYear(now = new Date()): number {
  const graduated = currentBatchYear(now) - siteConfig.association.programmeYears;
  return Math.max(siteConfig.association.openedYear, graduated);
}

export function formatBatchLabel(admissionYear: number): string {
  const end = admissionYear + siteConfig.association.programmeYears;
  return `${admissionYear}–${end}`;
}

export function parseAdmissionYear(value: string | undefined, now = new Date()): number | null {
  if (!value) return null;
  const year = Number(value);
  if (!Number.isInteger(year)) return null;
  const { from, to } = batchYearRange(now);
  if (year < from || year > to) return null;
  return year;
}

export function parseBranch(value: string | undefined, admissionYear: number): BranchId | null {
  if (!value) return null;
  if (!isBranchOffered(value, admissionYear)) return null;
  return value as BranchId;
}

export function isTimelineView(value: string | undefined): boolean {
  return value === "timeline";
}

export function parseEventSlug(
  value: string | undefined,
  tags: Array<{ slug: string }>,
): string | null {
  if (!value) return null;
  return tags.some((tag) => tag.slug === value) ? value : null;
}

export function albumHref(options: {
  year?: number | null;
  branch?: string | null;
  event?: string | null;
  page?: number;
  view?: "timeline";
}): string {
  const params = new URLSearchParams();
  if (options.view === "timeline") {
    params.set("view", "timeline");
  } else if (options.year) {
    params.set("year", String(options.year));
    if (options.branch) params.set("branch", options.branch);
  }
  if (options.event) params.set("event", options.event);
  if (options.page && options.page > 1) params.set("page", String(options.page));
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

export function photoHref(
  id: string,
  options?: {
    year?: number | null;
    branch?: string | null;
    event?: string | null;
    view?: "timeline";
  },
): string {
  const params = new URLSearchParams();
  if (options?.view === "timeline") {
    params.set("view", "timeline");
  } else if (options?.year) {
    params.set("year", String(options.year));
    if (options.branch) params.set("branch", options.branch);
  }
  if (options?.event) params.set("event", options.event);
  const query = params.toString();
  return query ? `/photos/${id}?${query}` : `/photos/${id}`;
}

export function allBatchYears(now = new Date()): number[] {
  const { from, to } = batchYearRange(now);
  const years: number[] = [];
  for (let year = from; year <= to; year += 1) {
    years.push(year);
  }
  return years;
}

export function branchesForYear(admissionYear: number) {
  return siteConfig.branches.filter((branch) => admissionYear >= branch.from);
}

export function branchLabel(id: string): string {
  const match = siteConfig.branches.find((branch) => branch.id === id);
  return match?.label ?? id;
}

export function isBranchOffered(id: string, admissionYear: number): boolean {
  return branchesForYear(admissionYear).some((branch) => branch.id === id);
}

export type OfferKind = "mentoring" | "internship";

export function parseOfferKind(value: string | undefined): OfferKind | null {
  if (value === "mentoring" || value === "internship") return value;
  return null;
}

export function sanitizeSearch(value: string | undefined, max = 80): string {
  if (!value) return "";
  return value.replace(/[%_\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

export function directoryHref(options: {
  q?: string;
  year?: number | null;
  branch?: string | null;
  page?: number;
}): string {
  const params = new URLSearchParams();
  if (options.q) params.set("q", options.q);
  if (options.year) params.set("year", String(options.year));
  if (options.branch) params.set("branch", options.branch);
  if (options.page && options.page > 1) params.set("page", String(options.page));
  const query = params.toString();
  return query ? `/people?${query}` : "/people";
}

export function offersHref(options: { kind?: OfferKind | null; page?: number }): string {
  const params = new URLSearchParams();
  if (options.kind) params.set("kind", options.kind);
  if (options.page && options.page > 1) params.set("page", String(options.page));
  const query = params.toString();
  return query ? `/offers?${query}` : "/offers";
}
