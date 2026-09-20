import Link from "next/link";
import { siteConfig } from "@/config/site";

export function BrandLockup() {
  return (
    <Link href="/" className="flex min-h-11 items-center gap-3">
      {/* College crest is a static PNG; next/image is unnecessary at this size. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={siteConfig.logo.src}
        alt={siteConfig.logo.alt}
        width={48}
        height={48}
        className="size-12 shrink-0 object-contain"
      />
      <span className="min-w-0">
        <span className="block font-semibold tracking-wordmark text-[1.35rem] leading-none text-ink">
          {siteConfig.name}
        </span>
        <span className="mt-1 block text-caption leading-snug text-muted">
          <span lang="ml" className="font-malayalam">
            {siteConfig.nameMl}
          </span>
          {", "}
          {siteConfig.tagline}
        </span>
      </span>
    </Link>
  );
}
