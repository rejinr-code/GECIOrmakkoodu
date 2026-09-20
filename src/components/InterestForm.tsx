"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { expressInterest, withdrawInterest } from "@/lib/actions/offers";
import { OFFER_NOTE_MAX } from "@/lib/offers";

export function InterestForm({
  offerId,
  interested,
}: {
  offerId: string;
  interested: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (interested) {
    return (
      <form
        className="mt-8"
        onSubmit={async (event) => {
          event.preventDefault();
          setError(null);
          setBusy(true);
          try {
            const result = await withdrawInterest(new FormData(event.currentTarget));
            if (result.error) setError(result.error);
            else router.refresh();
          } finally {
            setBusy(false);
          }
        }}
      >
        <input type="hidden" name="offer_id" value={offerId} />
        <p className="text-caption text-muted">You have said you are interested.</p>
        {error ? <p className="mt-2 text-caption text-green">{error}</p> : null}
        <button type="submit" className="btn btn-quiet mt-3" disabled={busy}>
          {busy ? "Withdrawing…" : "Withdraw"}
        </button>
      </form>
    );
  }

  return (
    <form
      className="mt-8 space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        setBusy(true);
        try {
          const result = await expressInterest(new FormData(event.currentTarget));
          if (result.error) setError(result.error);
          else router.refresh();
        } finally {
          setBusy(false);
        }
      }}
    >
      <input type="hidden" name="offer_id" value={offerId} />
      <label className="block">
        <span className="text-caption">A short note (optional)</span>
        <textarea
          name="note"
          maxLength={OFFER_NOTE_MAX}
          rows={3}
          className="field mt-1 py-3"
        />
      </label>
      {error ? <p className="text-caption text-green">{error}</p> : null}
      <button type="submit" className="btn btn-green" disabled={busy}>
        {busy ? "Sending…" : "I'm interested"}
      </button>
    </form>
  );
}
