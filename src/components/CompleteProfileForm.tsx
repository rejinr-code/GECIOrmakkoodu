"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { saveProfile } from "@/lib/actions/auth";
import {
  allBatchYears,
  branchesForYear,
  defaultGalleryYear,
  formatBatchLabel,
} from "@/config/site";

type JoinDraft = {
  name?: string;
  batchYear?: number;
  branch?: string;
  phone?: string;
};

function readJoinDraft(): JoinDraft | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem("ormakkoodu.join");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as JoinDraft;
  } catch {
    sessionStorage.removeItem("ormakkoodu.join");
    return null;
  }
}

export function CompleteProfileForm({
  consentVersion,
  defaultName,
  defaultBatchYear,
  defaultBranch,
}: {
  consentVersion: string;
  defaultName: string;
  defaultBatchYear: number | null;
  defaultBranch: string | null;
}) {
  const years = useMemo(() => [...allBatchYears()].reverse(), []);
  const draft = useMemo(() => readJoinDraft(), []);
  const [name, setName] = useState(draft?.name ?? defaultName);
  const [batchYear, setBatchYear] = useState(
    draft?.batchYear ?? defaultBatchYear ?? defaultGalleryYear(),
  );
  const [branch, setBranch] = useState(draft?.branch ?? defaultBranch ?? "CSE");
  const [phone, setPhone] = useState(draft?.phone ?? "");
  const [error, setError] = useState<string | null>(null);

  const branches = branchesForYear(batchYear);
  return (
    <form
      action={async (formData) => {
        setError(null);
        const result = await saveProfile(formData);
        if (result?.error) setError(result.error);
        else sessionStorage.removeItem("ormakkoodu.join");
      }}
      className="mt-8 space-y-5"
    >
      <input type="hidden" name="consent_version" value={consentVersion} />
      <label className="block">
        <span className="text-caption">Name</span>
        <input required name="name" value={name} onChange={(e) => setName(e.target.value)} className="field mt-1" />
      </label>
      <label className="block">
        <span className="text-caption">Your batch</span>
        <select
          required
          name="batch_year"
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
          name="branch"
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
      </label>
      <label className="block">
        <span className="text-caption">Phone (optional, never listed)</span>
        <input name="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="field mt-1" />
      </label>
      <label className="flex min-h-11 items-start gap-3">
        <input type="checkbox" name="consent" required className="mt-1 size-5 accent-green" />
        <span className="text-caption">
          I have read the{" "}
          <Link href="/legal/privacy" className="underline underline-offset-4">
            privacy notice
          </Link>{" "}
          and I consent to GECIAN processing my details. Version {consentVersion}.
        </span>
      </label>
      {error ? <p className="text-caption text-green">{error}</p> : null}
      <button type="submit" className="btn btn-green">
        Save and continue
      </button>
    </form>
  );
}
