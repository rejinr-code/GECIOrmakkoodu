import { removePublishedItem } from "@/lib/actions/admin";

export function StaffRemoveForm({
  targetType,
  targetId,
  slug,
  label,
}: {
  targetType: "photo" | "article";
  targetId: string;
  slug?: string;
  label: string;
}) {
  return (
    <form action={removePublishedItem}>
      <input type="hidden" name="target_type" value={targetType} />
      <input type="hidden" name="target_id" value={targetId} />
      {slug ? <input type="hidden" name="slug" value={slug} /> : null}
      <button
        type="submit"
        className="inline-flex min-h-11 items-center font-medium text-muted"
      >
        {label}
      </button>
    </form>
  );
}
