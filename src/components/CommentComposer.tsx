"use client";

import { useRef, useState } from "react";
import { addComment } from "@/lib/actions/engagement";
import { COMMENT_MAX_LENGTH, type MemoryParent } from "@/lib/engagement";

export function CommentComposer({
  parentType,
  parentId,
  next,
}: {
  parentType: MemoryParent;
  parentId: string;
  next: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      className="mt-6"
      action={async (formData) => {
        setError(null);
        const result = await addComment(formData);
        if (result && "error" in result && result.error) {
          setError(result.error);
          return;
        }
        formRef.current?.reset();
      }}
    >
      <input type="hidden" name="parent_type" value={parentType} />
      <input type="hidden" name="parent_id" value={parentId} />
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className="text-caption text-muted">Leave a comment</span>
        <textarea
          name="body"
          required
          maxLength={COMMENT_MAX_LENGTH}
          rows={3}
          className="field-ink mt-1 min-h-24 py-2"
        />
      </label>
      {error ? <p className="mt-2 text-caption text-muted">{error}</p> : null}
      <button type="submit" className="btn btn-green mt-3">
        Comment
      </button>
    </form>
  );
}
