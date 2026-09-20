"use client";

import { useState } from "react";
import { deleteMyAccount, exportMyData } from "@/lib/actions/auth";

export function AccountControls() {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onExport() {
    setBusy(true);
    setMessage(null);
    const result = await exportMyData();
    setBusy(false);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    const blob = new Blob([JSON.stringify(result.data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ormakkoodu-export.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function onDelete() {
    const confirmed = window.confirm(
      "This removes your profile and attributes remaining photographs to Former member. Continue?",
    );
    if (!confirmed) return;
    setBusy(true);
    const result = await deleteMyAccount();
    if (result?.error) {
      setBusy(false);
      setMessage(result.error);
    }
  }

  return (
    <div className="mt-10 space-y-4">
      <button
        type="button"
        disabled={busy}
        onClick={onExport}
        className="btn btn-quiet"
      >
        Download my data
      </button>
      <div>
        <button
          type="button"
          disabled={busy}
          onClick={onDelete}
          className="inline-flex min-h-11 items-center px-5 font-medium text-paper-ink/70"
        >
          Delete my account
        </button>
      </div>
      {message ? <p className="text-caption">{message}</p> : null}
    </div>
  );
}
