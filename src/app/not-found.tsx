import Link from "next/link";
import { siteConfig } from "@/config/site";

export default function NotFound() {
  return (
    <main className="px-6 py-20">
      <p lang="ml" className="font-malayalam text-muted">
        {siteConfig.nameMl}
      </p>
      <h1 className="mt-2 text-h1 font-medium tracking-wordmark">{siteConfig.name}</h1>
      <p className="mt-4 text-muted">This page is not in the archive.</p>
      <Link href="/" className="btn btn-green mt-8">
        Back to photographs
      </Link>
    </main>
  );
}
