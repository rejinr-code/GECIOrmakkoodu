import Link from "next/link";
import { albumHref, formatBatchLabel } from "@/config/site";
import type { YearAlbum } from "@/lib/data";

export function YearAlbumGrid({ albums }: { albums: YearAlbum[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {albums.map((album) => (
        <Link
          key={album.year}
          href={albumHref({ year: album.year })}
          className="photo-tile group relative block aspect-[3/4] overflow-hidden rounded-2xl"
        >
          {album.cover?.thumbUrl ? (
            // Signed URLs expire; native img avoids Next.js caching a dead signature.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={album.cover.thumbUrl}
              alt={album.cover.altText}
              className="absolute inset-0 size-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-surface" />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3 sm:p-4">
            <p className="font-semibold tracking-year text-[1.85rem] leading-none text-paper sm:text-[2.15rem]">
              {album.year}
            </p>
            <p className="mt-1 text-caption text-paper/80">
              {formatBatchLabel(album.year)}
              {album.count > 0
                ? ` · ${album.count} ${album.count === 1 ? "print" : "prints"}`
                : ""}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
