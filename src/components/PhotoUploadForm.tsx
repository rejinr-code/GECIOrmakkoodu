"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  allBatchYears,
  branchesForYear,
  formatBatchLabel,
  siteConfig,
} from "@/config/site";
import { compressPhotograph } from "@/lib/compressPhoto";
import { uploadPhotograph } from "@/lib/actions/photos";
import { PhotoTagField } from "@/components/PhotoTagField";

type EventTag = { slug: string; label: string };

export function PhotoUploadForm({
  defaultYear,
  defaultBranch,
  eventTags,
  publish = false,
  allowCollege = false,
}: {
  defaultYear: number;
  defaultBranch: string | null;
  eventTags: EventTag[];
  publish?: boolean;
  allowCollege?: boolean;
}) {
  const router = useRouter();
  const years = useMemo(() => [...allBatchYears()].reverse(), []);
  const [album, setAlbum] = useState<"batch" | "college">("batch");
  const [year, setYear] = useState(defaultYear);
  const [branch, setBranch] = useState(defaultBranch ?? "");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const college = allowCollege && album === "college";
  const branches = college ? siteConfig.branches : branchesForYear(year);

  function onYearChange(next: number) {
    setYear(next);
    if (branch && !branchesForYear(next).some((item) => item.id === branch)) {
      setBranch("");
    }
  }

  function onFile(next: File | null) {
    setFile(next);
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return next ? URL.createObjectURL(next) : null;
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!file) {
      setError("Choose a photograph first.");
      return;
    }

    setBusy(true);
    try {
      const compressed = await compressPhotograph(file);
      const form = event.currentTarget;
      const payload = new FormData(form);
      payload.set(
        "full",
        new File([compressed.full], "original.webp", { type: "image/webp" }),
      );
      payload.set(
        "thumb",
        new File([compressed.thumb], "thumb.webp", { type: "image/webp" }),
      );
      payload.set("width", String(compressed.width));
      payload.set("height", String(compressed.height));
      const result = await uploadPhotograph(payload);
      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      }
      if (result && "id" in result) {
        router.push(`/photos/${result.id}`);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not prepare the photograph.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 grid max-w-xl gap-5">
      <label className="block">
        <span className="text-caption text-muted">Photograph</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          className="mt-2 block w-full text-caption"
          onChange={(event) => onFile(event.target.files?.[0] ?? null)}
        />
      </label>

      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="Chosen photograph"
          className="print-mat max-h-80 w-full object-contain"
        />
      ) : null}

      <label className="block">
        <span className="text-caption text-muted">What is in the picture</span>
        <input
          name="alt_text"
          required
          maxLength={240}
          className="field-ink mt-1"
          placeholder="Hostel corridor at dusk, facing the mess"
        />
      </label>

      <label className="block">
        <span className="text-caption text-muted">Caption (optional)</span>
        <input name="caption" maxLength={280} className="field-ink mt-1" />
      </label>

      <label className="block">
        <span className="text-caption text-muted">Courtesy (optional)</span>
        <input
          name="courtesy"
          maxLength={80}
          className="field-ink mt-1"
          placeholder="Leave blank to credit yourself"
        />
        <span className="mt-1 block text-caption text-muted">
          The name shown with this print — photographer, faculty, or office.
        </span>
      </label>

      {allowCollege ? (
        <label className="block">
          <span className="text-caption text-muted">Album</span>
          <select
            name="collection"
            value={album}
            onChange={(event) => {
              const next = event.target.value === "college" ? "college" : "batch";
              setAlbum(next);
              setBranch("");
            }}
            className="field-ink mt-1"
          >
            <option value="batch">A batch album</option>
            <option value="college">College — faculty, office, campus</option>
          </select>
        </label>
      ) : (
        <input type="hidden" name="collection" value="batch" />
      )}

      {college ? null : (
        <label className="block">
          <span className="text-caption text-muted">{allowCollege ? "Batch" : "Album"}</span>
          <select
            name="batch_year"
            required
            value={year}
            onChange={(event) => onYearChange(Number(event.target.value))}
            className="field-ink mt-1"
          >
            {years.map((item) => (
              <option key={item} value={item}>
                {formatBatchLabel(item)}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="block">
        <span className="text-caption text-muted">
          {college ? "Related department (optional)" : "Branch page"}
        </span>
        <select
          name="branch"
          value={branch}
          onChange={(event) => setBranch(event.target.value)}
          className="field-ink mt-1"
        >
          <option value="">{college ? "Whole college" : "Whole album (campus-wide)"}</option>
          {branches.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      {publish ? <input type="hidden" name="publish" value="1" /> : null}

      <PhotoTagField tags={eventTags} immediate={publish} />

      <label className="block">
        <span className="text-caption text-muted">People you can name (optional)</span>
        <input
          name="people_tagged"
          className="field-ink mt-1"
          placeholder="Names separated by commas"
        />
        <span className="mt-1 block text-caption text-muted">
          Typed by you. The archive does not recognise faces.
        </span>
      </label>

      <label className="flex items-start gap-3">
        <input type="checkbox" name="licence" required className="mt-1 size-4" />
        <span className="text-caption">{siteConfig.licenceCheckbox}</span>
      </label>

      {error ? <p className="text-caption text-muted">{error}</p> : null}

      <button type="submit" className="btn btn-green" disabled={busy}>
        {busy ? "Preparing…" : publish ? "Add to the album" : "Send for review"}
      </button>
    </form>
  );
}
