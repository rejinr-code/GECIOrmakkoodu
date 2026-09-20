import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PaperPage } from "@/components/MarkdownBody";
import { PhotoWall } from "@/components/PhotoWall";
import { branchLabel, formatBatchLabel, siteConfig } from "@/config/site";
import {
  getPublicProfile,
  listApprovedPhotos,
  listPublishedArticles,
} from "@/lib/data";
import { getSession } from "@/lib/session";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const profile = await getPublicProfile(id);
  if (!profile) {
    return { title: "Alumni" };
  }
  return {
    title: profile.name,
    description: profile.bio?.slice(0, 160) || `${profile.name} at ${siteConfig.name}`,
  };
}

export default async function PersonPage({ params }: Props) {
  const { id } = await params;
  const profile = await getPublicProfile(id);
  if (!profile) {
    notFound();
  }

  const session = await getSession();
  const isOwn = session.userId === profile.id;
  const [{ photos }, letters] = await Promise.all([
    listApprovedPhotos({ uploaderId: profile.id, page: 1 }),
    listPublishedArticles(12, { authorId: profile.id }),
  ]);

  const place = [profile.current_city, profile.current_role].filter(Boolean).join(" · ");

  return (
    <PaperPage wide>
      <h1 className="text-h1 font-medium tracking-wordmark">{profile.name}</h1>
      <p className="mt-3 text-caption text-muted">
        {profile.batch_year ? formatBatchLabel(profile.batch_year) : null}
        {profile.batch_year && profile.branch ? " · " : null}
        {profile.branch ? branchLabel(profile.branch) : null}
      </p>
      {place ? <p className="mt-2 text-caption text-muted">{place}</p> : null}
      {profile.bio ? <p className="mt-6 whitespace-pre-wrap">{profile.bio}</p> : null}
      {profile.directory_opt_in ? (
        <p className="mt-4 text-caption text-muted">Listed in the alumni directory.</p>
      ) : null}
      {isOwn ? (
        <p className="mt-6">
          <Link href="/account" className="text-caption underline underline-offset-4">
            Edit these details
          </Link>
        </p>
      ) : null}

      {photos.length > 0 ? (
        <section className="mt-14">
          <h2 className="text-h3 font-medium tracking-wordmark">Photographs</h2>
          <div className="mt-6">
            <PhotoWall photos={photos} />
          </div>
        </section>
      ) : null}

      {letters.length > 0 ? (
        <section className="mt-14">
          <h2 className="text-h3 font-medium tracking-wordmark">Letters</h2>
          <ul className="mt-4 space-y-3">
            {letters.map((article) => (
              <li key={article.id}>
                <Link href={`/articles/${article.slug}`} className="text-lead">
                  {article.title}
                </Link>
                {article.batchYear ? (
                  <p className="text-caption text-muted">{formatBatchLabel(article.batchYear)}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </PaperPage>
  );
}
