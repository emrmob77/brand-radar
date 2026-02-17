"use client";

import { useMemo, useState } from "react";
import type { OptimizationCard } from "@/app/(dashboard)/actions/optimizations";

type ImpactEffortMatrixProps = {
  cards: OptimizationCard[];
};

const impactPosition: Record<OptimizationCard["impact"], number> = {
  low: 82,
  medium: 50,
  high: 18
};

const effortPosition: Record<OptimizationCard["effort"], number> = {
  low: 18,
  medium: 50,
  high: 82
};

function statusLabel(status: OptimizationCard["status"]) {
  if (status === "todo") return "To Do";
  if (status === "in_progress") return "In Progress";
  return "Done";
}

export function ImpactEffortMatrix({ cards }: ImpactEffortMatrixProps) {
  const [selectedId, setSelectedId] = useState(cards[0]?.id ?? null);

  const points = useMemo(
    () =>
      cards.map((card, index) => {
        const horizontalOffset = ((index % 3) - 1) * 3;
        const verticalOffset = (Math.floor(index / 3) % 2 === 0 ? 1 : -1) * 3;

        return {
          ...card,
          x: Math.min(92, Math.max(8, effortPosition[card.effort] + horizontalOffset)),
          y: Math.min(92, Math.max(8, impactPosition[card.impact] + verticalOffset))
        };
      }),
    [cards]
  );

  const selectedCard = points.find((card) => card.id === selectedId) ?? points[0] ?? null;

  return (
    <section className="surface-panel p-5">
      <h2 className="text-lg font-bold text-ink">Impact vs Effort Matrix</h2>
      <p className="mt-1 text-sm text-text-secondary">Click an optimization to inspect details and execution readiness.</p>

      <div className="mt-5">
        <div className="relative aspect-square min-h-[320px] overflow-hidden rounded-2xl border border-surface-border bg-gradient-to-b from-white to-slate-50">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-0 h-full w-px bg-surface-border" />
            <div className="absolute left-0 top-1/2 h-px w-full bg-surface-border" />
          </div>

          <p className="absolute left-3 top-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-secondary">High impact</p>
          <p className="absolute bottom-2 left-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-secondary">Low impact</p>
          <p className="absolute bottom-2 right-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-secondary">High effort</p>
          <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-secondary">Low effort</p>

          {points.map((card) => (
            <button
              className={`focus-ring absolute min-h-11 min-w-[9rem] -translate-x-1/2 -translate-y-1/2 rounded-xl border px-3 py-2 text-left shadow-sm transition ${
                selectedCard?.id === card.id
                  ? "border-brand/40 bg-brand text-white shadow-[0_10px_24px_rgba(55,109,246,0.25)]"
                  : "border-surface-border bg-white text-ink hover:border-brand/30"
              }`}
              key={card.id}
              onClick={() => setSelectedId(card.id)}
              style={{ left: `${card.x}%`, top: `${card.y}%` }}
              type="button"
            >
              <p className="truncate text-xs font-semibold">{card.title}</p>
              <p className={`mt-0.5 text-[10px] font-medium ${selectedCard?.id === card.id ? "text-white/80" : "text-text-secondary"}`}>
                {card.impact} impact / {card.effort} effort
              </p>
            </button>
          ))}
        </div>
      </div>

      {selectedCard ? (
        <article className="mt-4 rounded-xl border border-surface-border bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">Selected initiative</p>
          <h3 className="mt-1 text-base font-bold text-ink">{selectedCard.title}</h3>
          <p className="mt-1 text-sm text-text-secondary">{selectedCard.description}</p>
          <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
            <p className="rounded-lg border border-surface-border bg-slate-50 px-3 py-2 text-ink">Status: {statusLabel(selectedCard.status)}</p>
            <p className="rounded-lg border border-surface-border bg-slate-50 px-3 py-2 text-ink">Impact: {selectedCard.impact}</p>
            <p className="rounded-lg border border-surface-border bg-slate-50 px-3 py-2 text-ink">Effort: {selectedCard.effort}</p>
          </div>
        </article>
      ) : null}
    </section>
  );
}
