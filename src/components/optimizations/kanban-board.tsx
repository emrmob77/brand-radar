"use client";

import { useMemo, useState } from "react";
import {
  type OptimizationCard,
  type OptimizationStatus,
  updateOptimizationStatusAction
} from "@/app/(dashboard)/actions/optimizations";

type KanbanBoardProps = {
  initialCards: OptimizationCard[];
};

const columns: Array<{ key: OptimizationStatus; label: string }> = [
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "done", label: "Done" }
];

function chipClass(value: "high" | "medium" | "low") {
  if (value === "high") return "bg-emerald-100 text-emerald-700";
  if (value === "medium") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

function formatLevel(value: "high" | "medium" | "low") {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function KanbanBoard({ initialCards }: KanbanBoardProps) {
  const [cards, setCards] = useState(initialCards);
  const [dragCardId, setDragCardId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const grouped = useMemo(
    () =>
      columns.map((column) => ({
        ...column,
        items: cards.filter((card) => card.status === column.key)
      })),
    [cards]
  );

  async function moveCard(cardId: string, nextStatus: OptimizationStatus) {
    const snapshot = cards;
    const current = cards.find((card) => card.id === cardId);
    if (!current || current.status === nextStatus) return;

    setError(null);
    setCards((prev) => prev.map((card) => (card.id === cardId ? { ...card, status: nextStatus } : card)));

    const result = await updateOptimizationStatusAction(cardId, nextStatus);
    if (!result.ok) {
      setCards(snapshot);
      setError(result.error ?? "Failed to update optimization status.");
    }
  }

  return (
    <section className="mt-6">
      {error ? <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p> : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {grouped.map((column) => (
          <article
            className="surface-panel min-h-[320px] p-4"
            key={column.key}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (dragCardId) {
                void moveCard(dragCardId, column.key);
              }
              setDragCardId(null);
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">
              {column.label} ({column.items.length})
            </p>

            <div className="mt-3 space-y-3">
              {column.items.map((card) => (
                <div
                  className="rounded-xl border border-surface-border bg-white p-3"
                  draggable
                  key={card.id}
                  onDragEnd={() => setDragCardId(null)}
                  onDragStart={() => setDragCardId(card.id)}
                >
                  <p className="text-sm font-semibold text-ink">{card.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-text-secondary">{card.description}</p>
                  <div className="mt-2 rounded-lg border border-surface-border bg-slate-50 p-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-text-secondary">Readiness</span>
                      <span className="font-semibold text-ink">{card.readinessScore}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-brand-soft">
                      <div className="h-1.5 rounded-full bg-brand" style={{ width: `${Math.min(100, Math.max(0, card.readinessScore))}%` }} />
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                    <span className={`rounded-full px-2 py-0.5 font-semibold ${chipClass(card.impact)}`}>Impact: {formatLevel(card.impact)}</span>
                    <span className={`rounded-full px-2 py-0.5 font-semibold ${chipClass(card.effort)}`}>Effort: {formatLevel(card.effort)}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
