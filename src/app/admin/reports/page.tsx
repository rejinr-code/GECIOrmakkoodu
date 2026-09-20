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
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[44rem] text-left">
            <caption className="sr-only">Flagged photographs and letters</caption>
            <thead>
              <tr className="border-b border-ink/12 text-caption text-muted">
                <th scope="col" className="py-3 pr-4 font-medium">
                  Item
                </th>
                <th scope="col" className="py-3 pr-4 font-medium">
                  Flagged by
                </th>
                <th scope="col" className="py-3 pr-4 font-medium">
                  Reason
                </th>
                <th scope="col" className="py-3 font-medium">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((report) => (
                <tr key={report.id} className="border-b border-ink/8 align-top">
                  <td className="py-4 pr-4">
                    {report.photoId ? (
                      <Link
                        href={`/photos/${report.photoId}`}
                        className="underline underline-offset-4"
                      >
                        Photograph
                      </Link>
                    ) : null}
                    {report.articleSlug ? (
                      <Link
                        href={`/articles/${report.articleSlug}`}
                        className="underline underline-offset-4"
                      >
                        Letter
                      </Link>
                    ) : null}
                  </td>
                  <td className="py-4 pr-4 text-muted">{report.reporterName}</td>
                  <td className="py-4 pr-4 text-caption text-muted">{report.reason}</td>
                  <td className="py-4">
                    <div className="flex flex-wrap gap-2">
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
                          Dismiss
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mt-14 text-h3 font-medium tracking-wordmark">Comments</h2>
      {comments.length === 0 ? (
        <p className="mt-4 text-muted">Nothing waiting.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[48rem] text-left">
            <caption className="sr-only">Flagged comments</caption>
            <thead>
              <tr className="border-b border-ink/12 text-caption text-muted">
                <th scope="col" className="py-3 pr-4 font-medium">
                  Comment
                </th>
                <th scope="col" className="py-3 pr-4 font-medium">
                  On
                </th>
                <th scope="col" className="py-3 pr-4 font-medium">
                  Flagged by
                </th>
                <th scope="col" className="py-3 pr-4 font-medium">
                  Reason
                </th>
                <th scope="col" className="py-3 font-medium">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {comments.map((report) => (
                <tr key={report.id} className="border-b border-ink/8 align-top">
                  <td className="max-w-sm py-4 pr-4 whitespace-pre-wrap">
                    {report.commentBody}
                  </td>
                  <td className="py-4 pr-4 text-caption">
                    {report.photoId ? (
                      <Link
                        href={`/photos/${report.photoId}`}
                        className="underline underline-offset-4"
                      >
                        Photograph
                      </Link>
                    ) : null}
                    {report.articleSlug ? (
                      <Link
                        href={`/articles/${report.articleSlug}`}
                        className="underline underline-offset-4"
                      >
                        Letter
                      </Link>
                    ) : null}
                  </td>
                  <td className="py-4 pr-4 text-muted">{report.reporterName}</td>
                  <td className="py-4 pr-4 text-caption text-muted">{report.reason}</td>
                  <td className="py-4">
                    <div className="flex flex-wrap gap-2">
                      <form action={removeFlaggedComment}>
                        <input type="hidden" name="comment_id" value={report.commentId} />
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
                          Dismiss
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
