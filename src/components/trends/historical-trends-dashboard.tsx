"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { memo, useMemo, useState } from "react";
import type { HistoricalTrendsPayload, TrendGranularity } from "@/app/(dashboard)/actions/historical-trends";

type HistoricalTrendsDashboardProps = {
  clientId: string | null;
  payload: HistoricalTrendsPayload;
};

function heatColor(intensity: number) {
  if (intensity >= 0.8) return "bg-brand";
  if (intensity >= 0.6) return "bg-brand/80";
  if (intensity >= 0.4) return "bg-brand/60";
  if (intensity >= 0.2) return "bg-brand/35";
  if (intensity > 0) return "bg-brand-soft";
  return "bg-slate-100";
}

function HistoricalTrendsDashboardComponent({ clientId, payload }: HistoricalTrendsDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [from, setFrom] = useState(payload.range.from);
  const [to, setTo] = useState(payload.range.to);
  const [compareFrom, setCompareFrom] = useState(payload.range.compareFrom);
  const [compareTo, setCompareTo] = useState(payload.range.compareTo);
  const [granularity, setGranularity] = useState<TrendGranularity>(payload.granularity);

  const heatWeeks = useMemo(() => {
    const weeks: typeof payload.heatmap[] = [];
    payload.heatmap.forEach((cell, index) => {
      const weekIndex = Math.floor(index / 7);
      const week = weeks[weekIndex] ?? [];
      week.push(cell);
      weeks[weekIndex] = week;
    });
    return weeks;
  }, [payload]);

  function applyFilters() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", from);
    params.set("to", to);
    params.set("compareFrom", compareFrom);
    params.set("compareTo", compareTo);
    params.set("granularity", granularity);
    if (clientId) {
      params.set("clientId", clientId);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <>
      <section className="surface-panel p-5">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs font-semibold text-text-secondary">
            From
            <input className="focus-ring mt-1 block rounded-xl border border-surface-border bg-white px-3 py-2 text-sm text-ink" onChange={(event) => setFrom(event.target.value)} type="date" value={from} />
          </label>
          <label className="text-xs font-semibold text-text-secondary">
            To
            <input className="focus-ring mt-1 block rounded-xl border border-surface-border bg-white px-3 py-2 text-sm text-ink" onChange={(event) => setTo(event.target.value)} type="date" value={to} />
          </label>
          <label className="text-xs font-semibold text-text-secondary">
            Compare From
            <input className="focus-ring mt-1 block rounded-xl border border-surface-border bg-white px-3 py-2 text-sm text-ink" onChange={(event) => setCompareFrom(event.target.value)} type="date" value={compareFrom} />
          </label>
          <label className="text-xs font-semibold text-text-secondary">
            Compare To
            <input className="focus-ring mt-1 block rounded-xl border border-surface-border bg-white px-3 py-2 text-sm text-ink" onChange={(event) => setCompareTo(event.target.value)} type="date" value={compareTo} />
          </label>
          <label className="text-xs font-semibold text-text-secondary">
            Aggregation
            <select className="focus-ring mt-1 block rounded-xl border border-surface-border bg-white px-3 py-2 text-sm text-ink" onChange={(event) => setGranularity(event.target.value as TrendGranularity)} value={granularity}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
          <button className="focus-ring rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-600" onClick={applyFilters} type="button">
            Apply
          </button>
        </div>
      </section>

      <section className="mt-6 surface-panel p-5">
        <h2 className="text-lg font-bold text-ink">Calendar Heatmap (Last 90 Days)</h2>
        <p className="mt-1 text-sm text-text-secondary">Combined mentions and citations activity intensity.</p>
        <div className="mt-4 overflow-x-auto">
          <div className="inline-grid grid-flow-col gap-1">
            {heatWeeks.map((week, index) => (
              <div className="grid grid-rows-7 gap-1" key={`week-${index}`}>
                {week.map((cell) => (
                  <div
                    className={`h-3 w-3 rounded-sm ${heatColor(cell.intensity)}`}
                    key={cell.date}
                    title={`${cell.date}: ${cell.value} signals`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 surface-panel p-5">
        <h2 className="text-lg font-bold text-ink">Trend Series</h2>
        <p className="mt-1 text-sm text-text-secondary">Mentions, citations, sentiment, and moving averages (short and long window).</p>
        <div className="mt-4 h-[340px] w-full">
          <ResponsiveContainer>
            <LineChart data={payload.series}>
              <XAxis dataKey="label" minTickGap={20} tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} yAxisId="volume" />
              <YAxis domain={[-1, 1]} tick={{ fontSize: 11 }} yAxisId="sentiment" orientation="right" />
              <Tooltip />
              <Line animationDuration={220} dataKey="mentions" dot={false} stroke="#376df6" strokeWidth={2} yAxisId="volume" />
              <Line animationDuration={220} dataKey="citations" dot={false} stroke="#10b981" strokeWidth={2} yAxisId="volume" />
              <Line animationDuration={220} dataKey="sentiment" dot={false} stroke="#f59e0b" strokeWidth={2} yAxisId="sentiment" />
              <Line animationDuration={220} dataKey="mentionsMovingShort" dot={false} stroke="#1d4ed8" strokeDasharray="6 4" strokeWidth={1.8} yAxisId="volume" />
              <Line animationDuration={220} dataKey="mentionsMovingLong" dot={false} stroke="#0f172a" strokeDasharray="4 3" strokeWidth={1.5} yAxisId="volume" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {payload.comparison.map((metric) => (
          <article className="surface-panel p-4" key={metric.label}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">{metric.label}</p>
            <div className="mt-2 flex items-end justify-between">
              <p className="text-2xl font-extrabold text-ink">{metric.current}</p>
              <p className={`text-xs font-semibold ${metric.change >= 0 ? "text-brand" : "text-critical"}`}>
                {metric.change >= 0 ? "+" : ""}
                {metric.change}% vs previous
              </p>
            </div>
            <p className="mt-1 text-xs text-text-secondary">Previous range: {metric.previous}</p>
          </article>
        ))}
      </section>
    </>
  );
}

export const HistoricalTrendsDashboard = memo(HistoricalTrendsDashboardComponent);
