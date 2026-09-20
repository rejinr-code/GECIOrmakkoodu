import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarkdownBody, PaperPage } from "@/components/MarkdownBody";
import { formatBatchLabel, siteConfig } from "@/config/site";
import { contactEmail, getArticle, getSettings } from "@/lib/data";
import { removalMailto } from "@/lib/mailto";
import { publicEnv } from "@/lib/env";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article || article.status !== "published") {
    return { title: "Letter" };
  }
  return {
    title: article.title,
    description: article.body.slice(0, 160),
    openGraph: {
      title: article.title,
      description: `${siteConfig.name} letter`,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article || article.status !== "published" || article.deleted_at) {
    notFound();
  }

  const settings = await getSettings();
  const email = contactEmail(settings);
  const itemUrl = `${publicEnv.siteUrl}/articles/${article.slug}`;

  return (
    <PaperPage>
      <h1 className="text-h1 font-medium tracking-wordmark">{article.title}</h1>
      {article.batch_year ? (
        <p className="mt-3 text-caption opacity-70">{formatBatchLabel(article.batch_year)}</p>
      ) : null}
      <MarkdownBody>{article.body}</MarkdownBody>
      {email ? (
        <p className="mt-12">
          <a
            href={removalMailto({
              contactEmail: email,
              itemType: "article",
              itemId: article.id,
              itemUrl,
            })}
            className="inline-flex min-h-11 items-center underline underline-offset-4"
          >
            Request removal
          </a>
        </p>
      ) : null}
    </PaperPage>
  );
}
