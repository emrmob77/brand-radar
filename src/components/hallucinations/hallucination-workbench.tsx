"use client";

import { format } from "date-fns";
import { ChevronDown, CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import {
  type HallucinationRiskLevel,
  type HallucinationRow,
  markHallucinationCorrectedAction
} from "@/app/(dashboard)/actions/hallucinations";

type HallucinationWorkbenchProps = {
  initialRows: HallucinationRow[];
};

type RiskFilter = "all" | HallucinationRiskLevel;

function riskBadgeClass(level: HallucinationRiskLevel) {
  if (level === "critical") return "bg-red-100 text-red-700 border-red-200";
  if (level === "high") return "bg-amber-100 text-amber-700 border-amber-200";
  if (level === "medium") return "bg-sky-100 text-sky-700 border-sky-200";
  return "bg-emerald-100 text-emerald-700 border-emerald-200";
}

function statusClass(status: HallucinationRow["status"]) {
  if (status === "corrected") return "bg-emerald-100 text-emerald-700";
  if (status === "monitoring") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

function statusLabel(status: HallucinationRow["status"]) {
  if (status === "open") return "Open";
  if (status === "monitoring") return "Monitoring";
  return "Corrected";
}

const riskOrder: Record<HallucinationRiskLevel, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1
};

export function HallucinationWorkbench({ initialRows }: HallucinationWorkbenchProps) {
  const [rows, setRows] = useState(initialRows);
  const [platformFilter, setPlatformFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [notesById, setNotesById] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const platformOptions = useMemo(() => Array.from(new Set(rows.map((row) => row.platform))).sort((a, b) => a.localeCompare(b)), [rows]);

  const filteredRows = useMemo(() => {
    return [...rows]
      .filter((row) => {
        const riskMatch = riskFilter === "all" ? true : row.riskLevel === riskFilter;
        const platformMatch = platformFilter === "all" ? true : row.platform === platformFilter;
        return riskMatch && platformMatch;
      })
      .sort((a, b) => {
        const riskDiff = riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
        if (riskDiff !== 0) return riskDiff;
        return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime();
      });
  }, [platformFilter, riskFilter, rows]);

  async function handleMarkCorrected(rowId: string) {
    setError(null);
    const current = rows.find((row) => row.id === rowId);
    if (!current || current.status === "corrected") return;

    const note = (notesById[rowId] ?? "").trim();
    const snapshot = rows;
    const optimisticCorrectedAt = new Date().toISOString();

    setPendingId(rowId);
    setRows((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              status: "corrected",
              correctedAt: optimisticCorrectedAt,
              correctionNote: note || row.correctionNote
            }
          : row
      )
    );

    const result = await markHallucinationCorrectedAction(rowId, note);
    if (!result.ok) {
      setRows(snapshot);
      setError(result.error ?? "Could not update hallucination status.");
      setPendingId(null);
      return;
    }

    setRows((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              status: "corrected",
              correctedAt: result.correctedAt ?? optimisticCorrectedAt,
              correctionNote: result.note ?? row.correctionNote
            }
          : row
      )
    );
    setPendingId(null);
  }

  return (
    <section className="surface-panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-ink">Hallucination Cases</h2>
          <p className="mt-1 text-sm text-text-secondary">Sorted by risk level with expandable details and correction tracking.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className="focus-ring rounded-xl border border-surface-border bg-white px-3 py-2 text-xs"
            onChange={(event) => setPlatformFilter(event.target.value)}
            value={platformFilter}
          >
            <option value="all">All Platforms</option>
            {platformOptions.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
          <select
            className="focus-ring rounded-xl border border-surface-border bg-white px-3 py-2 text-xs"
            onChange={(event) => setRiskFilter(event.target.value as RiskFilter)}
            value={riskFilter}
          >
            <option value="all">All Risks</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {error ? <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p> : null}

      <div className="mt-4 space-y-3">
        {filteredRows.length === 0 ? (
          <p className="rounded-xl border border-surface-border bg-slate-50 px-4 py-3 text-sm text-text-secondary">No hallucination case matches these filters.</p>
        ) : (
          filteredRows.map((row) => {
            const isExpanded = Boolean(expanded[row.id]);
            const noteValue = notesById[row.id] ?? row.correctionNote ?? "";
            return (
              <article className="overflow-hidden rounded-xl border border-surface-border bg-white" key={row.id}>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-border px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-ink">{row.platform}</p>
                    <p className="mt-0.5 text-xs text-text-secondary">{row.query}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] ${riskBadgeClass(row.riskLevel)}`}>
                      {row.riskLevel}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClass(row.status)}`}>{statusLabel(row.status)}</span>
                    <button
                      aria-expanded={isExpanded}
                      className="focus-ring inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-surface-border bg-white text-text-secondary hover:text-ink"
                      onClick={() => setExpanded((prev) => ({ ...prev, [row.id]: !prev[row.id] }))}
                      type="button"
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : "rotate-0"}`} />
                    </button>
                  </div>
                </div>

                <div className="px-4 py-3">
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-red-700">Incorrect Information</p>
                      <p className="mt-1 text-sm text-red-700">{row.incorrectInfo}</p>
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-700">Correct Information</p>
                      <p className="mt-1 text-sm text-emerald-700">{row.correctInfo}</p>
                    </div>
                  </div>
                </div>

                {isExpanded ? (
                  <div className="border-t border-surface-border bg-slate-50 px-4 py-3">
                    <div className="grid grid-cols-1 gap-3 text-xs text-text-secondary sm:grid-cols-2">
                      <p>
                        Detected: <span className="font-semibold text-ink">{format(new Date(row.detectedAt), "yyyy-MM-dd HH:mm")}</span>
                      </p>
                      <p>
                        Corrected:{" "}
                        <span className="font-semibold text-ink">{row.correctedAt ? format(new Date(row.correctedAt), "yyyy-MM-dd HH:mm") : "Not yet"}</span>
                      </p>
                    </div>

                    <div className="mt-3">
                      <label className="mb-1 block text-xs font-semibold text-text-secondary" htmlFor={`note-${row.id}`}>
                        Correction note
                      </label>
                      <textarea
                        className="focus-ring min-h-20 w-full rounded-xl border border-surface-border bg-white px-3 py-2 text-sm text-ink"
                        id={`note-${row.id}`}
                        onChange={(event) => setNotesById((prev) => ({ ...prev, [row.id]: event.target.value }))}
                        placeholder="Add remediation details or verification notes..."
                        value={noteValue}
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={row.status === "corrected" || pendingId === row.id}
                        onClick={() => {
                          void handleMarkCorrected(row.id);
                        }}
                        type="button"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {row.status === "corrected" ? "Corrected" : pendingId === row.id ? "Updating..." : "Mark as corrected"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
