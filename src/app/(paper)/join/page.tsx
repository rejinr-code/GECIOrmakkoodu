import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { CompleteProfileForm } from "@/components/CompleteProfileForm";
import { PaperPage } from "@/components/MarkdownBody";
import { siteConfig } from "@/config/site";
import { getSettings } from "@/lib/data";
import { getSession, isProfileComplete } from "@/lib/session";

export const metadata = { title: "Join" };

export default async function JoinPage() {
  const session = await getSession();
  const settings = await getSettings();
  const consentVersion =
    settings?.consent_version ?? siteConfig.legal.currentConsentVersion;

  if (session.userId && isProfileComplete(session.profile)) {
    const staleConsent =
      session.profile?.consent_version !== consentVersion;
    if (!staleConsent) {
      return (
        <PaperPage>
          <h1 className="text-h1 font-medium tracking-wordmark">You are in</h1>
          <p className="mt-4 max-w-md">
            {session.profile?.status === "verified"
              ? "Your account is verified. You can add photographs, write a letter, or list yourself in People."
              : "A volunteer still needs to match you to the alumni list. You can keep browsing in the meantime."}
          </p>
          <Link href="/" className="btn btn-green mt-8">
            Back to the archive
          </Link>
        </PaperPage>
      );
    }
  }

  if (session.userId) {
    return (
      <PaperPage>
        <h1 className="text-h1 font-medium tracking-wordmark">Finish joining</h1>
        <p className="mt-4 max-w-md text-paper-ink/70">
          Google accounts still need a batch, a branch, and consent. Pending
          members can browse; contributing waits on verification.
        </p>
        <CompleteProfileForm
          consentVersion={consentVersion}
          defaultName={session.profile?.name ?? ""}
          defaultBatchYear={session.profile?.batch_year ?? null}
          defaultBranch={session.profile?.branch ?? null}
        />
      </PaperPage>
    );
  }

  return (
    <PaperPage>
      <p lang="ml" className="font-malayalam text-lead text-paper-ink/60">
        {siteConfig.nameMl}
      </p>
      <h1 className="mt-2 text-h1 font-medium tracking-wordmark">Join the nest</h1>
      <p className="mt-4 max-w-md">
        Sign in with an email link or Google. No phone OTP. New accounts stay
        pending until a volunteer checks the alumni list.
      </p>
      <AuthForm mode="join" consentVersion={consentVersion} />
      <p className="mt-8 text-caption">
        Already have an account?{" "}
        <Link href="/sign-in" className="underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </PaperPage>
  );
}
