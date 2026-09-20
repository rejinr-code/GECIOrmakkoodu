import { redirect } from "next/navigation";
import { saveMonthlyPrompt } from "@/lib/actions/admin";
import { listMonthlyPrompts } from "@/lib/data";
import { getSession, isAdmin } from "@/lib/session";
import { PROMPT_BODY_MAX, THEME_MAX } from "@/lib/engagement";

export const metadata = { title: "Monthly prompt" };

function formatWhen(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

export default async function AdminPromptsPage() {
  const session = await getSession();
  if (!isAdmin(session.profile)) redirect("/admin");
  const prompts = await listMonthlyPrompts();

  return (
    <main className="px-4 py-10 sm:px-8">
      <h1 className="text-h1 font-medium tracking-wordmark">Monthly prompt</h1>
      <p className="mt-3 max-w-prose text-muted">
        The current theme appears as a banner. Turn the banner on in Settings.
      </p>

      <form action={saveMonthlyPrompt} className="mt-8 grid max-w-xl gap-4">
        <label className="block">
          <span className="text-caption text-muted">Theme</span>
          <input name="theme" required maxLength={THEME_MAX} className="field-ink mt-1" />
        </label>
        <label className="block">
          <span className="text-caption text-muted">A line of invitation (optional)</span>
          <textarea name="body" maxLength={PROMPT_BODY_MAX} rows={3} className="field-ink mt-1 py-2" />
        </label>
        <label className="block">
          <span className="text-caption text-muted">Starts</span>
          <input name="starts_at" type="datetime-local" required className="field-ink mt-1" />
        </label>
        <label className="block">
          <span className="text-caption text-muted">Ends (optional)</span>
          <input name="ends_at" type="datetime-local" className="field-ink mt-1" />
        </label>
        <button type="submit" className="btn btn-green">
          Save prompt
        </button>
      </form>

      <ul className="mt-12 max-w-xl space-y-4">
        {prompts.map((prompt) => (
          <li key={prompt.id}>
            <p className="font-medium">{prompt.theme}</p>
            <p className="text-caption text-muted">
              {formatWhen(prompt.starts_at)}
              {prompt.ends_at ? ` – ${formatWhen(prompt.ends_at)}` : " onwards"}
            </p>
            {prompt.body ? <p className="text-caption text-muted">{prompt.body}</p> : null}
          </li>
        ))}
      </ul>
    </main>
  );
}
