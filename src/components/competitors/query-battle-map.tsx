"use client";

import { useMemo, useState } from "react";
import type { BattleBrand, BattleRow } from "@/app/(dashboard)/actions/competitor-analysis";

type QueryBattleMapProps = {
  brands: BattleBrand[];
  rows: BattleRow[];
};

function getHeatColor(value: number, isClient: boolean) {
  const normalized = Math.max(0, Math.min(100, value));
  const lightness = 96 - normalized * 0.46;
  return isClient ? `hsl(218 92% ${lightness}%)` : `hsl(21 90% ${lightness}%)`;
}

export function QueryBattleMap({ brands, rows }: QueryBattleMapProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const categories = useMemo(() => Array.from(new Set(rows.map((row) => row.category))), [rows]);
  const filteredRows = useMemo(
    () => rows.filter((row) => (selectedCategory === "all" ? true : row.category === selectedCategory)),
    [rows, selectedCategory]
  );

  if (brands.length === 0 || rows.length === 0) {
    return <p className="mt-4 text-sm text-text-secondary">Not enough data to render query battle map.</p>;
  }

  return (
    <>
      <div className="mt-4">
        <label className="mr-2 text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary" htmlFor="battle-map-category">
          Category
        </label>
        <select
          className="focus-ring rounded-xl border border-surface-border bg-white px-3 py-2 text-xs text-ink"
          id="battle-map-category"
          onChange={(event) => setSelectedCategory(event.target.value)}
          value={selectedCategory}
        >
          <option value="all">All</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[860px] border-separate border-spacing-2 text-sm">
          <thead>
            <tr>
              <th className="px-2 py-2 text-left text-xs uppercase tracking-[0.14em] text-text-secondary">Query</th>
              {brands.map((brand) => (
                <th className="px-2 py-2 text-center text-xs uppercase tracking-[0.14em] text-text-secondary" key={brand.key}>
                  {brand.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={`${row.category}-${row.query}`}>
                <td className="rounded-lg border border-surface-border bg-white px-3 py-2">
                  <p className="font-semibold text-ink">{row.query}</p>
                  <p className="mt-1 text-[11px] text-text-secondary">{row.category}</p>
                </td>
                {brands.map((brand) => {
                  const value = row.values[brand.key] ?? 0;

                  return (
                    <td
                      className="rounded-lg border border-surface-border px-3 py-2 text-center font-semibold text-ink"
                      key={`${row.query}-${brand.key}`}
                      style={{ background: getHeatColor(value, brand.isClient) }}
                      title={`${brand.label}: ${value}`}
                    >
                      {Math.round(value)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

