"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OfferKind } from "@/config/site";
import { saveOffer } from "@/lib/actions/offers";
import { CITY_MAX } from "@/lib/profiles";
import { OFFER_BODY_MAX, OFFER_TITLE_MAX } from "@/lib/offers";

export function OfferForm({
  offerId,
  defaultKind = "mentoring",
  defaultTitle = "",
  defaultBody = "",
  defaultCity = "",
}: {
  offerId?: string;
  defaultKind?: OfferKind;
  defaultTitle?: string;
  defaultBody?: string;
  defaultCity?: string;
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
          const result = await saveOffer(new FormData(event.currentTarget));
          if ("error" in result) {
            setError(result.error);
            return;
          }
          router.push(`/offers/${result.id}`);
          router.refresh();
        } finally {
          setBusy(false);
        }
      }}
    >
      {offerId ? <input type="hidden" name="id" value={offerId} /> : null}
      <label className="block">
        <span className="text-caption">Kind</span>
        <select name="kind" defaultValue={defaultKind} className="field mt-1">
          <option value="mentoring">Mentoring</option>
          <option value="internship">Internship</option>
        </select>
      </label>
      <label className="block">
        <span className="text-caption">Title</span>
        <input
          required
          name="title"
          maxLength={OFFER_TITLE_MAX}
          defaultValue={defaultTitle}
          className="field mt-1"
        />
      </label>
      <label className="block">
        <span className="text-caption">City (optional)</span>
        <input
          name="city"
          maxLength={CITY_MAX}
          defaultValue={defaultCity}
          className="field mt-1"
        />
      </label>
      <label className="block">
        <span className="text-caption">What you can offer</span>
        <textarea
          required
          name="body"
          maxLength={OFFER_BODY_MAX}
          rows={8}
          defaultValue={defaultBody}
          className="field mt-1 min-h-40 py-3"
        />
        <span className="mt-1 block text-caption opacity-70">
          Do not write an email or phone. People reach you with I&apos;m interested,
          and you will see their public page.
        </span>
      </label>
      {error ? <p className="text-caption text-green">{error}</p> : null}
      <button type="submit" className="btn btn-green" disabled={busy}>
        {busy ? "Sending…" : "Send for review"}
      </button>
    </form>
  );
}
