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
          <ul className="mt-10 space-y-10">
            {pending.map((article) => (
              <li key={article.id} className="border-t border-ink/8 pt-6">
                <SelectBox id={article.id} label="Select" />
                <p className="mt-2 text-lead font-medium">{article.title}</p>
              <p className="mt-2 text-caption text-muted">
                {article.authorName}
                {article.batchYear ? ` · ${formatBatchLabel(article.batchYear)}` : ""}
              </p>
              <p className="mt-3 max-w-prose whitespace-pre-wrap text-caption text-ink/80">
                {article.body.slice(0, 420)}
                {article.body.length > 420 ? "…" : ""}
              </p>
              <p className="mt-3 text-caption">
                <Link
                  href={`/articles/${article.slug}`}
                  className="underline underline-offset-4"
                >
                  Open letter
                </Link>
              </p>
              <div className="mt-4 flex flex-wrap items-end gap-3">
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
                  <label className="block">
                    <span className="sr-only">Rejection reason</span>
                    <input name="rejection_reason" placeholder="Reason" className="field-ink" />
                  </label>
                  <button
                    type="submit"
                    className="inline-flex min-h-11 items-center px-4 font-medium text-muted"
                  >
                    Reject
                  </button>
                </form>
              </div>
            </li>
          ))}
          </ul>
        </ModerationSelect>
      )}
    </main>
  );
}
