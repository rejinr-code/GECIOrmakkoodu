import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { PaperPage } from "@/components/MarkdownBody";
import { siteConfig } from "@/config/site";
import { getSettings } from "@/lib/data";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export const metadata = { title: "Sign in" };

export default async function SignInPage() {
  const session = await getSession();
  if (session.userId) redirect("/");

  const settings = await getSettings();
  const consentVersion =
    settings?.consent_version ?? siteConfig.legal.currentConsentVersion;

  return (
    <PaperPage>
      <h1 className="text-h1 font-medium tracking-wordmark">Welcome back</h1>
      <p className="mt-4 max-w-md">Email a magic link, or continue with Google.</p>
      <AuthForm mode="signin" consentVersion={consentVersion} />
      <p className="mt-8 text-caption">
        New here?{" "}
        <Link href="/join" className="underline underline-offset-4">
          Join the archive
        </Link>
      </p>
    </PaperPage>
  );
}
