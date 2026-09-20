"use client";

import { useState } from "react";
import { toggleLike } from "@/lib/actions/engagement";
import type { MemoryParent } from "@/lib/engagement";

export function LikeButton({
  parentType,
  parentId,
  next,
  liked,
  count,
  canLike,
}: {
  parentType: MemoryParent;
  parentId: string;
  next: string;
  liked: boolean;
  count: number;
  canLike: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const label = count === 1 ? "like" : "likes";

  if (!canLike) {
    return (
      <p className="inline-flex min-h-11 items-center rounded-full bg-surface/80 px-4 text-caption">
        {count} {label}
      </p>
    );
  }

  return (
    <form
      action={async (formData) => {
        setError(null);
        const result = await toggleLike(formData);
        if (result && "error" in result && result.error) {
          setError(result.error);
        }
      }}
    >
      <input type="hidden" name="parent_type" value={parentType} />
      <input type="hidden" name="parent_id" value={parentId} />
      <input type="hidden" name="next" value={next} />
      <button
        type="submit"
        className={`btn ${
          liked ? "bg-gold/15 text-gold" : "btn-quiet text-ink"
        }`}
        aria-pressed={liked}
      >
        {liked ? "Liked" : "Like"}
        <span className="ml-2 font-normal text-muted">
          {count} {label}
        </span>
      </button>
      {error ? <p className="text-caption text-muted">{error}</p> : null}
    </form>
  );
}
