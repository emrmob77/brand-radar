import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { DashboardHeader } from "@/components/layout/geo-shell";

const clients = [
  { name: "Global Motors", vertical: "Automotive", score: 84, trend: "+6.2%", status: "Healthy" },
  { name: "Nordic Power", vertical: "Energy", score: 71, trend: "+2.8%", status: "Stable" },
  { name: "Helios Finance", vertical: "Fintech", score: 65, trend: "-1.4%", status: "Watch" },
  { name: "Apex Logistics", vertical: "Transportation", score: 76, trend: "+4.1%", status: "Healthy" },
  { name: "Zenith Health", vertical: "Healthcare", score: 69, trend: "+1.3%", status: "Stable" },
  { name: "Vertex Cloud", vertical: "Technology", score: 80, trend: "+5.6%", status: "Healthy" }
];

export default function ClientsPage() {
  return (
    <div className="mx-auto w-full max-w-[1320px]">
      <DashboardHeader
        title="Client Portfolio"
        description="Track performance, risk posture, and strategic momentum across all managed brands."
        actions={
          <Link href="/add-client" className="focus-ring inline-flex items-center gap-2 rounded-xl bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-brand-600">
            <Plus className="h-4 w-4" />
            Add Client
          </Link>
        }
      />

      <section className="surface-panel p-4 md:p-5">
        <label className="sr-only" htmlFor="client-search">Search Clients</label>
        <div className="flex items-center gap-2 rounded-xl border border-surface-border bg-white px-3 py-2">
          <Search className="h-4 w-4 text-text-secondary" />
          <input
            className="w-full bg-transparent text-sm text-ink placeholder:text-text-secondary focus:outline-none"
            id="client-search"
            placeholder="Search by company, domain, or sector"
            type="text"
          />
        </div>
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {clients.map((client) => (
          <article key={client.name} className="surface-panel p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-ink">{client.name}</h2>
                <p className="text-sm text-text-secondary">{client.vertical}</p>
              </div>
              <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand">{client.status}</span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-surface-border bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">GEO Score</p>
                <p className="mt-1 text-2xl font-extrabold text-ink">{client.score}</p>
              </div>
              <div className="rounded-xl border border-surface-border bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">30D Trend</p>
                <p className="mt-1 text-2xl font-extrabold text-brand">{client.trend}</p>
              </div>
            </div>

            <button className="focus-ring mt-5 w-full rounded-xl border border-surface-border bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-brand-soft" type="button">
              Open Intelligence View
            </button>
          </article>
        ))}
      </section>
    </div>
  );
}
