"use client";

import { Download, FileJson, FileSpreadsheet, FileText, Loader2, X } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  listExportClientsAction,
  requestBulkDataExportAction,
  requestDataExportAction,
  type ExportClientOption,
  type RequestExportInput
} from "@/app/(dashboard)/actions/exports";
import { cn } from "@/lib/utils";

type ExportFormat = RequestExportInput["format"];
type ExportScope = RequestExportInput["scope"];

type ScopeMapping = {
  scope: ExportScope;
  label: string;
};

const formatOptions: Array<{ format: ExportFormat; label: string; description: string; icon: React.ComponentType<{ className?: string }> }> = [
  {
    format: "csv",
    label: "CSV",
    description: "Spreadsheet compatible tabular data.",
    icon: FileSpreadsheet
  },
  {
    format: "json",
    label: "JSON",
    description: "Raw structured payload for integrations.",
    icon: FileJson
  },
  {
    format: "pdf",
    label: "PDF",
    description: "Snapshot preview for shareable summaries.",
    icon: FileText
  }
];

function resolveScope(pathname: string): ScopeMapping | null {
  if (pathname === "/") return { scope: "overview", label: "Executive Dashboard" };
  if (pathname.startsWith("/mentions")) return { scope: "mentions", label: "Brand Mentions" };
  if (pathname.startsWith("/forensics") || pathname.startsWith("/citations")) return { scope: "citations", label: "Citation Forensics" };
  if (pathname.startsWith("/alerts")) return { scope: "alerts", label: "Alerts and Notifications" };
  if (pathname.startsWith("/competitors")) return { scope: "competitors", label: "Competitor Intelligence" };
  if (pathname.startsWith("/trends")) return { scope: "trends", label: "Historical Trends" };
  if (pathname.startsWith("/visibility")) return { scope: "visibility", label: "AI Visibility" };
  if (pathname.startsWith("/hallucinations")) return { scope: "hallucinations", label: "Hallucination Detection" };
  if (pathname.startsWith("/optimizations")) return { scope: "optimizations", label: "Content Optimizations" };
  if (pathname.startsWith("/clients")) return { scope: "clients", label: "Client Management" };
  return null;
}

function decodeBase64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

