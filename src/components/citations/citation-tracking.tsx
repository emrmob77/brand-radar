"use client";

import { memo } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type TrendRow = {
  date: string;
  label: string;
  gained: number;
  lost: number;
};

type CitationTrackingProps = {
  rows: TrendRow[];
  gainedCount: number;
  lostCount: number;
};

function CitationTrackingComponent({ rows, gainedCount, lostCount }: CitationTrackingProps) {
  return (
    <section className="surface-panel p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-ink">Citation Tracking</h2>
          <p className="text-sm text-text-secondary">Gained vs lost citation trend for selected date range.</p>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-700">+{gainedCount} gained</span>
          <span className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 font-semibold text-red-700">-{lostCount} lost</span>
        </div>
      </div>

      <div className="mt-5 h-[300px] w-full">
        <ResponsiveContainer>
          <BarChart data={rows}>
            <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 4" />
            <XAxis dataKey="label" minTickGap={18} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar animationDuration={220} dataKey="gained" fill="#22c55e" name="Gained" radius={[4, 4, 0, 0]} />
            <Bar animationDuration={220} dataKey="lost" fill="#ef4444" name="Lost" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export const CitationTracking = memo(CitationTrackingComponent);
