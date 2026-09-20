const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function letterSlug(title: string, unique = ""): string {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  const suffix = unique.replace(/[^a-z0-9]/g, "").slice(0, 8);
  const candidate =
    SLUG_PATTERN.test(base) && base.length >= 2
      ? suffix
        ? `${base}-${suffix}`
        : base
      : `letter-${suffix || Date.now().toString(36)}`;

  return SLUG_PATTERN.test(candidate) ? candidate : `letter-${Date.now().toString(36)}`;
}
