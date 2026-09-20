import Link from "next/link";
import { formatBatchLabel, photoHref } from "@/config/site";
import type { PhotoCard } from "@/lib/data";

export function PhotoWall({
  photos,
  hrefOptions,
}: {
  photos: PhotoCard[];
  hrefOptions?: {
    year?: number | null;
    branch?: string | null;
    event?: string | null;
    view?: "timeline";
  };
}) {
  return (
    <div className="wall-settle columns-2 gap-3 sm:columns-3 xl:columns-4">
      {photos.map((photo) => (
        <Link
          key={photo.id}
          href={photoHref(photo.id, hrefOptions)}
          className="photo-tile mb-3 block break-inside-avoid overflow-hidden rounded-2xl"
        >
          <div className="relative">
            {photo.thumbUrl ? (
              // Signed URLs expire; native img avoids Next.js caching a dead signature.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo.thumbUrl}
                alt={photo.altText}
                width={photo.width}
                height={photo.height}
                className="w-full object-cover"
                style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
              />
            ) : (
              <div
                className="photo-fallback flex w-full items-end bg-surface p-3 text-caption text-muted"
                style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
              >
                {photo.altText}
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/75 via-transparent to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 text-paper">
              <span className="min-w-0">
                {photo.caption ? (
                  <span className="mb-0.5 block truncate text-caption text-paper/90">
                    {photo.caption}
                  </span>
                ) : null}
                <span className="block font-semibold tracking-year">
                  {formatBatchLabel(photo.batchYear)}
                  {photo.branch ? ` ${photo.branch}` : ""}
                </span>
                <span className="sr-only">, {photo.contributorName}</span>
              </span>
              {photo.likeCount > 0 ? (
                <span className="shrink-0 rounded-full bg-paper/15 px-2 py-0.5 text-caption">
                  {photo.likeCount}
                </span>
              ) : null}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
