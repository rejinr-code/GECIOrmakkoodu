/**
 * Image storage seam — isomorphic types and key helpers.
 *
 * Server code imports `{ imageStore }` from `@/lib/imageStore.server`.
 * Client code (compression, key preview) may import helpers from this file.
 * Never import the server module from a Client Component.
 *
 * Swap hosts by replacing `imageStore.supabase.ts` and the re-export in
 * `imageStore.server.ts`. Components must not talk to Storage directly.
 */

export type ImageVariant = "full" | "thumb";

export type ImageAccess = {
  viewerId?: string;
  viewerIsModerator?: boolean;
};

export type UploadInput = {
  bytes: Blob | ArrayBuffer | Buffer;
  contentType: "image/webp";
  ownerId: string;
  photoId: string;
  variant: ImageVariant;
};

export type StoredImage = {
  key: string;
  bucket: string;
  bytes: number;
};

export interface ImageStore {
  upload(input: UploadInput): Promise<StoredImage>;
  getUrl(
    key: string,
    variant: ImageVariant,
    expiresInSeconds?: number,
    access?: ImageAccess,
  ): Promise<string>;
  delete(key: string, variant: ImageVariant): Promise<void>;
}

export const PHOTO_BUCKET = "photos";
export const THUMB_BUCKET = "thumbs";

export function objectKey(
  ownerId: string,
  photoId: string,
  variant: ImageVariant,
): string {
  const file = variant === "thumb" ? "thumb.webp" : "original.webp";
  return `${ownerId}/${photoId}/${file}`;
}

export function bucketFor(variant: ImageVariant): string {
  return variant === "thumb" ? THUMB_BUCKET : PHOTO_BUCKET;
}
