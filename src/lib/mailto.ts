import { siteConfig } from "@/config/site";

export function removalMailto(options: {
  contactEmail: string;
  itemType: "photo" | "article";
  itemId: string;
  itemUrl: string;
}): string {
  const subject = `${siteConfig.name} removal request ${options.itemType} ${options.itemId}`;
  const body = [
    "Please hide this item from the public archive.",
    "",
    `Type: ${options.itemType}`,
    `Reference: ${options.itemId}`,
    `URL: ${options.itemUrl}`,
    "",
    "My name:",
    "How to reach me:",
    "Why it should come down:",
  ].join("\n");

  return `mailto:${options.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
