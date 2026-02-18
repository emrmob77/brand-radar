"use client";

import { X } from "lucide-react";

export type FilterChipItem = {
  id: string;
  label: string;
  onRemove: () => void;
};

type FilterChipsProps = {
  chips: FilterChipItem[];
  onClearAll?: () => void;
};

export function FilterChips({ chips, onClearAll }: FilterChipsProps) {
  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          className="focus-ring inline-flex min-h-10 items-center gap-1 rounded-full border border-brand/25 bg-brand-soft px-3 py-1 text-xs font-semibold text-ink hover:bg-brand-soft/80"
          key={chip.id}
          onClick={chip.onRemove}
          type="button"
        >
          {chip.label}
          <X className="h-3 w-3" />
        </button>
      ))}
      {onClearAll ? (
        <button
          className="focus-ring inline-flex min-h-10 items-center rounded-full border border-surface-border bg-white px-3 py-1 text-xs font-semibold text-text-secondary hover:bg-brand-soft"
          onClick={onClearAll}
          type="button"
        >
          Clear all
        </button>
      ) : null}
    </div>
  );
}
