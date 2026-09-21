import { redirect } from "next/navigation";
import Link from "next/link";
import { PhotoUploadForm } from "@/components/PhotoUploadForm";
import {
  defaultGalleryYear,
  parseAdmissionYear,
  parseBranch,
} from "@/config/site";
import { listEventTags } from "@/lib/data";
import { getSession, isAdmin } from "@/lib/session";

type Props = {
  searchParams: Promise<{ year?: string; branch?: string }>;
};

export const metadata = { title: "Add a photograph" };

export default async function AdminAddPhotoPage({ searchParams }: Props) {
  const session = await getSession();
  if (!isAdmin(session.profile)) {
    redirect("/admin/photos");
  }

  const params = await searchParams;
  const year =
    parseAdmissionYear(params.year) ??
    session.profile?.batch_year ??
    defaultGalleryYear();
  const branch = parseBranch(params.branch, year);
  const eventTags = await listEventTags();

  return (
    <main className="px-4 py-10 sm:px-8">
      <h1 className="text-h1 font-medium tracking-wordmark">Add a photograph</h1>
      <p className="mt-3 max-w-prose text-muted">
        This print goes into the album at once. Tags you choose or create are
        published with it.
      </p>
      <p className="mt-4 text-caption">
        <Link href="/admin/photos" className="underline underline-offset-4">
          Back to photographs
        </Link>
      </p>
      <PhotoUploadForm
        defaultYear={year}
        defaultBranch={branch}
        eventTags={eventTags}
        publish
      />
    </main>
  );
}
