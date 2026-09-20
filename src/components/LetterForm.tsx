"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { allBatchYears, formatBatchLabel } from "@/config/site";
import { saveLetter } from "@/lib/actions/articles";
import { BODY_MAX, TITLE_MAX } from "@/lib/letters";

export function LetterForm({
  articleId,
  defaultTitle = "",
  defaultBody = "",
  defaultBatchYear,
}: {
  articleId?: string;
  defaultTitle?: string;
  defaultBody?: string;
  defaultBatchYear: number | null;
}) {
  const router = useRouter();
  const years = [...allBatchYears()].reverse();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"draft" | "review" | null>(null);

  async function submit(intent: "draft" | "review", form: HTMLFormElement) {
    setError(null);
    setBusy(intent);
    try {
      const payload = new FormData(form);
      payload.set("intent", intent);
      const result = await saveLetter(payload);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      if (intent === "review") {
        router.push(`/articles/${result.slug}`);
      } else {
        router.push(`/write/${result.id}`);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save the letter.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <form
      className="mt-8 grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        submit("review", event.currentTarget);
      }}
    >
      {articleId ? <input type="hidden" name="id" value={articleId} /> : null}

      <label className="block">
        <span className="text-caption text-muted">Title</span>
        <input
          name="title"
          required
          maxLength={TITLE_MAX}
          defaultValue={defaultTitle}
          className="field-ink mt-1"
        />
      </label>

      <label className="block">
        <span className="text-caption text-muted">Letter</span>
        <textarea
          name="body"
          maxLength={BODY_MAX}
          rows={16}
          defaultValue={defaultBody}
          className="field-ink mt-1 min-h-64 py-3"
        />
        <span className="mt-1 block text-caption text-muted">
          Plain language is enough. You may use simple markdown for headings and lists.
        </span>
      </label>

      <label className="block">
        <span className="text-caption text-muted">Batch (optional)</span>
        <select
          name="batch_year"
          defaultValue={defaultBatchYear ?? ""}
          className="field-ink mt-1"
        >
          <option value="">Not tied to one album</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {formatBatchLabel(year)}
            </option>
          ))}
        </select>
      </label>

      {error ? <p className="text-caption text-muted">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          className="btn btn-green"
          disabled={busy !== null}
        >
          {busy === "review" ? "Sending…" : "Send for review"}
        </button>
        <button
          type="button"
          className="btn btn-quiet"
          disabled={busy !== null}
          onClick={(event) => {
            const form = event.currentTarget.form;
            if (form) void submit("draft", form);
          }}
        >
          {busy === "draft" ? "Saving…" : "Save draft"}
        </button>
      </div>
    </form>
  );
}
