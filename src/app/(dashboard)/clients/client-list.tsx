"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { deleteClientAction } from "@/app/(dashboard)/clients/actions";

type ClientRecord = {
  id: string;
  name: string;
  domain: string;
  logo_url: string | null;
  industry: string;
  health_score: number;
};

type HealthFilter = "all" | "healthy" | "stable" | "watch";

function getHealthStatus(score: number): Exclude<HealthFilter, "all"> {
  if (score >= 80) return "healthy";
  if (score >= 60) return "stable";
  return "watch";
}

function getHealthClasses(status: Exclude<HealthFilter, "all">) {
  if (status === "healthy") return "bg-emerald-100 text-emerald-700";
  if (status === "stable") return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

export function ClientList({ clients }: { clients: ClientRecord[] }) {
  const [rows, setRows] = useState(clients);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<HealthFilter>("all");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);

  const filteredClients = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return rows.filter((client) => {
      const status = getHealthStatus(client.health_score);
      const matchesFilter = filter === "all" ? true : status === filter;
      const matchesQuery =
        normalizedQuery.length === 0
          ? true
          : client.name.toLowerCase().includes(normalizedQuery) ||
            client.domain.toLowerCase().includes(normalizedQuery) ||
            client.industry.toLowerCase().includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });
  }, [filter, query, rows]);

  async function handleDelete(clientId: string) {
    const confirmed = window.confirm("Are you sure you want to delete this client? This action cannot be undone.");
    if (!confirmed) {
      return;
    }

    setDeleteError(null);
    setDeletingClientId(clientId);
    const snapshot = rows;
    setRows((prev) => prev.filter((client) => client.id !== clientId));

    const result = await deleteClientAction(clientId);
    if (!result.ok) {
      setRows(snapshot);
      setDeleteError(result.error ?? "Client could not be deleted.");
    }

    setDeletingClientId(null);
  }

  return (
    <>
      <section className="surface-panel p-4 md:p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <label className="sr-only" htmlFor="client-search">
            Search Clients
          </label>
          <input
            className="focus-ring w-full rounded-xl border border-surface-border bg-white px-3 py-2 text-sm text-ink placeholder:text-text-secondary"
            id="client-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by company, domain, or sector"
            type="text"
            value={query}
          />
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "All" },
              { key: "healthy", label: "Healthy" },
              { key: "stable", label: "Stable" },
              { key: "watch", label: "Watch" }
            ].map((option) => (
              <button
                className={`focus-ring rounded-xl border px-3 py-2 text-xs font-semibold ${
                  filter === option.key ? "border-brand bg-brand text-white" : "border-surface-border bg-white text-ink hover:bg-brand-soft"
                }`}
                key={option.key}
                onClick={() => setFilter(option.key as HealthFilter)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {deleteError ? (
          <article className="surface-panel col-span-full rounded-xl border border-critical/30 bg-critical/10 p-4 text-sm text-critical">{deleteError}</article>
        ) : null}
        {filteredClients.length === 0 ? (
          <article className="surface-panel col-span-full p-6 text-sm text-text-secondary">No client matched your filter.</article>
        ) : (
          filteredClients.map((client) => {
            const healthStatus = getHealthStatus(client.health_score);

            return (
              <article className="surface-panel p-5" key={client.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {client.logo_url ? (
                      <div
                        aria-label={`${client.name} logo`}
                        className="h-10 w-10 rounded-lg border border-surface-border bg-white bg-contain bg-center bg-no-repeat"
                        role="img"
                        style={{ backgroundImage: `url(${client.logo_url})` }}
                      />
                    ) : (
                      <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-soft text-xs font-bold text-ink">
                        {client.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h2 className="text-lg font-bold text-ink">{client.name}</h2>
                      <p className="text-sm text-text-secondary">{client.industry}</p>
                    </div>
                  </div>

                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getHealthClasses(healthStatus)}`}>{healthStatus}</span>
                </div>

                <div className="mt-4 rounded-xl border border-surface-border bg-white p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">Domain</p>
                  <p className="mt-1 text-sm font-medium text-ink">{client.domain}</p>
                </div>

                <div className="mt-3 rounded-xl border border-surface-border bg-white p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">GEO Health Score</p>
                  <p className="mt-1 text-2xl font-extrabold text-ink">{client.health_score}</p>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <Link
                    className="focus-ring inline-flex w-full items-center justify-center rounded-xl border border-surface-border bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-brand-soft"
                    href={`/dashboard?clientId=${encodeURIComponent(client.id)}`}
                  >
                    Open View
                  </Link>
                  <button
                    className="focus-ring rounded-xl border border-critical/20 bg-critical/10 px-3 py-2 text-sm font-semibold text-critical hover:bg-critical/20 disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={deletingClientId === client.id}
                    onClick={() => void handleDelete(client.id)}
                    type="button"
                  >
                    {deletingClientId === client.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </article>
            );
          })
        )}
      </section>
    </>
  );
}
