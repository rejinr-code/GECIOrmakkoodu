import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ContributorLink } from "@/components/ContributorLink";
import { MarkdownBody, PaperPage } from "@/components/MarkdownBody";
import { formatBatchLabel, siteConfig } from "@/config/site";
import { contactEmail, getArticle, getPublicProfile, getSettings } from "@/lib/data";
import { removalMailto } from "@/lib/mailto";
import { publicEnv } from "@/lib/env";
import { getSession, isStaff } from "@/lib/session";

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
  const session = await getSession();
  if (!article || article.deleted_at) {
    notFound();
  }

  const staff = isStaff(session.profile);
  const isOwner = Boolean(session.userId && article.author_id === session.userId);
  const isPublic = article.status === "published";
  if (!isPublic && !isOwner && !staff) {
    notFound();
  }

  const settings = await getSettings();
  const email = contactEmail(settings);
  const itemUrl = `${publicEnv.siteUrl}/articles/${article.slug}`;
  const author =
    !article.anonymised && article.author_id
      ? await getPublicProfile(article.author_id)
      : null;
  const authorName = article.anonymised
    ? "Former member"
    : (author?.name ?? (article.author_id ? "GECIAN" : null));

  return (
    <PaperPage>
      {!isPublic ? (
        <p className="mb-6 text-caption text-gold">
          {article.status === "pending"
            ? "Waiting for a volunteer to publish this letter."
            : article.status === "draft"
              ? "This draft is only visible to you."
              : article.status === "rejected"
                ? `Not published${article.rejection_reason ? `: ${article.rejection_reason}` : "."}`
                : "This letter is not public."}
        </p>
      ) : null}
      <h1 className="text-h1 font-medium tracking-wordmark">{article.title}</h1>
      {authorName || article.batch_year ? (
        <p className="mt-3 text-caption opacity-70">
          {authorName ? (
            <ContributorLink id={author?.id ?? null} name={authorName} />
          ) : null}
          {authorName && article.batch_year ? " · " : null}
          {article.batch_year ? formatBatchLabel(article.batch_year) : null}
        </p>
      ) : null}
      {article.body.trim() ? (
        <MarkdownBody>{article.body}</MarkdownBody>
      ) : (
        <p className="mt-4 text-muted">No text yet.</p>
      )}
      {isOwner && (article.status === "draft" || article.status === "pending") ? (
        <p className="mt-10">
          <Link href={`/write/${article.id}`} className="underline underline-offset-4">
            Edit letter
          </Link>
        </p>
      ) : null}
      {email && isPublic ? (
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
