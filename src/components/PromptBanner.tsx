import Link from "next/link";

export function PromptBanner({
  theme,
  body,
}: {
  theme: string;
  body: string | null;
}) {
  return (
    <div className="border-b border-gold/40 bg-gold/10 px-4 py-3 sm:px-6 lg:px-8">
      <p className="text-caption text-ink">
        This month: <span className="font-medium">{theme}</span>
        {body ? ` — ${body}` : ""}
      </p>
      <p className="mt-1 flex flex-wrap gap-x-4 text-caption">
        <Link href="/contribute" className="underline underline-offset-4">
          Add a photograph
        </Link>
        <Link href="/write" className="underline underline-offset-4">
          Write a letter
        </Link>
      </p>
    </div>
  );
}
