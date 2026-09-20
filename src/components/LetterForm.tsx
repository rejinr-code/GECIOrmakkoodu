"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
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
  const [id, setId] = useState(articleId);
  const [title, setTitle] = useState(defaultTitle);
  const [body, setBody] = useState(defaultBody);
  const [batchYear, setBatchYear] = useState(defaultBatchYear ? String(defaultBatchYear) : "");
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"draft" | "review" | "auto" | null>(null);
  const [savedHint, setSavedHint] = useState<string | null>(null);
  const lastSaved = useRef(`${defaultTitle}\n${defaultBody}\n${defaultBatchYear ?? ""}`);

  async function submit(intent: "draft" | "review" | "auto") {
    if (intent !== "auto") {
      setError(null);
      setBusy(intent);
    } else {
      setBusy("auto");
    }
    try {
      const payload = new FormData();
      if (id) payload.set("id", id);
      payload.set("title", title);
      payload.set("body", body);
      payload.set("batch_year", batchYear);
      payload.set("intent", intent === "review" ? "review" : "draft");
      const result = await saveLetter(payload);
      if ("error" in result) {
        if (intent !== "auto") setError(result.error);
        return;
      }
      lastSaved.current = `${title}\n${body}\n${batchYear}`;
      if (!id) {
        setId(result.id);
        window.history.replaceState(null, "", `/write/${result.id}`);
      }
      if (intent === "review") {
        router.push(`/articles/${result.slug}`);
        return;
      }
      if (intent === "draft") {
        router.push(`/write/${result.id}`);
        return;
      }
      setSavedHint("Draft saved");
    } catch (caught) {
      if (intent !== "auto") {
        setError(caught instanceof Error ? caught.message : "Could not save the letter.");
      }
    } finally {
      setBusy(null);
    }
  }

  useEffect(() => {
    if (!title.trim()) return;
    const snapshot = `${title}\n${body}\n${batchYear}`;
    if (snapshot === lastSaved.current) return;
    const timer = window.setTimeout(() => {
      void submit("auto");
    }, 2500);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce on field values only
  }, [title, body, batchYear]);

  return (
    <form
      className="mt-8 grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        void submit("review");
      }}
    >
      <label className="block">
        <span className="text-caption text-muted">Title</span>
        <input
          name="title"
          required
          maxLength={TITLE_MAX}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="field-ink mt-1"
        />
      </label>

      <div className="flex min-h-11 items-center gap-4 text-caption">
        <button
          type="button"
          className={!preview ? "text-gold" : "text-muted"}
          onClick={() => setPreview(false)}
        >
          Write
        </button>
        <button
          type="button"
          className={preview ? "text-gold" : "text-muted"}
          onClick={() => setPreview(true)}
        >
          Preview
        </button>
        {savedHint ? <span className="text-muted">{savedHint}</span> : null}
      </div>

      {preview ? (
        <div className="markdown-body min-h-64 border border-ink/8 px-4 py-3">
          {body.trim() ? (
            <ReactMarkdown>{body}</ReactMarkdown>
          ) : (
            <p className="text-muted">Nothing to preview yet.</p>
          )}
        </div>
      ) : (
        <label className="block">
          <span className="text-caption text-muted">Letter</span>
          <textarea
            name="body"
            maxLength={BODY_MAX}
            rows={16}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            className="field-ink mt-1 min-h-64 py-3"
          />
          <span className="mt-1 block text-caption text-muted">
            Plain language is enough. You may use simple markdown for headings and lists.
          </span>
        </label>
      )}

      <label className="block">
        <span className="text-caption text-muted">Batch (optional)</span>
        <select
          name="batch_year"
          value={batchYear}
          onChange={(event) => setBatchYear(event.target.value)}
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
          disabled={busy === "review" || busy === "draft"}
        >
          {busy === "review" ? "Sending…" : "Send for review"}
        </button>
        <button
          type="button"
          className="btn btn-quiet"
          disabled={busy === "review" || busy === "draft"}
          onClick={() => void submit("draft")}
        >
          {busy === "draft" ? "Saving…" : "Save draft"}
        </button>
      </div>
    </form>
  );
}
