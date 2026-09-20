"use client";

import { useState } from "react";
import { togglePhotoLike } from "@/lib/actions/engagement";

export function LikeButton({
  photoId,
  liked,
  count,
  canLike,
}: {
  photoId: string;
  liked: boolean;
  count: number;
  canLike: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const label = count === 1 ? "like" : "likes";

  if (!canLike) {
    return (
      <p className="text-caption text-muted">
        {count} {label}
      </p>
    );
  }

  return (
    <form
      action={async (formData) => {
        setError(null);
        const result = await togglePhotoLike(formData);
        if (result && "error" in result && result.error) {
          setError(result.error);
        }
      }}
    >
      <input type="hidden" name="photo_id" value={photoId} />
      <button
        type="submit"
        className={`inline-flex min-h-11 items-center font-medium ${
          liked ? "text-gold" : "text-ink"
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
