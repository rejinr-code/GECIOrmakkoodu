"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CommentComposer } from "@/components/CommentComposer";
import { LikeButton } from "@/components/LikeButton";
import { loadPhotoSlide, type PhotoSlide, type ViewerContext } from "@/lib/actions/viewer";
import { isVerified, type SessionState } from "@/lib/session";
import { photoHref } from "@/config/site";

function formatNoteDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

export function PhotoViewer({
  slide: initial,
  context,
  startOpen = false,
  commentsEnabled,
  session,
}: {
  slide: PhotoSlide;
  context: ViewerContext;
  startOpen?: boolean;
  commentsEnabled: boolean;
  session: SessionState;
}) {
  const [open, setOpen] = useState(startOpen);
  const [slide, setSlide] = useState(initial);
  const [direction, setDirection] = useState<"next" | "prev" | "in">("in");
  const [busy, setBusy] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cache = useRef(new Map<string, PhotoSlide>([[initial.id, initial]]));
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const verified = isVerified(session.profile);

  useEffect(() => {
    cache.current.set(initial.id, initial);
    setSlide(initial);
  }, [initial]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const closedHref = photoHref(slide.id, {
    year: context.timeline ? null : context.year,
    branch: context.timeline ? null : context.branch,
    event: context.event,
    view: context.timeline ? "timeline" : undefined,
  });

  const syncUrl = useCallback(
    (next: PhotoSlide, isOpen: boolean) => {
      const href = isOpen ? next.href : photoHref(next.id, {
        year: context.timeline ? null : context.year,
        branch: context.timeline ? null : context.branch,
        event: context.event,
        view: context.timeline ? "timeline" : undefined,
      });
      window.history.replaceState(null, "", href);
    },
    [context],
  );

  const go = useCallback(
    async (id: string | null, dir: "next" | "prev") => {
      if (!id || busy) return;
      setBusy(true);
      setDirection(dir);
      let next = cache.current.get(id) ?? null;
      if (!next) {
        next = await loadPhotoSlide(id, context);
        if (next) cache.current.set(id, next);
      }
      if (next) {
        setSlide(next);
        syncUrl(next, true);
        if (next.previousSrc) {
          const image = new Image();
          image.src = next.previousSrc;
        }
        if (next.nextSrc) {
          const image = new Image();
          image.src = next.nextSrc;
        }
      }
      setBusy(false);
    },
    [busy, context, syncUrl],
  );

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        void go(slide.previousId, "prev");
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        void go(slide.nextId, "next");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, slide.previousId, slide.nextId, go]);

  useEffect(() => {
    if (!open) return;
    if (slide.previousId && !cache.current.has(slide.previousId)) {
      void loadPhotoSlide(slide.previousId, context).then((next) => {
        if (next) cache.current.set(next.id, next);
      });
    }
    if (slide.nextId && !cache.current.has(slide.nextId)) {
      void loadPhotoSlide(slide.nextId, context).then((next) => {
        if (next) cache.current.set(next.id, next);
      });
    }
  }, [open, slide.previousId, slide.nextId, context]);

  function close() {
    setOpen(false);
    setNotesOpen(false);
    window.history.replaceState(null, "", closedHref);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setDirection("in");
          setOpen(true);
          syncUrl(slide, true);
        }}
        className="block w-full cursor-zoom-in text-left"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="View photograph larger"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={slide.src}
          alt={slide.alt}
          width={slide.width}
          height={slide.height}
          className="print-mat max-h-[80dvh] w-full rounded-2xl object-contain"
        />
      </button>

      <dialog
        ref={dialogRef}
        className="photo-viewer"
        onClose={close}
        aria-label={slide.caption || slide.alt}
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex items-center justify-between gap-3 px-4 py-3 text-paper">
            <p className="min-w-0 truncate text-caption">
              {slide.batchLabel}
              {slide.branch ? ` ${slide.branch}` : ""}
              {slide.eventLabel ? ` · ${slide.eventLabel}` : ""}
            </p>
            <button type="button" className="btn btn-quiet text-paper" onClick={close}>
              Close
            </button>
          </div>

          <div
            className="relative flex min-h-0 flex-1 items-center justify-center px-12 py-2"
            onPointerDown={(event) => {
              swipe.current = { x: event.clientX, y: event.clientY };
            }}
            onPointerUp={(event) => {
              if (!swipe.current) return;
              const dx = event.clientX - swipe.current.x;
              const dy = event.clientY - swipe.current.y;
              swipe.current = null;
              if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy)) return;
              if (dx > 0) void go(slide.previousId, "prev");
              else void go(slide.nextId, "next");
            }}
          >
            {slide.previousId ? (
              <button
                type="button"
                className="viewer-arrow left-3"
                onClick={() => void go(slide.previousId, "prev")}
                aria-label="Previous photograph"
              >
                ‹
              </button>
            ) : null}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={slide.id + direction}
              src={slide.src}
              alt={slide.alt}
              width={slide.width}
              height={slide.height}
              className="viewer-print"
              data-dir={direction}
              draggable={false}
            />
            {slide.nextId ? (
              <button
                type="button"
                className="viewer-arrow right-3"
                onClick={() => void go(slide.nextId, "next")}
                aria-label="Next photograph"
              >
                ›
              </button>
            ) : null}
          </div>

          <div className="border-t border-paper/15 bg-ink/30 px-4 py-4 text-paper backdrop-blur-md">
            {slide.caption ? <p className="max-w-3xl text-lead">{slide.caption}</p> : null}
            <p className="mt-1 text-caption text-paper/70">Courtesy: {slide.contributorName}</p>
            {commentsEnabled ? (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <LikeButton
                  parentType="photo"
                  parentId={slide.id}
                  next={slide.href}
                  liked={slide.liked}
                  count={slide.likeCount}
                  canLike={verified}
                />
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center rounded-full bg-paper/10 px-4 text-caption"
                  onClick={() => setNotesOpen((value) => !value)}
                  aria-expanded={notesOpen}
                >
                  {slide.comments.length}{" "}
                  {slide.comments.length === 1 ? "comment" : "comments"}
                </button>
                <Link href={closedHref} className="text-caption text-paper/70 underline-offset-4 hover:underline">
                  Open page
                </Link>
                {!session.userId ? (
                  <Link href="/sign-in" className="text-caption text-paper/70 underline-offset-4 hover:underline">
                    Sign in to like
                  </Link>
                ) : null}
              </div>
            ) : null}
            {commentsEnabled && notesOpen ? (
              <div className="viewer-notes mt-4 max-h-[32dvh] overflow-y-auto pr-1">
                {slide.comments.length === 0 ? (
                  <p className="text-caption text-paper/70">No comments yet. Anyone can read them once they are here.</p>
                ) : (
                  <ul className="space-y-3">
                    {slide.comments.map((comment) => (
                      <li key={comment.id} className="rounded-2xl bg-paper/8 px-4 py-3">
                        <p className="whitespace-pre-wrap text-caption">{comment.body}</p>
                        <p className="mt-1 text-caption text-paper/60">
                          {comment.authorName} · {formatNoteDate(comment.createdAt)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
                {verified ? (
                  <CommentComposer parentType="photo" parentId={slide.id} next={slide.href} />
                ) : session.userId ? (
                  <p className="mt-3 text-caption text-paper/70">
                    After a volunteer verifies you, you can comment.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </dialog>
    </>
  );
}
