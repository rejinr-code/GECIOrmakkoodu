import { redirect } from "next/navigation";
import { saveLegalDocument } from "@/lib/actions/admin";
import { listLegalDocuments, getLegalDocument } from "@/lib/data";
import { getSession, isAdmin } from "@/lib/session";

export const metadata = { title: "Legal" };

export default async function AdminLegalPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  const session = await getSession();
  if (!isAdmin(session.profile)) redirect("/admin");

  const docs = await listLegalDocuments();
  const { slug } = await searchParams;
  const activeSlug = slug ?? docs[0]?.slug ?? "privacy";
  const doc = await getLegalDocument(activeSlug);

  return (
    <main className="px-4 py-10 sm:px-8">
      <h1 className="text-h1 font-medium tracking-wordmark">Legal</h1>
      <div className="mt-6 flex flex-wrap gap-4 text-caption">
        {docs.map((item) => (
          <a
            key={item.slug}
            href={`/admin/legal?slug=${item.slug}`}
            className={`inline-flex min-h-11 items-center ${
              item.slug === activeSlug ? "text-gold" : "text-muted"
            }`}
          >
            {item.title}
          </a>
        ))}
      </div>
      {doc ? (
        <form action={saveLegalDocument} className="mt-8 grid max-w-3xl gap-4">
          <input type="hidden" name="slug" value={doc.slug} />
          <label className="block">
            <span className="text-caption text-muted">Title</span>
            <input
              name="title"
              defaultValue={doc.title}
              className="field-ink mt-1"
            />
          </label>
          <label className="block">
            <span className="text-caption text-muted">Version</span>
            <input
              name="version"
              defaultValue={doc.version}
              className="field-ink mt-1"
            />
          </label>
          <label className="block">
            <span className="text-caption text-muted">Markdown</span>
            <textarea
              name="body_markdown"
              defaultValue={doc.body_markdown}
              rows={22}
              className="field-ink mt-1 h-auto py-3 text-caption leading-relaxed"
            />
          </label>
          <button type="submit" className="btn btn-green">
            Save page
          </button>
        </form>
      ) : (
        <p className="mt-8 text-muted">No legal documents in the database yet.</p>
      )}
    </main>
  );
}
