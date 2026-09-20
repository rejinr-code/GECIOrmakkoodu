import { Suspense, type ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { GalleryYearNav } from "@/components/YearRail";

export default function GalleryLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell rail>
      <Suspense fallback={null}>
        <GalleryYearNav />
      </Suspense>
      <div className="lg:pl-[var(--rail-width)]">{children}</div>
    </AppShell>
  );
}
