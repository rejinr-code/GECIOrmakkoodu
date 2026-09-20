import Link from "next/link";
import { dismissCommentReport, removeFlaggedComment } from "@/lib/actions/admin";
import { listOpenCommentReports } from "@/lib/data";

export const metadata = { title: "Flagged comments" };

export default async function ReportsPage() {
  const reports = await listOpenCommentReports();

  return (
    <main className="px-4 py-10 sm:px-8">
      <h1 className="text-h1 font-medium tracking-wordmark">Flagged comments</h1>
      <p className="mt-3 max-w-prose text-muted">
        Members can flag a note. Remove it from the photograph, or dismiss the
        flag if it should stay.
      </p>

      {reports.length === 0 ? (
        <p className="mt-10 text-lead">Nothing waiting.</p>
      ) : (
        <ul className="mt-10 space-y-8">
          {reports.map((report) => (
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
              <div className="mt-4 flex flex-wrap gap-3">
                <form action={removeFlaggedComment}>
                  <input type="hidden" name="comment_id" value={report.commentId} />
                  <input type="hidden" name="photo_id" value={report.photoId ?? ""} />
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
