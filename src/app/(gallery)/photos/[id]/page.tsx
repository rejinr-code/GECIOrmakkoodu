import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import { formatBatchLabel } from "@/config/site";
import { contactEmail, getPhoto, getSettings } from "@/lib/data";
import { imageStore } from "@/lib/imageStore.server";
import { removalMailto } from "@/lib/mailto";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
  if (!photo || photo.status !== "approved" || photo.deleted_at) {
    notFound();
  }

  const settings = await getSettings();
  const email = contactEmail(settings);
  const siteUrl = publicEnv.siteUrl || "";
  const itemUrl = `${siteUrl}/photos/${photo.id}`;

  let imageUrl: string | null = null;
  try {
    imageUrl = await imageStore.getUrl(photo.storage_key, "full");
  } catch {
    imageUrl = null;
  }

  let contributor = "Former member";
  if (!photo.anonymised && photo.uploader_id && isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from("public_profiles")
      .select("name")
      .eq("id", photo.uploader_id)
      .maybeSingle();
    if (data?.name) contributor = data.name;
  }

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
          {photo.caption ? <p className="text-lead">{photo.caption}</p> : null}
          <p className="mt-3 font-semibold tracking-year text-gold">
            {formatBatchLabel(photo.batch_year)}
            {photo.branch ? ` ${photo.branch}` : ""}
          </p>
          <p className="text-caption text-muted">{contributor}</p>
          <p className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-caption">
            <a
              href={itemUrl}
              className="inline-flex min-h-11 items-center"
            >
              Shareable link
            </a>
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
        </div>
      </div>
    </main>
  );
}
