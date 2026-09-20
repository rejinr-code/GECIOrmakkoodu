"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function PhotoLightbox({
  src,
  alt,
  width,
  height,
  previousHref,
  nextHref,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  previousHref?: string | null;
  nextHref?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowLeft" && previousHref) {
        event.preventDefault();
        router.push(previousHref);
      }
      if (event.key === "ArrowRight" && nextHref) {
        event.preventDefault();
        router.push(nextHref);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, previousHref, nextHref, router]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full cursor-zoom-in text-left"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="View larger photograph"
      >
        {/* Signed URLs expire; native img avoids Next.js caching a dead signature. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="print-mat max-h-[80dvh] w-full object-contain"
        />
      </button>

      <dialog
        ref={dialogRef}
        className="photo-lightbox m-auto max-h-[96dvh] w-[min(96vw,72rem)] bg-paper p-3 text-ink shadow-none"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === dialogRef.current) setOpen(false);
        }}
        aria-label={alt}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="max-h-[82dvh] w-full object-contain"
        />
        <div className="mt-3 flex min-h-11 flex-wrap items-center gap-6 text-caption">
          {previousHref ? <Link href={previousHref}>Previous</Link> : null}
          {nextHref ? <Link href={nextHref}>Next</Link> : null}
          <form method="dialog" className="ml-auto">
            <button type="submit" className="btn btn-quiet">
              Close
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
}
