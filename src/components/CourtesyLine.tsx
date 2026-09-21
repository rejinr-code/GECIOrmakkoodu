import { ContributorLink } from "@/components/ContributorLink";

export function CourtesyLine({
  courtesy,
  contributorName,
  contributorId,
  anonymised,
  className = "text-caption text-muted",
}: {
  courtesy?: string | null;
  contributorName: string;
  contributorId: string | null;
  anonymised?: boolean;
  className?: string;
}) {
  const named = courtesy?.trim();
  const name = named || (anonymised ? "Former member" : contributorName);
  const profileId = named || anonymised ? null : contributorId;

  return (
    <p className={className}>
      Courtesy:{" "}
      {profileId ? <ContributorLink id={profileId} name={name} /> : name}
    </p>
  );
}
