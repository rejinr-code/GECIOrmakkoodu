import Link from "next/link";
import { siteConfig } from "@/config/site";
import type { LegalSlug } from "@/config/site";

const legalLabels: Record<LegalSlug, string> = {
  privacy: "Privacy",
  terms: "Terms",
  "content-policy": "Content",
  takedown: "Takedown",
  contact: "Contact",
};

export function SiteFooter({
  contactEmail,
  rail = false,
}: {
  contactEmail: string;
  rail?: boolean;
}) {
  return (
    <footer
      className={`border-t border-ink/8 bg-paper px-4 py-12 text-caption text-muted sm:px-6 lg:px-8 ${
        rail ? "lg:pl-[calc(var(--rail-width)+2rem)]" : ""
      }`}
    >
      <div className="grid max-w-5xl gap-8 sm:grid-cols-2">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={siteConfig.logo.src}
            alt={siteConfig.logo.alt}
            width={48}
            height={48}
            className="mb-4 size-12 object-contain"
          />
          <p className="text-ink/80">
            {siteConfig.name}
            <span lang="ml" className="font-malayalam">
              {" "}
              {siteConfig.nameMl}
            </span>
          </p>
          <p className="mt-2 max-w-sm">
            {siteConfig.tagline}, kept by {siteConfig.association.fullName}.
          </p>
        </div>
        <div className="flex flex-col gap-1 sm:items-end">
          <div className="flex flex-wrap gap-x-5 gap-y-1 sm:justify-end">
            {siteConfig.legal.slugs.map((slug) => (
              <Link
                key={slug}
                href={`/legal/${slug}`}
                className="inline-flex min-h-11 items-center"
              >
                {legalLabels[slug]}
              </Link>
            ))}
          </div>
          {contactEmail ? (
            <a href={`mailto:${contactEmail}`} className="inline-flex min-h-11 items-center text-ink/80">
              {contactEmail}
            </a>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
