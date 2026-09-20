"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { savePublicDetails } from "@/lib/actions/auth";
import { BIO_MAX, CITY_MAX, NAME_MAX, ROLE_MAX } from "@/lib/profiles";

export function PublicProfileForm({
  defaultName,
  defaultBio,
  defaultCity,
  defaultRole,
  defaultDirectoryOptIn,
  defaultShowCity,
  defaultShowRole,
  defaultShowBio,
}: {
  defaultName: string;
  defaultBio: string;
  defaultCity: string;
  defaultRole: string;
  defaultDirectoryOptIn: boolean;
  defaultShowCity: boolean;
  defaultShowRole: boolean;
  defaultShowBio: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="mt-8 space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        setBusy(true);
        try {
          const result = await savePublicDetails(new FormData(event.currentTarget));
          if ("error" in result) {
            setError(result.error);
            return;
          }
          router.push(`/people/${result.id}`);
          router.refresh();
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="block">
        <span className="text-caption">Name</span>
        <input
          required
          name="name"
          maxLength={NAME_MAX}
          defaultValue={defaultName}
          className="field mt-1"
        />
      </label>
      <label className="block">
        <span className="text-caption">City (optional)</span>
        <input
          name="current_city"
          maxLength={CITY_MAX}
          defaultValue={defaultCity}
          className="field mt-1"
        />
      </label>
      <label className="block">
        <span className="text-caption">What you do now (optional)</span>
        <input
          name="current_role"
          maxLength={ROLE_MAX}
          defaultValue={defaultRole}
          className="field mt-1"
        />
        <span className="mt-1 block text-caption opacity-70">
          A short line, such as teacher or civil engineer. No phone or email.
        </span>
      </label>
      <label className="block">
        <span className="text-caption">A few words (optional)</span>
        <textarea
          name="bio"
          maxLength={BIO_MAX}
          rows={5}
          defaultValue={defaultBio}
          className="field mt-1 min-h-32 py-3"
        />
      </label>
      <fieldset className="space-y-3 border-t border-ink/8 pt-5">
        <legend className="text-caption">Who can see this</legend>
        <p className="text-caption text-muted">
          Name, batch, and branch already appear when someone opens your page from
          a photograph. The rest stays off until you tick it. Phone and email never
          appear here.
        </p>
        <label className="flex min-h-11 items-start gap-3">
          <input
            name="directory_opt_in"
            type="checkbox"
            defaultChecked={defaultDirectoryOptIn}
            className="mt-1 size-4"
          />
          <span className="text-caption">
            List me in the alumni directory, searchable by name, batch, and branch
          </span>
        </label>
        <label className="flex min-h-11 items-start gap-3">
          <input
            name="directory_show_city"
            type="checkbox"
            defaultChecked={defaultShowCity}
            className="mt-1 size-4"
          />
          <span className="text-caption">Show my city</span>
        </label>
        <label className="flex min-h-11 items-start gap-3">
          <input
            name="directory_show_role"
            type="checkbox"
            defaultChecked={defaultShowRole}
            className="mt-1 size-4"
          />
          <span className="text-caption">Show what I do now</span>
        </label>
        <label className="flex min-h-11 items-start gap-3">
          <input
            name="directory_show_bio"
            type="checkbox"
            defaultChecked={defaultShowBio}
            className="mt-1 size-4"
          />
          <span className="text-caption">Show my note</span>
        </label>
      </fieldset>
      {error ? <p className="text-caption text-green">{error}</p> : null}
      <button type="submit" className="btn btn-green" disabled={busy}>
        {busy ? "Saving…" : "Save public details"}
      </button>
    </form>
  );
}
