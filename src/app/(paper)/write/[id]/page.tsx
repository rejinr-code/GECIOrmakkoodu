import { notFound, redirect } from "next/navigation";
import { LetterForm } from "@/components/LetterForm";
import { PaperPage } from "@/components/MarkdownBody";
import { getArticleById } from "@/lib/data";
import { getSession, isVerified } from "@/lib/session";

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: "Edit letter" };

export default async function EditLetterPage({ params }: Props) {
  const session = await getSession();
  if (!session.userId) redirect("/sign-in");
  if (!isVerified(session.profile)) redirect("/articles");

  const { id } = await params;
  const article = await getArticleById(id);
  if (!article || article.author_id !== session.userId) {
    notFound();
  }
  if (article.status === "published") {
    redirect(`/articles/${article.slug}`);
  }
  if (article.status === "removed") {
    redirect("/account");
  }

  return (
    <PaperPage>
      <h1 className="text-h1 font-medium tracking-wordmark">Edit letter</h1>
      <p className="mt-4 max-w-prose text-muted">
        {article.status === "pending"
          ? "This letter is waiting for a volunteer. You can still change it."
          : article.status === "rejected"
            ? `A volunteer did not publish this${article.rejection_reason ? `: ${article.rejection_reason}` : "."} You can revise it and send it again.`
            : "This draft is only visible to you."}
      </p>
      <LetterForm
        articleId={article.id}
        defaultTitle={article.title}
        defaultBody={article.body}
        defaultBatchYear={article.batch_year}
      />
    </PaperPage>
  );
}
