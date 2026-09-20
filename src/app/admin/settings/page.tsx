import { redirect } from "next/navigation";
import { saveSettings } from "@/lib/actions/admin";
import { getSettings } from "@/lib/data";
import { getSession, isAdmin } from "@/lib/session";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await getSession();
  if (!isAdmin(session.profile)) redirect("/admin");
  const settings = await getSettings();

  return (
    <main className="px-4 py-10 sm:px-8">
      <h1 className="text-h1 font-medium tracking-wordmark">Settings</h1>
      <p className="mt-3 max-w-prose text-muted">
        Contact email is where removal requests arrive. There is no grievance
        officer; alumni volunteers read this mailbox.
      </p>
      <form action={saveSettings} className="mt-8 grid max-w-xl gap-4">
        <label className="block">
          <span className="text-caption text-muted">Contact email</span>
          <input
            name="contact_email"
            type="email"
            required
            defaultValue={settings?.contact_email ?? ""}
            className="field-ink mt-1"
          />
        </label>
        <label className="block">
          <span className="text-caption text-muted">Consent version</span>
          <input
            name="consent_version"
            required
            defaultValue={settings?.consent_version ?? "1.0"}
            className="field-ink mt-1"
          />
        </label>
        <label className="block">
          <span className="text-caption text-muted">Uploads per person per day</span>
          <input
            name="upload_limit_per_day"
            type="number"
            min={1}
            defaultValue={settings?.upload_limit_per_day ?? 20}
            className="field-ink mt-1"
          />
        </label>
        <label className="block">
          <span className="text-caption text-muted">Comments per person per day</span>
          <input
            name="comment_limit_per_day"
            type="number"
            min={1}
            defaultValue={settings?.comment_limit_per_day ?? 50}
            className="field-ink mt-1"
          />
        </label>
        <label className="flex min-h-11 items-center gap-3">
          <input
            name="feature_comments"
            type="checkbox"
            defaultChecked={settings?.feature_comments ?? true}
            className="size-4"
          />
          <span className="text-caption">Allow likes and comments on photographs and letters</span>
        </label>
        <button type="submit" className="btn btn-green">
          Save settings
        </button>
      </form>
    </main>
  );
}
