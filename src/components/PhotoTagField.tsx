"use client";

import { useMemo, useState } from "react";
import {
  normalizeTagLabel,
  PHOTO_TAG_MAX,
  tagSlug,
} from "@/lib/tags";

type CatalogTag = { slug: string; label: string };

type SelectedTag = {
  slug: string | null;
  label: string;
};

export function PhotoTagField({ tags }: { tags: CatalogTag[] }) {
  const [selected, setSelected] = useState<SelectedTag[]>([]);
  const [draft, setDraft] = useState("");

  const available = useMemo(() => {
    const taken = new Set(
      selected.map((tag) => tag.slug).filter((slug): slug is string => Boolean(slug)),
    );
    return tags.filter((tag) => !taken.has(tag.slug));
  }, [selected, tags]);

  const full = selected.length >= PHOTO_TAG_MAX;

  function addCatalog(slug: string) {
    const tag = tags.find((item) => item.slug === slug);
    if (!tag || full) return;
    if (selected.some((item) => item.slug === slug)) return;
    setSelected((current) => [...current, { slug: tag.slug, label: tag.label }]);
  }

  function addDraft() {
    const label = normalizeTagLabel(draft);
    if (!label || full) return;
    const slug = tagSlug(label);
    if (
      selected.some(
        (item) =>
          item.label.toLowerCase() === label.toLowerCase() ||
          (slug && item.slug === slug),
      )
    ) {
      setDraft("");
      return;
    }
    const catalog = slug ? tags.find((item) => item.slug === slug) : undefined;
    if (catalog) {
      addCatalog(catalog.slug);
      setDraft("");
      return;
    }
    setSelected((current) => [...current, { slug: null, label }]);
    setDraft("");
  }

  function removeAt(index: number) {
    setSelected((current) => current.filter((_, i) => i !== index));
  }

  return (
    <fieldset className="block">
      <legend className="text-caption text-muted">Tags (optional)</legend>
      {selected.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-1">
          {selected.map((tag, index) => (
            <li key={`${tag.slug ?? "new"}-${tag.label}`}>
              <span className="inline-flex min-h-9 items-center gap-1 rounded-full bg-ink/5 pl-3 pr-1 text-caption">
                {tag.label}
                {!tag.slug ? <span className="text-gold">new</span> : null}
                <button
                  type="button"
                  className="inline-flex size-8 items-center justify-center rounded-full text-muted"
                  onClick={() => removeAt(index)}
                  aria-label={`Remove ${tag.label}`}
                >
                  ×
                </button>
              </span>
              {tag.slug ? (
                <input type="hidden" name="tag_slugs" value={tag.slug} />
              ) : (
                <input type="hidden" name="new_tags" value={tag.label} />
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {full ? (
        <p className="mt-2 text-caption text-muted">Eight tags is the most a print can carry.</p>
      ) : (
        <>
          {available.length > 0 ? (
            <label className="mt-2 block">
              <span className="sr-only">Choose a tag</span>
              <select
                className="field-ink"
                value=""
                onChange={(event) => {
                  addCatalog(event.target.value);
                }}
              >
                <option value="">Choose a tag</option>
                {available.map((tag) => (
                  <option key={tag.slug} value={tag.slug}>
                    {tag.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="mt-2 flex flex-wrap items-center gap-2">
            <span className="sr-only">Create a tag</span>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addDraft();
                }
              }}
              className="field-ink min-w-48 flex-1"
              placeholder="Or type a new tag"
              maxLength={40}
            />
            <button
              type="button"
              className="inline-flex min-h-11 items-center px-4 font-medium"
              onClick={addDraft}
            >
              Add
            </button>
          </label>
          <p className="mt-1 text-caption text-muted">
            New tags wait for a volunteer before they appear in the album.
          </p>
        </>
      )}
    </fieldset>
  );
}
