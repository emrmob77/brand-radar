"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { HallucinationRiskLevel, HallucinationRow } from "@/app/(dashboard)/actions/hallucinations";

type PlatformRiskChartProps = {
  rows: HallucinationRow[];
};

type RiskFilter = "all" | HallucinationRiskLevel;

const riskColors: Record<HallucinationRiskLevel, string> = {
  critical: "#ef4444",
  high: "#f59e0b",
  medium: "#0ea5e9",
  low: "#22c55e"
};

export function PlatformRiskChart({ rows }: PlatformRiskChartProps) {
  const [platformFilter, setPlatformFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");

  const platformOptions = useMemo(() => {
    return Array.from(new Set(rows.map((row) => row.platform))).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const platformMatch = platformFilter === "all" ? true : row.platform === platformFilter;
      const riskMatch = riskFilter === "all" ? true : row.riskLevel === riskFilter;
      return platformMatch && riskMatch;
    });
  }, [platformFilter, riskFilter, rows]);

  const chartData = useMemo(() => {
    const grouped = new Map<
      string,
      {
        platform: string;
        critical: number;
        high: number;
        medium: number;
        low: number;
      }
    >();

    for (const row of filteredRows) {
      const bucket = grouped.get(row.platform) ?? {
        platform: row.platform,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      };
      bucket[row.riskLevel] += 1;
      grouped.set(row.platform, bucket);
    }

    return [...grouped.values()].sort((a, b) => b.critical + b.high + b.medium + b.low - (a.critical + a.high + a.medium + a.low));
  }, [filteredRows]);

  const riskSummary = useMemo(() => {
    return {
      critical: filteredRows.filter((row) => row.riskLevel === "critical").length,
      high: filteredRows.filter((row) => row.riskLevel === "high").length,
      medium: filteredRows.filter((row) => row.riskLevel === "medium").length,
      low: filteredRows.filter((row) => row.riskLevel === "low").length
    };
  }, [filteredRows]);

  return (
    <section className="surface-panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-ink">Platform Risk Distribution</h2>
          <p className="mt-1 text-sm text-text-secondary">Filter by platform and risk level to isolate unstable AI channels.</p>
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

      <div className="mt-4 h-[280px] w-full">
        <ResponsiveContainer>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="platform" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="critical" fill={riskColors.critical} stackId="risk" />
            <Bar dataKey="high" fill={riskColors.high} stackId="risk" />
            <Bar dataKey="medium" fill={riskColors.medium} stackId="risk" />
            <Bar dataKey="low" fill={riskColors.low} stackId="risk" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 font-semibold text-red-700">Critical: {riskSummary.critical}</p>
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 font-semibold text-amber-700">High: {riskSummary.high}</p>
        <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 font-semibold text-sky-700">Medium: {riskSummary.medium}</p>
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 font-semibold text-emerald-700">Low: {riskSummary.low}</p>
      </div>
    </section>
  );
}
