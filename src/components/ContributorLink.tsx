import Link from "next/link";

export function ContributorLink({
  id,
  name,
  className = "underline-offset-4 hover:underline",
}: {
  id: string | null;
  name: string;
  className?: string;
}) {
  if (!id) {
    return <span className={className}>{name}</span>;
  }

  return (
    <Link href={`/people/${id}`} className={className}>
      {name}
    </Link>
  );
}
