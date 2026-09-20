import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  bucketFor,
  objectKey,
  type ImageAccess,
  type ImageStore,
  type ImageVariant,
  type StoredImage,
  type UploadInput,
} from "@/lib/imageStore";

/**
 * Supabase Storage implementation of ImageStore.
 *
 * To swap hosts: copy this file, change the client, keep the ImageStore shape,
 * and point `imageStore.server.ts` at the new module.
 */
export const supabaseImageStore: ImageStore = {
  async upload(input: UploadInput): Promise<StoredImage> {
    const key = objectKey(input.ownerId, input.photoId, input.variant);
    const bucket = bucketFor(input.variant);
    const body =
      input.bytes instanceof Blob
        ? input.bytes
        : input.bytes instanceof ArrayBuffer
          ? new Blob([input.bytes], { type: input.contentType })
          : new Blob([new Uint8Array(input.bytes)], { type: input.contentType });

    const supabase = createAdminClient();
    const { error } = await supabase.storage.from(bucket).upload(key, body, {
      contentType: input.contentType,
      upsert: true,
    });

    if (error) {
      throw new Error(`imageStore.upload failed: ${error.message}`);
    }

    return { key, bucket, bytes: body.size };
  },

  async getUrl(
    key: string,
    variant: ImageVariant,
    expiresInSeconds = 3600,
    access?: ImageAccess,
  ): Promise<string> {
    const supabase = createAdminClient();
    const column = variant === "thumb" ? "thumb_key" : "storage_key";

    const { data: photo, error: lookupError } = await supabase
      .from("photos")
      .select("status, deleted_at, uploader_id")
      .eq(column, key)
      .maybeSingle();

    if (lookupError) {
      throw new Error(`imageStore.getUrl lookup failed: ${lookupError.message}`);
    }

    if (!photo || photo.deleted_at) {
      throw new Error("imageStore.getUrl: object is not a known photograph");
    }

    const isPublic = photo.status === "approved";
    const isOwner = Boolean(access?.viewerId && access.viewerId === photo.uploader_id);
    const isStaff = Boolean(access?.viewerIsModerator);

    if (!isPublic && !isOwner && !isStaff) {
      throw new Error("imageStore.getUrl: photograph is not public");
    }

    const { data, error } = await supabase.storage
      .from(bucketFor(variant))
      .createSignedUrl(key, expiresInSeconds);

    if (error || !data?.signedUrl) {
      throw new Error(`imageStore.getUrl failed: ${error?.message ?? "no url"}`);
    }

    return data.signedUrl;
  },

  async delete(key: string, variant: ImageVariant): Promise<void> {
    const supabase = createAdminClient();
    const { error } = await supabase.storage.from(bucketFor(variant)).remove([key]);
    if (error) {
      throw new Error(`imageStore.delete failed: ${error.message}`);
    }
  },
};
