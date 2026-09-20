import { redirect } from "next/navigation";
import { OfferForm } from "@/components/OfferForm";
import { PaperPage } from "@/components/MarkdownBody";
import { getSettings } from "@/lib/data";
import { getSession, isVerified } from "@/lib/session";

export const metadata = { title: "Post an offer" };

export default async function NewOfferPage() {
  const session = await getSession();
  if (!session.userId) redirect("/sign-in");
  if (!isVerified(session.profile)) redirect("/offers");

  const settings = await getSettings();
  if (settings?.feature_mentoring === false) redirect("/offers");

  return (
    <PaperPage>
      <h1 className="text-h1 font-medium tracking-wordmark">Post an offer</h1>
      <p className="mt-4 max-w-prose text-muted">
        A volunteer reads every offer before it is listed. Do not include an
        email or phone.
      </p>
      <OfferForm />
    </PaperPage>
  );
}
