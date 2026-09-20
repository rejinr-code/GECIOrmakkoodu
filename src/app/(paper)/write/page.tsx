import { redirect } from "next/navigation";
import { LetterForm } from "@/components/LetterForm";
import { PaperPage } from "@/components/MarkdownBody";
import { getSettings } from "@/lib/data";
import { getSession, isVerified } from "@/lib/session";

export const metadata = { title: "Write a letter" };

export default async function WritePage() {
  const session = await getSession();
  if (!session.userId) redirect("/sign-in");
  if (!isVerified(session.profile)) redirect("/articles");

  const settings = await getSettings();
  if (settings?.feature_articles === false) redirect("/articles");

  return (
    <PaperPage>
      <h1 className="text-h1 font-medium tracking-wordmark">Write a letter</h1>
      <p className="mt-4 max-w-prose text-muted">
        A volunteer reads every letter before it is published. Save a draft, or
        send it when you are ready.
      </p>
      <LetterForm defaultBatchYear={session.profile?.batch_year ?? null} />
    </PaperPage>
  );
}
