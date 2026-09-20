import type { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { contactEmail, getSettings } from "@/lib/data";
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

  return (
    <>
      <SiteHeader session={session} />
      {children}
      <SiteFooter contactEmail={contactEmail(settings)} rail={rail} />
    </>
  );
}
