import Link from "next/link";
import { formatBatchLabel } from "@/config/site";
import { ModerationSelect, SelectBox } from "@/components/ModerationSelect";
import { moderateArticle } from "@/lib/actions/admin";
import { listPendingArticles } from "@/lib/data";

export const metadata = { title: "Letters" };

export default async function AdminLettersPage() {
  const pending = await listPendingArticles();

  return (
    <main className="px-4 py-10 sm:px-8">
      <h1 className="text-h1 font-medium tracking-wordmark">Letters</h1>
      <p className="mt-3 max-w-prose text-muted">
        Nothing is public until you publish it. There is no way around that.
      </p>

      {pending.length === 0 ? (
        <p className="mt-10 text-lead">Nothing waiting.</p>
      ) : (
        <ModerationSelect
          ids={pending.map((article) => article.id)}
          action={moderateArticle}
          approveValue="published"
          approveLabel="Publish selected"
        >
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left">
              <caption className="sr-only">Pending letters</caption>
              <thead>
                <tr className="border-b border-ink/12 text-caption text-muted">
                  <th scope="col" className="py-3 pr-3 font-medium">
                    <span className="sr-only">Select</span>
                  </th>
                  <th scope="col" className="py-3 pr-4 font-medium">
                    Title
                  </th>
                  <th scope="col" className="py-3 pr-4 font-medium">
                    Author
                  </th>
                  <th scope="col" className="py-3 pr-4 font-medium">
                    Batch
                  </th>
                  <th scope="col" className="py-3 pr-4 font-medium">
                    Excerpt
                  </th>
                  <th scope="col" className="py-3 font-medium">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {pending.map((article) => (
                  <tr key={article.id} className="border-b border-ink/8 align-top">
                    <td className="py-4 pr-3">
                      <SelectBox id={article.id} label={`Select ${article.title}`} />
                    </td>
                    <td className="py-4 pr-4 font-medium">
                      <p>{article.title}</p>
                      <p className="mt-1 text-caption">
                        <Link
                          href={`/articles/${article.slug}`}
                          className="underline underline-offset-4"
                        >
                          Open
                        </Link>
                      </p>
                    </td>
                    <td className="py-4 pr-4 text-muted">{article.authorName}</td>
                    <td className="py-4 pr-4 text-muted">
                      {article.batchYear ? formatBatchLabel(article.batchYear) : "Unknown"}
                    </td>
                    <td className="max-w-xs py-4 pr-4 text-caption text-ink/80">
                      {article.body.slice(0, 140)}
                      {article.body.length > 140 ? "…" : ""}
                    </td>
                    <td className="py-4">
                      <div className="flex flex-wrap items-end gap-2">
                        <form action={moderateArticle}>
                          <input type="hidden" name="id" value={article.id} />
                          <input type="hidden" name="slug" value={article.slug} />
                          <input type="hidden" name="decision" value="published" />
                          <button type="submit" className="btn btn-green">
                            Publish
                          </button>
                        </form>
                        <form action={moderateArticle} className="flex flex-wrap items-end gap-2">
                          <input type="hidden" name="id" value={article.id} />
                          <input type="hidden" name="slug" value={article.slug} />
                          <input type="hidden" name="decision" value="rejected" />
                          <label className="block w-36">
                            <span className="sr-only">Rejection reason</span>
                            <input
                              name="rejection_reason"
                              placeholder="Reason"
                              className="field-ink"
                            />
                          </label>
                          <button
                            type="submit"
                            className="inline-flex min-h-11 items-center px-4 font-medium text-muted"
                          >
                            Reject
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ModerationSelect>
      )}
    </main>
  );
}
