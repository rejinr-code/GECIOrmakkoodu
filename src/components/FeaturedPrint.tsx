import Link from "next/link";
import { albumHref, formatBatchLabel, photoHref } from "@/config/site";
import type { PhotoCard } from "@/lib/data";
import { isVerified, type SessionState } from "@/lib/session";

export function FeaturedPrint({
  photo,
  session,
}: {
  photo: PhotoCard | null;
  session: SessionState;
}) {
  const verified = isVerified(session.profile);

  return (
    <div className="mx-auto w-full max-w-[22rem] rounded-[1.75rem] bg-paper p-3 shadow-[0_28px_70px_-28px_rgba(28,25,21,0.42)] ring-1 ring-ink/10">
      {photo?.thumbUrl ? (
        <Link href={photoHref(photo.id)} className="photo-tile block overflow-hidden rounded-xl">
          {/* Signed URLs expire; native img avoids Next.js caching a dead signature. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.thumbUrl}
            alt={photo.altText}
            width={photo.width}
            height={photo.height}
            className="aspect-[4/5] w-full object-cover"
          />
        </Link>
      ) : (
        <div className="aspect-[4/5] rounded-xl bg-surface" />
      )}
      <div className="px-3 pb-2 pt-5">
        <p className="text-caption text-muted">
          {photo ? formatBatchLabel(photo.batchYear) : "The nest is waiting"}
        </p>
        <p className="mt-1 text-h3 font-medium tracking-wordmark">
          {photo?.caption || (photo ? "Most remembered" : "Open a year album")}
        </p>
        {photo ? (
          <Link
            href={albumHref({ year: photo.batchYear })}
            className="mt-4 flex min-h-11 items-center justify-between rounded-full bg-surface px-4 text-caption text-ink"
          >
            See the album
            <span aria-hidden>→</span>
          </Link>
        ) : verified ? (
          <Link
            href="/contribute"
            className="mt-4 flex min-h-11 items-center justify-between rounded-full bg-surface px-4 text-caption text-ink"
          >
            Add the first photograph
            <span aria-hidden>→</span>
          </Link>
        ) : (
          <Link
            href="/join"
            className="mt-4 flex min-h-11 items-center justify-between rounded-full bg-surface px-4 text-caption text-ink"
          >
            Join and add a print
            <span aria-hidden>→</span>
          </Link>
        )}
      </div>
    </div>
  );
}
