import { MarkdownBody, PaperPage } from "@/components/MarkdownBody";
import { siteConfig } from "@/config/site";

export const metadata = {
  title: "About",
};

export default function AboutPage() {
  const rest = `
It is run by **${siteConfig.association.fullName}** volunteers. The first maintainers came from the ${siteConfig.association.foundingMaintainerBatch} batch. ${siteConfig.association.disclaimer}

Looking does not require an account. Contributing does. New accounts stay pending until a volunteer checks them against the alumni list.

Batches are labelled as admission to graduation (2000–2004, 2007–2011, and so on). Mechanical Engineering began with 2013–2017. Robotics and Artificial Intelligence began with 2025–2029.

There is no payment collection, no face recognition, and no public listing of phone numbers or email addresses. WhatsApp batch links are visible only after verification. The people directory is opt-in, field by field. Mentoring offers never carry an email — interested alumni are shown as public names.
`;

  return (
    <PaperPage>
      <p lang="ml" className="font-malayalam text-lead text-paper-ink/60">
        {siteConfig.nameMl}
      </p>
      <h1 className="mt-2 text-h1 font-medium tracking-wordmark">
        About {siteConfig.name}
      </h1>
      <p className="mt-4">
        {siteConfig.name} means {siteConfig.meaning}. This is {siteConfig.tagline}: a place for alumni of{" "}
        {siteConfig.association.collegeName} to keep photographs and writing from campus years.
      </p>
      <MarkdownBody>{rest.trim()}</MarkdownBody>
    </PaperPage>
  );
}
