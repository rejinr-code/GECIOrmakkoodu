import type { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { contactEmail, getCurrentPrompt, getSettings } from "@/lib/data";
import { getSession } from "@/lib/session";

export async function AppShell({
  rail = false,
  children,
}: {
  rail?: boolean;
  children: ReactNode;
}) {
  const session = await getSession();
  const settings = await getSettings();
  const prompt =
    settings?.feature_monthly_prompt === true ? await getCurrentPrompt() : null;

  return (
    <>
      <SiteHeader
        session={session}
        prompt={prompt}
        features={{
          directory: settings?.feature_directory === true,
          mentoring: settings?.feature_mentoring === true,
        }}
      />
      {children}
      <SiteFooter contactEmail={contactEmail(settings)} rail={rail} />
    </>
  );
}
