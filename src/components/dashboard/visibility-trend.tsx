"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import type { VisibilityTrendPayload } from "@/app/(dashboard)/actions/visibility-trend";

type VisibilityTrendProps = {
  payload: VisibilityTrendPayload;
};

export function VisibilityTrend({ payload }: VisibilityTrendProps) {
  const allSlugs = useMemo(() => payload.platforms.map((platform) => platform.slug), [payload.platforms]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(allSlugs);

  function togglePlatform(slug: string) {
    setSelectedPlatforms((prev) => {
      if (prev.includes(slug)) {
        return prev.length > 1 ? prev.filter((item) => item !== slug) : prev;
      }
      return [...prev, slug];
    });
  }

  return (
    <div className="mt-5 rounded-2xl border border-surface-border bg-[#fbfbfc] p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        {payload.platforms.map((platform) => {
          const active = selectedPlatforms.includes(platform.slug);

          return (
            <button
              className={cn(
                "focus-ring inline-flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-xs font-semibold",
                active ? "border-transparent text-white" : "border-surface-border bg-white text-ink"
              )}
              key={platform.slug}
              onClick={() => togglePlatform(platform.slug)}
              style={active ? { backgroundColor: platform.color } : undefined}
              type="button"
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: active ? "#fff" : platform.color }} />
              {platform.name}
            </button>
          );
        })}
      </div>

      <div className="mt-5 h-[310px] w-full">
        <ResponsiveContainer>
          <LineChart data={payload.data}>
            <CartesianGrid stroke="#e4e7eb" strokeDasharray="3 4" />
            <XAxis dataKey="label" minTickGap={20} stroke="#8b9097" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} stroke="#8b9097" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                borderColor: "#d5d9df",
                fontSize: 12
              }}
            />
            {payload.platforms
              .filter((platform) => selectedPlatforms.includes(platform.slug))
              .map((platform) => (
                <Line
                  dataKey={platform.slug}
                  dot={false}
                  key={platform.slug}
                  name={platform.slug}
                  stroke={platform.color}
                  strokeWidth={2.2}
                  type="monotone"
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
