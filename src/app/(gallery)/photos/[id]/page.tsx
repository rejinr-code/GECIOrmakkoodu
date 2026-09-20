import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PhotoEngagement } from "@/components/PhotoEngagement";
import { siteConfig } from "@/config/site";
import { formatBatchLabel } from "@/config/site";
import { ContributorLink } from "@/components/ContributorLink";
import {
  contactEmail,
  getPhoto,
  getPhotoReactionState,
  getPublicProfile,
  getSettings,
  listMyOpenCommentFlags,
  listPhotoComments,
} from "@/lib/data";
import { imageStore } from "@/lib/imageStore.server";
import { removalMailto } from "@/lib/mailto";
import { publicEnv } from "@/lib/env";
import { getSession, isStaff } from "@/lib/session";

type Props = { params: Promise<{ id: string }> };

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

export default async function PhotoPage({ params }: Props) {
  const { id } = await params;
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
  const comments = commentsEnabled ? await listPhotoComments(photo.id) : [];
  const reaction = commentsEnabled
    ? await getPhotoReactionState(photo.id, session.userId)
    : { count: 0, liked: false };
  const flaggedIds =
    commentsEnabled && session.userId
      ? await listMyOpenCommentFlags(
          session.userId,
          comments.map((comment) => comment.id),
        )
      : new Set<string>();

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
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={photo.alt_text}
            width={photo.width}
            height={photo.height}
            className="print-mat max-h-[80dvh] w-full object-contain"
          />
        ) : (
          <div className="print-mat flex min-h-64 items-end p-6 text-muted">
            {photo.alt_text}
          </div>
        )}
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
          </p>
          <p className="text-caption text-muted">
            <ContributorLink id={contributorId} name={contributorName} />
          </p>
          <p className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-caption">
            {isPublic ? (
              <a href={itemUrl} className="inline-flex min-h-11 items-center">
                Shareable link
              </a>
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
          </p>
          {commentsEnabled ? (
            <PhotoEngagement
              photoId={photo.id}
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
