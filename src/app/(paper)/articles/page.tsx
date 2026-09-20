import Link from "next/link";
import { formatBatchLabel } from "@/config/site";
import { PaperPage } from "@/components/MarkdownBody";
import { getSettings, listPublishedArticles } from "@/lib/data";
import { getSession, isVerified } from "@/lib/session";

export const metadata = { title: "Letters" };

export default async function ArticlesPage() {
  const articles = await listPublishedArticles(50);
  const session = await getSession();
  const settings = await getSettings();
  const canWrite = isVerified(session.profile) && settings?.feature_articles !== false;

  return (
    <PaperPage>
      <h1 className="text-h1 font-medium tracking-wordmark">Letters</h1>
      <p className="mt-4 max-w-md">
        Writing from campus years, on paper instead of the photograph wall.
      </p>
      {canWrite ? (
        <p className="mt-6">
          <Link href="/write" className="btn btn-green">
            Write a letter
          </Link>
        </p>
      ) : null}
      {articles.length === 0 ? (
        <p className="mt-10">
          {canWrite
            ? "No letters have been published yet. Yours can be the first, after a volunteer reads it."
            : "No letters have been published yet."}
        </p>
      ) : (
        <ul className="mt-10 space-y-6">
          {articles.map((article) => (
            <li key={article.id}>
              <Link href={`/articles/${article.slug}`} className="text-h3 font-medium">
                {article.title}
              </Link>
              {article.batchYear ? (
                <p className="text-caption opacity-70">{formatBatchLabel(article.batchYear)}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </PaperPage>
  );
}
