/**
 * Browser-side photograph compression. Output is always WebP so Storage
 * never receives a camera original.
 */

import {
  FULL_MAX_EDGE,
  SOURCE_MAX_BYTES,
  THUMB_MAX_EDGE,
  WEBP_QUALITY,
} from "@/lib/imageStore";

export type CompressedPhotograph = {
  full: Blob;
  thumb: Blob;
  width: number;
  height: number;
};

function scale(width: number, height: number, maxEdge: number) {
  const longest = Math.max(width, height);
  const factor = longest > maxEdge ? maxEdge / longest : 1;
  return {
    width: Math.max(1, Math.round(width * factor)),
    height: Math.max(1, Math.round(height * factor)),
  };
}

async function toWebp(bitmap: ImageBitmap, maxEdge: number): Promise<{
  blob: Blob;
  width: number;
  height: number;
}> {
  const size = scale(bitmap.width, bitmap.height, maxEdge);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not prepare the photograph.");
  }
  context.drawImage(bitmap, 0, 0, size.width, size.height);
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", WEBP_QUALITY);
  });
  if (!blob) {
    throw new Error("This browser could not make a WebP file.");
  }
  return { blob, width: size.width, height: size.height };
}

export async function compressPhotograph(file: File): Promise<CompressedPhotograph> {
  if (file.size > SOURCE_MAX_BYTES) {
    throw new Error("That file is too large. Please use a picture under 20 MB.");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose a photograph.");
  }

  const bitmap = await createImageBitmap(file);
  try {
    const full = await toWebp(bitmap, FULL_MAX_EDGE);
    const thumb = await toWebp(bitmap, THUMB_MAX_EDGE);
    return {
      full: full.blob,
      thumb: thumb.blob,
      width: full.width,
      height: full.height,
    };
  } finally {
    bitmap.close();
  }
}
