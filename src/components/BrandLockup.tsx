import Link from "next/link";
import { siteConfig } from "@/config/site";

export function BrandLockup() {
  return (
    <Link href="/" className="flex min-h-11 items-center gap-3">
      {/* Local SVG mark; next/image is unnecessary for a 40px static asset. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={siteConfig.logo.src}
        alt=""
        width={40}
        height={40}
        className="size-10 shrink-0"
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
