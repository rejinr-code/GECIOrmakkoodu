"use client";

import { useState } from "react";

export function DownloadPrint({
  url,
  filename,
}: {
  url: string;
  filename: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <span className="inline-flex flex-col">
      <button
        type="button"
        className="inline-flex min-h-11 items-center"
        disabled={busy}
        onClick={async () => {
          setError(null);
          setBusy(true);
          try {
            const response = await fetch(url);
            if (!response.ok) throw new Error("Could not download.");
            const blob = await response.blob();
            const href = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = href;
            link.download = filename;
            link.click();
            URL.revokeObjectURL(href);
          } catch {
            setError("Could not download this print.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Downloading…" : "Download this print"}
      </button>
      {error ? <span className="text-muted">{error}</span> : null}
    </span>
  );
}
