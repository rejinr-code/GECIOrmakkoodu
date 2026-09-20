"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Selection = {
  selected: Set<string>;
  toggle: (id: string) => void;
  allIds: string[];
};

const SelectionContext = createContext<Selection | null>(null);

export function ModerationSelect({
  ids,
  action,
  approveValue,
  approveLabel,
  children,
}: {
  ids: string[];
  action: (formData: FormData) => Promise<void>;
  approveValue: string;
  approveLabel: string;
  children: ReactNode;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggle = useCallback((id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const value = useMemo(
    () => ({ selected, toggle, allIds: ids }),
    [selected, toggle, ids],
  );
  const allOn = ids.length > 0 && selected.size === ids.length;

  return (
    <SelectionContext.Provider value={value}>
      <form action={action} className="mt-8 flex flex-wrap items-end gap-3">
        {[...selected].map((id) => (
          <input key={id} type="hidden" name="ids" value={id} />
        ))}
        <button
          type="button"
          className="btn btn-quiet text-caption"
          onClick={() => setSelected(allOn ? new Set() : new Set(ids))}
        >
          {allOn ? "Clear selection" : "Select all"}
        </button>
        <button
          type="submit"
          name="decision"
          value={approveValue}
          className="btn btn-green"
          disabled={selected.size === 0}
        >
          {approveLabel} ({selected.size})
        </button>
        <label className="block min-w-48 flex-1">
          <span className="sr-only">Rejection reason for selected</span>
          <input name="rejection_reason" placeholder="Reason for a bulk reject" className="field-ink" />
        </label>
        <button
          type="submit"
          name="decision"
          value="rejected"
          className="inline-flex min-h-11 items-center px-4 font-medium text-muted"
          disabled={selected.size === 0}
        >
          Reject selected
        </button>
      </form>
      {children}
    </SelectionContext.Provider>
  );
}

export function SelectBox({ id, label }: { id: string; label: string }) {
  const selection = useContext(SelectionContext);
  if (!selection) return null;
  return (
    <label className="flex min-h-11 items-center gap-2 text-caption text-muted">
      <input
        type="checkbox"
        className="size-4"
        checked={selection.selected.has(id)}
        onChange={() => selection.toggle(id)}
      />
      {label}
    </label>
  );
}
