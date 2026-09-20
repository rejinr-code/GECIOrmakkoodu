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
          className="photo-tile mb-3 block break-inside-avoid"
        >
          {photo.thumbUrl ? (
            // Signed URLs expire; native img avoids Next.js caching a dead signature.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo.thumbUrl}
              alt={photo.altText}
              width={photo.width}
              height={photo.height}
              className="print-mat w-full"
              style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
            />
          ) : (
            <div
              className="photo-fallback print-mat flex w-full items-end p-3 text-caption text-muted"
              style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
            >
              {photo.altText}
            </div>
          )}
          {photo.caption ? (
            <p className="mt-2 text-caption text-ink/80">{photo.caption}</p>
          ) : null}
          <p className="text-caption text-muted">
            {formatBatchLabel(photo.batchYear)}
            {photo.branch ? ` ${photo.branch}` : ""}
            <span className="sr-only">, {photo.contributorName}</span>
          </p>
        </Link>
      ))}
    </div>
  );
}
