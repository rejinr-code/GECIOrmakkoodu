"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  allBatchYears,
  branchesForYear,
  defaultGalleryYear,
  formatBatchLabel,
} from "@/config/site";
import { publicEnv } from "@/lib/env";

type Mode = "join" | "signin";

export function AuthForm({
  mode,
  consentVersion,
}: {
  mode: Mode;
  consentVersion: string;
}) {
  const years = useMemo(() => [...allBatchYears()].reverse(), []);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [batchYear, setBatchYear] = useState(defaultGalleryYear());
  const [branch, setBranch] = useState("CSE");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const branches = branchesForYear(batchYear);
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : publicEnv.siteUrl.replace(/\/$/, "");
  const afterAuth = mode === "join" ? "/join" : "/";

  async function sendMagicLink(event: FormEvent) {
    event.preventDefault();
    setMessage(null);

    if (mode === "join" && !consent) {
      setMessage("Please accept the privacy notice.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: mode === "join",
          emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(afterAuth)}`,
          data:
            mode === "join"
              ? {
                  name,
                  batch_year: String(batchYear),
                  branch,
                  phone,
                  consent: "true",
                  consent_version: consentVersion,
                  consent_accepted_at: new Date().toISOString(),
                }
              : {},
        },
      });
      if (error) {
        setMessage(error.message);
        return;
      }
      setMessage("Check your email for a sign-in link. It may take a minute.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not send the link.");
    } finally {
      setBusy(false);
    }
  }

  async function continueWithGoogle() {
    setMessage(null);
    if (mode === "join") {
      if (!consent) {
        setMessage("Please accept the privacy notice before continuing with Google.");
        return;
      }
      sessionStorage.setItem(
        "ormakkoodu.join",
        JSON.stringify({ name, batchYear, branch, phone, consentVersion }),
      );
    }
    setBusy(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(afterAuth)}`,
        },
      });
      if (error) setMessage(error.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Google sign-in failed.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={sendMagicLink} className="mt-8 space-y-5">
      {mode === "join" ? (
        <>
          <label className="block">
            <span className="text-caption">Name</span>
            <input
              required
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="field mt-1"
            />
          </label>
          <label className="block">
            <span className="text-caption">Your batch</span>
            <select
              required
              value={batchYear}
              onChange={(event) => {
                const next = Number(event.target.value);
                setBatchYear(next);
                const offered = branchesForYear(next);
                if (!offered.some((item) => item.id === branch)) {
                  setBranch(offered[0]?.id ?? "CSE");
                }
              }}
              className="field mt-1"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {formatBatchLabel(year)}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-caption opacity-70">
              Shown as admission to graduation, for example 2007–2011.
            </span>
          </label>
          <label className="block">
            <span className="text-caption">Branch</span>
            <select
              required
              value={branch}
              onChange={(event) => setBranch(event.target.value)}
              className="field mt-1"
            >
              {branches.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-caption opacity-70">
              Mechanical Engineering from 2013. Robotics and Artificial Intelligence
              from 2025.
            </span>
          </label>
          <label className="block">
            <span className="text-caption">Phone (optional, never listed)</span>
            <input
              name="phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="field mt-1"
            />
          </label>
          <label className="flex min-h-11 items-start gap-3">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              className="mt-1 size-5 accent-green"
            />
            <span className="text-caption">
              I have read the{" "}
              <Link href="/legal/privacy" className="underline underline-offset-4">
                privacy notice
              </Link>{" "}
              and I consent to GECIAN processing my details to run this alumni
              archive. Version {consentVersion}.
            </span>
          </label>
        </>
      ) : null}

      <label className="block">
        <span className="text-caption">Email</span>
        <input
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="field mt-1"
        />
      </label>

      {message ? <p className="text-caption text-green">{message}</p> : null}

      <button type="submit" disabled={busy} className="btn btn-green w-full disabled:opacity-60">
        {busy ? "Sending" : "Email me a link"}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={continueWithGoogle}
        className="btn btn-quiet w-full disabled:opacity-60"
      >
        Continue with Google
      </button>
    </form>
  );
}
