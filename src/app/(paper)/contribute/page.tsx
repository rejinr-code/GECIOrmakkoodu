import { redirect } from "next/navigation";
import { PhotoUploadForm } from "@/components/PhotoUploadForm";
import { PaperPage } from "@/components/MarkdownBody";
import {
  defaultGalleryYear,
  parseAdmissionYear,
  parseBranch,
} from "@/config/site";
import { getSettings, listEventTags } from "@/lib/data";
import { getSession, isVerified } from "@/lib/session";

type Props = {
  searchParams: Promise<{ year?: string; branch?: string }>;
};

export const metadata = { title: "Add a photograph" };

export default async function ContributePage({ searchParams }: Props) {
  const session = await getSession();
  if (!session.userId) redirect("/sign-in");
  if (!isVerified(session.profile)) redirect("/");

  const settings = await getSettings();
  if (settings?.feature_photos === false) {
    redirect("/");
  }

  const params = await searchParams;
  const year =
    parseAdmissionYear(params.year) ??
    session.profile?.batch_year ??
    defaultGalleryYear();
  const branch = parseBranch(params.branch, year);
  const eventTags = await listEventTags();

  return (
    <PaperPage>
      <h1 className="text-h1 font-medium tracking-wordmark">Add a photograph</h1>
      <p className="mt-4 max-w-prose text-muted">
        A volunteer looks at every print before it enters the album. Compressing
        happens here on your computer — the original camera file is not stored.
      </p>
      <PhotoUploadForm
        defaultYear={year}
        defaultBranch={branch}
        eventTags={eventTags}
      />
    </PaperPage>
  );
}
