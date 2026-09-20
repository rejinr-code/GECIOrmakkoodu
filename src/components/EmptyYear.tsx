import Link from "next/link";
import { formatBatchLabel } from "@/config/site";
import { isVerified, type SessionState } from "@/lib/session";

export function EmptyYear({
  year,
  branch,
  session,
}: {
  year: number;
  branch?: string | null;
  session: SessionState;
}) {
  const label = formatBatchLabel(year);
  const verified = isVerified(session.profile);

  return (
    <div className="max-w-xl pt-2">
      <div className="album-spread mb-8 grid grid-cols-2 gap-3" aria-hidden>
        <div className="print-mat h-48 sm:h-56" />
        <div className="print-mat h-48 sm:h-56" />
      </div>
      <p className="text-lead text-ink">
        {branch
          ? `The ${label} ${branch} pages are empty.`
          : `The ${label} album is empty.`}{" "}
        Be the first to put a campus photograph here.
      </p>
      <p className="mt-3 max-w-md text-muted">
        Anyone can look. Adding a picture needs a verified GECIAN account — a
        volunteer checks new members against the alumni list.
      </p>
      {verified ? (
        <p className="mt-6 text-caption text-muted">
          Photograph upload opens in the next phase of this archive.
        </p>
      ) : session.userId ? (
        <p className="mt-6 text-caption text-muted">
          Once you are verified, this page is where your batch’s pictures will
          live.
        </p>
      ) : (
        <Link href="/join" className="btn btn-green mt-7">
          Join and add the first photograph
        </Link>
      )}
    </div>
  );
}
