import Link from "next/link";
import {
  dismissCommentReport,
  removeFlaggedComment,
  removeReportedItem,
} from "@/lib/actions/admin";
import { listOpenCommentReports, listOpenItemReports } from "@/lib/data";

export const metadata = { title: "Flagged comments" };

export default async function ReportsPage() {
  const [comments, items] = await Promise.all([
    listOpenCommentReports(),
    listOpenItemReports(),
  ]);

  return (
    <main className="px-4 py-10 sm:px-8">
      <h1 className="text-h1 font-medium tracking-wordmark">Flags</h1>
      <p className="mt-3 max-w-prose text-muted">
        Members can flag a photograph, letter, or comment. Remove it, or dismiss
        the flag if it should stay.
      </p>

      <h2 className="mt-12 text-h3 font-medium tracking-wordmark">Photographs and letters</h2>
      {items.length === 0 ? (
        <p className="mt-4 text-muted">Nothing waiting.</p>
      ) : (
        <ul className="mt-6 space-y-8">
          {items.map((report) => (
            <li key={report.id} className="border-t border-ink/8 pt-6">
              <p className="text-caption text-muted">
                Flagged by {report.reporterName} · {report.reason}
              </p>
              {report.photoId ? (
                <p className="mt-1 text-caption">
                  <Link
                    href={`/photos/${report.photoId}`}
                    className="underline underline-offset-4"
                  >
                    Open photograph
                  </Link>
                </p>
              ) : null}
              {report.articleSlug ? (
                <p className="mt-1 text-caption">
                  <Link
                    href={`/articles/${report.articleSlug}`}
                    className="underline underline-offset-4"
                  >
                    Open letter
                  </Link>
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-3">
                <form action={removeReportedItem}>
                  <input type="hidden" name="report_id" value={report.id} />
                  <input type="hidden" name="target_type" value={report.targetType} />
                  <input type="hidden" name="target_id" value={report.targetId} />
                  <button type="submit" className="btn btn-green">
                    Remove
                  </button>
                </form>
                <form action={dismissCommentReport}>
                  <input type="hidden" name="report_id" value={report.id} />
                  <button
                    type="submit"
                    className="inline-flex min-h-11 items-center px-4 font-medium text-muted"
                  >
                    Dismiss flag
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-14 text-h3 font-medium tracking-wordmark">Comments</h2>
      {comments.length === 0 ? (
        <p className="mt-4 text-muted">Nothing waiting.</p>
      ) : (
        <ul className="mt-6 space-y-8">
          {comments.map((report) => (
            <li key={report.id} className="border-t border-ink/8 pt-6">
              <p className="whitespace-pre-wrap text-lead">{report.commentBody}</p>
              <p className="mt-2 text-caption text-muted">
                Flagged by {report.reporterName} · {report.reason}
              </p>
              {report.photoId ? (
                <p className="mt-1 text-caption">
                  <Link
                    href={`/photos/${report.photoId}`}
                    className="underline underline-offset-4"
                  >
                    Open photograph
                  </Link>
                </p>
              ) : null}
              {report.articleSlug ? (
                <p className="mt-1 text-caption">
                  <Link
                    href={`/articles/${report.articleSlug}`}
                    className="underline underline-offset-4"
                  >
                    Open letter
                  </Link>
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-3">
                <form action={removeFlaggedComment}>
                  <input type="hidden" name="comment_id" value={report.commentId} />
                  <button type="submit" className="btn btn-green">
                    Remove comment
                  </button>
                </form>
                <form action={dismissCommentReport}>
                  <input type="hidden" name="report_id" value={report.id} />
                  <button
                    type="submit"
                    className="inline-flex min-h-11 items-center px-4 font-medium text-muted"
                  >
                    Dismiss flag
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
