"use client";

import { CircleHelp } from "lucide-react";
import { cn } from "@/lib/utils";

type HelpTooltipProps = {
  text: string;
  className?: string;
};

export function HelpTooltip({ text, className }: HelpTooltipProps) {
  return (
    <span className={cn("group relative inline-flex", className)}>
      <button
        aria-label="Contextual help"
        className="focus-ring inline-flex min-h-8 min-w-8 items-center justify-center rounded-full border border-surface-border bg-white text-text-secondary hover:text-ink"
        type="button"
      >
        <CircleHelp className="h-4 w-4" />
      </button>
      <span className="pointer-events-none absolute right-0 top-[calc(100%+0.45rem)] z-30 w-64 rounded-xl border border-surface-border bg-white p-2 text-[11px] leading-relaxed text-text-secondary opacity-0 shadow-[0_10px_24px_rgba(17,19,24,0.14)] transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        {text}
      </span>
    </span>
  );
}
