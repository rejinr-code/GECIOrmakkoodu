import { notFound } from "next/navigation";
import { MarkdownBody, PaperPage } from "@/components/MarkdownBody";
import { siteConfig, type LegalSlug } from "@/config/site";
import { getLegalDocument } from "@/lib/data";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const doc = await getLegalDocument(slug);
  return { title: doc?.title ?? "Legal" };
}

export default async function LegalPage({ params }: Props) {
  const { slug } = await params;
  if (!siteConfig.legal.slugs.includes(slug as LegalSlug)) {
    notFound();
  }
  const doc = await getLegalDocument(slug);
  if (!doc) {
    return (
      <PaperPage>
        <h1 className="text-h1 font-medium">Not published yet</h1>
        <p className="mt-4">
          This legal page will appear once the database has been migrated.
        </p>
      </PaperPage>
    );
  }

  return (
    <PaperPage>
      <MarkdownBody>{doc.body_markdown}</MarkdownBody>
    </PaperPage>
  );
}
