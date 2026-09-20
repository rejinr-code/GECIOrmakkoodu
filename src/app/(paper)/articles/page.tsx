import Link from "next/link";
import { formatBatchLabel } from "@/config/site";
import { PaperPage } from "@/components/MarkdownBody";
import { listPublishedArticles } from "@/lib/data";

export const metadata = { title: "Letters" };

export default async function ArticlesPage() {
  const articles = await listPublishedArticles(50);

  return (
    <PaperPage>
      <h1 className="text-h1 font-medium tracking-wordmark">Letters</h1>
      <p className="mt-4 max-w-md">
        Writing from campus years, on paper instead of the photograph wall.
      </p>
      {articles.length === 0 ? (
        <p className="mt-10">
          No letters have been published yet. Verified members will be able to
          write in a later phase.
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
