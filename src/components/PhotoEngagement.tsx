import Link from "next/link";
import { CommentComposer } from "@/components/CommentComposer";
import { ContributorLink } from "@/components/ContributorLink";
import { FlagCommentForm } from "@/components/FlagCommentForm";
import { LikeButton } from "@/components/LikeButton";
import { removeFlaggedComment } from "@/lib/actions/admin";
import type { MemoryComment, ReactionState } from "@/lib/data";
import type { MemoryParent } from "@/lib/engagement";
import type { SessionState } from "@/lib/session";
import { isStaff, isVerified } from "@/lib/session";

function formatNoteDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

export function PhotoEngagement({
  parentType,
  parentId,
  next,
  comments,
  reaction,
  flaggedIds,
  session,
}: {
  parentType: MemoryParent;
  parentId: string;
  next: string;
  comments: MemoryComment[];
  reaction: ReactionState;
  flaggedIds: Set<string>;
  session: SessionState;
}) {
  const verified = isVerified(session.profile);
  const staff = isStaff(session.profile);

  return (
    <section className="mt-10 max-w-prose border-t border-ink/8 pt-8">
      <LikeButton
        parentType={parentType}
        parentId={parentId}
        next={next}
        liked={reaction.liked}
        count={reaction.count}
        canLike={verified}
      />

      {!session.userId ? (
        <p className="mt-3 text-caption text-muted">
          <Link href="/sign-in" className="underline underline-offset-4">
            Sign in
          </Link>{" "}
          to like or comment.
        </p>
      ) : null}
      {session.userId && !verified ? (
        <p className="mt-3 text-caption text-muted">
          After a volunteer verifies you, you can like and comment.
        </p>
      ) : null}

      <h2 className="mt-10 text-h3 font-medium tracking-wordmark">
        Comments
        {comments.length > 0 ? (
          <span className="ml-2 text-caption font-normal text-muted">
            {comments.length}
          </span>
        ) : null}
      </h2>

      {comments.length === 0 ? (
        <p className="mt-4 text-muted">No comments yet.</p>
      ) : (
        <ul className="mt-6 space-y-6">
          {comments.map((comment) => (
            <li key={comment.id} className="border-t border-ink/8 pt-4">
              <p className="whitespace-pre-wrap">{comment.body}</p>
              <p className="mt-2 text-caption text-muted">
                <ContributorLink id={comment.profileId} name={comment.authorName} />
                <span className="mx-2" aria-hidden>
                  ·
                </span>
                {formatNoteDate(comment.createdAt)}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-x-4">
                {session.userId &&
                comment.authorId !== session.userId &&
                !flaggedIds.has(comment.id) ? (
                  <FlagCommentForm
                    commentId={comment.id}
                    parentType={parentType}
                    parentId={parentId}
                    next={next}
                  />
                ) : null}
                {flaggedIds.has(comment.id) ? (
                  <p className="text-caption text-muted">Flagged for review</p>
                ) : null}
                {staff ? (
                  <form action={removeFlaggedComment}>
                    <input type="hidden" name="comment_id" value={comment.id} />
                    <button
                      type="submit"
                      className="inline-flex min-h-11 items-center text-caption font-medium text-muted"
                    >
                      Remove
                    </button>
                  </form>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {verified ? (
        <CommentComposer parentType={parentType} parentId={parentId} next={next} />
      ) : null}
    </section>
  );
}
