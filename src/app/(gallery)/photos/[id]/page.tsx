import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContributorLink } from "@/components/ContributorLink";
import { DownloadPrint } from "@/components/DownloadPrint";
import { FlagItemForm } from "@/components/FlagItemForm";
import { PhotoEngagement } from "@/components/PhotoEngagement";
import { PhotoLightbox } from "@/components/PhotoLightbox";
import {
  formatBatchLabel,
  isTimelineView,
  parseAdmissionYear,
  parseBranch,
  parseEventSlug,
  photoHref,
  siteConfig,
} from "@/config/site";
import {
  contactEmail,
  getPhoto,
  getPhotoNeighbors,
  getPublicProfile,
  getReactionState,
  getSettings,
  hasOpenItemFlag,
  listComments,
  listEventTags,
  listMyOpenCommentFlags,
} from "@/lib/data";
import { imageStore } from "@/lib/imageStore.server";
import { removalMailto } from "@/lib/mailto";
import { publicEnv } from "@/lib/env";
import { getSession, isStaff } from "@/lib/session";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ year?: string; branch?: string; event?: string; view?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const photo = await getPhoto(id);
  if (!photo || photo.status !== "approved" || photo.deleted_at) {
    return { title: "Photograph" };
  }

  let image: string | undefined;
  try {
    image = await imageStore.getUrl(photo.thumb_key, "thumb", 3600);
  } catch {
    image = undefined;
  }

  return {
    title: photo.caption?.slice(0, 60) || "Photograph",
    description: photo.caption || photo.alt_text,
    openGraph: {
      title: photo.caption || siteConfig.name,
      description: photo.alt_text,
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function PhotoPage({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;
  const photo = await getPhoto(id);
  const session = await getSession();
  if (!photo || photo.deleted_at) {
    notFound();
  }

  const staff = isStaff(session.profile);
  const isOwner = Boolean(session.userId && photo.uploader_id === session.userId);
  const isPublic = photo.status === "approved";
  if (!isPublic && !isOwner && !staff) {
    notFound();
  }

  const settings = await getSettings();
  const email = contactEmail(settings);
  const siteUrl = publicEnv.siteUrl || "";
  const itemUrl = `${siteUrl}/photos/${photo.id}`;
  const commentsEnabled = isPublic && settings?.feature_comments !== false;
  const comments = commentsEnabled ? await listComments("photo", photo.id) : [];
  const reaction = commentsEnabled
    ? await getReactionState("photo", photo.id, session.userId)
    : { count: 0, liked: false };
  const flaggedIds =
    commentsEnabled && session.userId
      ? await listMyOpenCommentFlags(
          session.userId,
          comments.map((comment) => comment.id),
        )
      : new Set<string>();
  const alreadyFlagged =
    Boolean(session.userId) && isPublic
      ? await hasOpenItemFlag(session.userId as string, "photo", photo.id)
      : false;

  const tags = await listEventTags();
  const timeline = isTimelineView(query.view);
  const event = parseEventSlug(query.event, tags);
  const year = timeline ? null : (parseAdmissionYear(query.year) ?? photo.batch_year);
  const branch = year ? parseBranch(query.branch, year) : null;
  const hrefOptions = {
    year,
    branch,
    event,
    view: timeline ? ("timeline" as const) : undefined,
  };
  const neighbors = isPublic
    ? await getPhotoNeighbors(photo, { timeline, branch, eventTag: event })
    : { previousId: null, nextId: null };
  const eventLabel = tags.find((tag) => tag.slug === photo.event_tag)?.label ?? photo.event_tag;

  let imageUrl: string | null = null;
  try {
    imageUrl = await imageStore.getUrl(photo.storage_key, "full", 3600, {
      viewerId: session.userId ?? undefined,
      viewerIsModerator: staff,
    });
  } catch {
    imageUrl = null;
  }

  const contributorProfile =
    !photo.anonymised && photo.uploader_id
      ? await getPublicProfile(photo.uploader_id)
      : null;
  const contributorName = photo.anonymised
    ? "Former member"
    : (contributorProfile?.name ?? (photo.uploader_id ? "GECIAN" : "Former member"));
  const contributorId = contributorProfile?.id ?? null;

  return (
    <main className="px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-5xl">
        {imageUrl ? (
          <PhotoLightbox
            src={imageUrl}
            alt={photo.alt_text}
            width={photo.width}
            height={photo.height}
            previousHref={
              neighbors.previousId ? photoHref(neighbors.previousId, hrefOptions) : null
            }
            nextHref={neighbors.nextId ? photoHref(neighbors.nextId, hrefOptions) : null}
          />
        ) : (
          <div className="print-mat flex min-h-64 items-end rounded-2xl p-6 text-muted">
            {photo.alt_text}
          </div>
        )}
        {neighbors.previousId || neighbors.nextId ? (
          <nav className="mt-4 flex min-h-11 items-center gap-6 text-caption">
            {neighbors.previousId ? (
              <Link href={photoHref(neighbors.previousId, hrefOptions)}>Previous</Link>
            ) : null}
            {neighbors.nextId ? (
              <Link href={photoHref(neighbors.nextId, hrefOptions)}>Next</Link>
            ) : null}
          </nav>
        ) : null}
        <div className="mt-6 max-w-prose">
          {!isPublic ? (
            <p className="mb-4 text-caption text-gold">
              {photo.status === "pending"
                ? "Waiting for a volunteer to approve this print."
                : photo.status === "rejected"
                  ? `Not added to the album${photo.rejection_reason ? `: ${photo.rejection_reason}` : "."}`
                  : "This print is not in the public album."}
            </p>
          ) : null}
          {photo.caption ? <p className="text-lead">{photo.caption}</p> : null}
          <p className="mt-3 font-semibold tracking-year text-gold">
            {formatBatchLabel(photo.batch_year)}
            {photo.branch ? ` ${photo.branch}` : ""}
            {eventLabel ? ` · ${eventLabel}` : ""}
          </p>
          <p className="text-caption text-muted">
            <ContributorLink id={contributorId} name={contributorName} />
          </p>
          {photo.people_tagged.length > 0 ? (
            <p className="mt-2 text-caption text-muted">
              Named: {photo.people_tagged.join(", ")}
            </p>
          ) : null}
          <p className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-caption">
            {isPublic ? (
              <a href={itemUrl} className="inline-flex min-h-11 items-center">
                Shareable link
              </a>
            ) : null}
            {isOwner && imageUrl ? (
              <DownloadPrint url={imageUrl} filename={`${photo.id}.webp`} />
            ) : null}
            {email ? (
              <a
                href={removalMailto({
                  contactEmail: email,
                  itemType: "photo",
                  itemId: photo.id,
                  itemUrl,
                })}
                className="inline-flex min-h-11 items-center"
              >
                Request removal
              </a>
            ) : null}
            {isPublic && session.userId && !isOwner && !alreadyFlagged ? (
              <FlagItemForm
                parentType="photo"
                parentId={photo.id}
                next={photoHref(photo.id, hrefOptions)}
              />
            ) : null}
            {alreadyFlagged ? (
              <span className="inline-flex min-h-11 items-center text-muted">Flagged for review</span>
            ) : null}
            {isPublic && !session.userId ? (
              <Link href="/sign-in" className="inline-flex min-h-11 items-center">
                Sign in to flag
              </Link>
            ) : null}
          </p>
          {commentsEnabled ? (
            <PhotoEngagement
              parentType="photo"
              parentId={photo.id}
              next={`/photos/${photo.id}`}
              comments={comments}
              reaction={reaction}
              flaggedIds={flaggedIds}
              session={session}
            />
          ) : null}
        </div>
      </div>
    </main>
  );
}
