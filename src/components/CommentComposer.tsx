"use client";

import { useRef, useState } from "react";
import { addPhotoComment } from "@/lib/actions/engagement";
import { COMMENT_MAX_LENGTH } from "@/lib/engagement";

export function CommentComposer({ photoId }: { photoId: string }) {
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      className="mt-6"
      action={async (formData) => {
        setError(null);
        const result = await addPhotoComment(formData);
        if (result && "error" in result && result.error) {
          setError(result.error);
          return;
        }
        formRef.current?.reset();
      }}
    >
      <input type="hidden" name="photo_id" value={photoId} />
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