function triggerDownload(fileName: string, mimeType: string, contentBase64: string) {
  const blob = new Blob([decodeBase64ToBuffer(contentBase64)], { type: mimeType });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

export function PageExportButton() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("csv");
  const [exportMode, setExportMode] = useState<"single" | "bulk">("single");
  const [error, setError] = useState<string | null>(null);
  const [lastSuccess, setLastSuccess] = useState<string | null>(null);
  const [clients, setClients] = useState<ExportClientOption[]>([]);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const mapping = useMemo(() => resolveScope(pathname), [pathname]);
  const activeScope = mapping ?? { scope: "overview", label: "Executive Dashboard" };
  const clientId = searchParams.get("clientId");

  useEffect(() => {
    if (!open) {
      return;
    }

    let mounted = true;

    async function loadClients() {
      setClientsLoading(true);
      const result = await listExportClientsAction();
      if (!mounted) {
        return;
      }

      if (!result.ok) {
        setClients([]);
        setClientsLoading(false);
        setError(result.error);
        return;
      }

      setClients(result.clients);
      const idSet = new Set(result.clients.map((client) => client.id));

      setSelectedClientIds((previous) => {
        const kept = previous.filter((id) => idSet.has(id));
        if (kept.length > 0) {
          return kept;
        }

        if (clientId && idSet.has(clientId)) {
          return [clientId];
        }

        return result.clients.slice(0, 2).map((client) => client.id);
      });

      setClientsLoading(false);
    }

    void loadClients();

    return () => {
      mounted = false;
    };
  }, [open, clientId]);

  function toggleClient(clientEntryId: string) {
    setSelectedClientIds((previous) => {
      if (previous.includes(clientEntryId)) {
        return previous.filter((id) => id !== clientEntryId);
      }
      return [...previous, clientEntryId];
    });
  }

  function toggleAllClients() {
    if (selectedClientIds.length === clients.length) {
      setSelectedClientIds([]);
      return;
    }
    setSelectedClientIds(clients.map((client) => client.id));
  }

  function handleExport() {
    setError(null);
    setLastSuccess(null);

    startTransition(async () => {
      if (exportMode === "bulk") {
        if (selectedClientIds.length < 2) {
          setError("Select at least two clients for bulk export.");
          return;
        }

        const bulkResult = await requestBulkDataExportAction({
          format: selectedFormat,
          scope: activeScope.scope,
          clientIds: selectedClientIds
        });

        if (!bulkResult.ok) {
          setError(bulkResult.error);
          return;
        }

        triggerDownload(bulkResult.fileName, bulkResult.mimeType, bulkResult.contentBase64);
        setLastSuccess(`${bulkResult.rowCount} rows exported across ${selectedClientIds.length} clients.`);
        setOpen(false);
        return;
      }

      const result = await requestDataExportAction({
        format: selectedFormat,
        scope: activeScope.scope,
        clientId: clientId ?? null
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      triggerDownload(result.fileName, result.mimeType, result.contentBase64);
      setLastSuccess(`${result.rowCount} row exported.`);
      setOpen(false);
    });
  }

  if (!mapping) {
    return null;
  }

  return (
    <>
      <button
        className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl border border-surface-border bg-white px-3 py-2 text-xs font-semibold text-ink hover:bg-brand-soft"
        onClick={() => setOpen(true)}
        type="button"
      >
        <Download className="h-3.5 w-3.5" />
        Export
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/45 p-3 sm:items-center sm:p-6">
          <section className="surface-panel w-full max-w-xl p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-text-secondary">Data Export</p>
                <h3 className="mt-1 text-lg font-semibold text-ink">{activeScope.label}</h3>
                <p className="mt-1 text-xs text-text-secondary">
                  Choose a format and download the current page scope.
                </p>
              </div>
              <button
                aria-label="Close export dialog"
                className="focus-ring inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-surface-border bg-white text-text-secondary hover:text-ink"
                onClick={() => setOpen(false)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {formatOptions.map((option) => {
                const Icon = option.icon;
                const active = selectedFormat === option.format;
                return (
                  <button
                    className={cn(
                      "focus-ring min-h-[92px] rounded-xl border p-3 text-left transition-colors",
                      active
                        ? "border-brand/35 bg-brand-soft"
                        : "border-surface-border bg-white hover:bg-brand-soft/70"
                    )}
                    key={option.format}
                    onClick={() => setSelectedFormat(option.format)}
                    type="button"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-ink" />
                      <p className="text-sm font-semibold text-ink">{option.label}</p>
                    </div>
                    <p className="mt-1.5 text-xs text-text-secondary">{option.description}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                className={cn(
                  "focus-ring min-h-11 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors",
                  exportMode === "single"
                    ? "border-brand/35 bg-brand-soft text-ink"
                    : "border-surface-border bg-white text-text-secondary hover:bg-brand-soft/70"
                )}
                onClick={() => setExportMode("single")}
                type="button"
              >
                Current Filter
              </button>
              <button
                className={cn(
                  "focus-ring min-h-11 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors",
                  exportMode === "bulk"
                    ? "border-brand/35 bg-brand-soft text-ink"
                    : "border-surface-border bg-white text-text-secondary hover:bg-brand-soft/70"
                )}
                onClick={() => setExportMode("bulk")}
                type="button"
              >
                Bulk (ZIP)
              </button>
            </div>

            {exportMode === "bulk" ? (
              <div className="mt-4 rounded-xl border border-surface-border bg-white p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-ink">Clients</p>
                  <button
                    className="focus-ring min-h-10 rounded-lg border border-surface-border px-2.5 py-1.5 text-[11px] font-semibold text-text-secondary hover:bg-brand-soft"
                    onClick={toggleAllClients}
                    type="button"
                  >
                    {selectedClientIds.length === clients.length ? "Clear all" : "Select all"}
                  </button>
                </div>

                {clientsLoading ? (
                  <p className="text-xs text-text-secondary">Loading clients...</p>
                ) : clients.length === 0 ? (
                  <p className="text-xs text-text-secondary">No clients found for this workspace.</p>
                ) : (
                  <div className="max-h-44 space-y-1 overflow-y-auto pr-1">
                    {clients.map((clientEntry) => {
                      const checked = selectedClientIds.includes(clientEntry.id);
                      return (
                        <label
                          className={cn(
                            "flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5",
                            checked ? "border-brand/35 bg-brand-soft" : "border-surface-border hover:bg-brand-soft/60"
                          )}
                          key={clientEntry.id}
                        >
                          <input
                            checked={checked}
                            className="h-4 w-4 accent-brand"
                            onChange={() => toggleClient(clientEntry.id)}
                            type="checkbox"
                          />
                          <span className="truncate text-xs font-medium text-ink">{clientEntry.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}

            {error ? (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
            ) : null}
            {lastSuccess ? (
              <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{lastSuccess}</p>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] text-text-secondary">
                {exportMode === "bulk"
                  ? "Bulk export generates one file per selected client and packs them into ZIP."
                  : `Export scope uses ${clientId ? "selected client filter" : "current workspace filter"}.`}
              </p>
              <button
                className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isPending}
                onClick={handleExport}
                type="button"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {isPending ? "Preparing..." : "Download"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
