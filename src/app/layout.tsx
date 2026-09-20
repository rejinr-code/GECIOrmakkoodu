import type { ReactNode } from "react";
import { Manjari, Poppins } from "next/font/google";
import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-poppins",
  display: "swap",
});

const manjari = Manjari({
  subsets: ["malayalam", "latin"],
  weight: ["400", "700"],
  variable: "--font-manjari",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s — ${siteConfig.name}`,
  },
  description: `${siteConfig.name} (${siteConfig.nameMl}) is ${siteConfig.meaning}: a photograph and writing archive run by ${siteConfig.association.fullName}.`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${manjari.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-paper font-sans text-ink">
        {children as ReactNode}
      </body>
    </html>
  );
}
