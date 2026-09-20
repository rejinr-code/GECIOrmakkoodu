"use client";

import { useState } from "react";
import { flagComment } from "@/lib/actions/engagement";
import { FLAG_REASONS, type MemoryParent } from "@/lib/engagement";

export function FlagCommentForm({
  commentId,
  parentType,
  parentId,
  next,
}: {
  commentId: string;
  parentType: MemoryParent;
  parentId: string;
  next: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return <p className="text-caption text-muted">Flagged for review</p>;
  }

  return (
    <details className="text-caption">
      <summary className="inline-flex min-h-11 cursor-pointer items-center text-muted">
        Flag
      </summary>
      <form
        className="mt-2 max-w-xs"
        action={async (formData) => {
          setError(null);
          const result = await flagComment(formData);
          if (result && "error" in result && result.error) {
            setError(result.error);
            return;
          }
          setDone(true);
        }}
      >
        <input type="hidden" name="comment_id" value={commentId} />
        <input type="hidden" name="parent_type" value={parentType} />
        <input type="hidden" name="parent_id" value={parentId} />
        <input type="hidden" name="next" value={next} />
        <label className="block">
          <span className="sr-only">Reason</span>
          <select name="reason" required className="field-ink mt-1">
            <option value="">Why flag this?</option>
            {FLAG_REASONS.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </select>
        </label>
        {error ? <p className="mt-2 text-muted">{error}</p> : null}
        <button type="submit" className="mt-2 inline-flex min-h-11 items-center font-medium">
          Send flag
        </button>
      </form>
    </details>
  );
}
