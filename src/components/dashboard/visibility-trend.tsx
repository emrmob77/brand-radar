"use client";

import { memo, useMemo, useRef, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { selectVisibleTrendData } from "@/lib/dashboard/visibility-zoom";
import { cn } from "@/lib/utils";
import type { VisibilityTrendPayload } from "@/app/(dashboard)/actions/visibility-trend";

type VisibilityTrendProps = {
  payload: VisibilityTrendPayload;
};

function VisibilityTrendComponent({ payload }: VisibilityTrendProps) {
  const pinchDistanceRef = useRef<number | null>(null);
  const allSlugs = useMemo(() => payload.platforms.map((platform) => platform.slug), [payload.platforms]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(allSlugs);
  const [zoomLevel, setZoomLevel] = useState<1 | 2 | 3>(1);

  const visibleData = useMemo(() => selectVisibleTrendData(payload.data, zoomLevel), [payload.data, zoomLevel]);

  function touchDistance(touches: React.TouchList) {
    const first = touches[0];
    const second = touches[1];
    if (!first || !second) {
      return null;
    }

    const dx = second.clientX - first.clientX;
    const dy = second.clientY - first.clientY;
    return Math.hypot(dx, dy);
  }

  function handleChartTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    if (event.touches.length < 2) {
      return;
    }

    pinchDistanceRef.current = touchDistance(event.touches);
  }

  function handleChartTouchMove(event: React.TouchEvent<HTMLDivElement>) {
    if (event.touches.length < 2 || pinchDistanceRef.current === null) {
      return;
    }

    const currentDistance = touchDistance(event.touches);
    if (!currentDistance) {
      return;
    }

    const delta = currentDistance - pinchDistanceRef.current;
    if (Math.abs(delta) < 14) {
      return;
    }

    if (delta > 0) {
      setZoomLevel((prev) => (prev < 3 ? ((prev + 1) as 1 | 2 | 3) : prev));
    } else {
      setZoomLevel((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : prev));
    }

    pinchDistanceRef.current = currentDistance;
  }

  function handleChartTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    if (event.touches.length < 2) {
      pinchDistanceRef.current = null;
    }
  }

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

      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-[11px] text-text-secondary">Pinch or tap to zoom timeline</p>
        <div className="inline-flex items-center gap-1 rounded-xl border border-surface-border bg-white p-1">
          {[1, 2, 3].map((level) => (
            <button
              className={cn(
                "focus-ring min-h-9 rounded-lg px-2.5 py-1 text-[11px] font-semibold",
                zoomLevel === level ? "bg-brand text-white" : "text-text-secondary hover:bg-brand-soft"
              )}
              key={level}
              onClick={() => setZoomLevel(level as 1 | 2 | 3)}
              type="button"
            >
              {level}x
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 h-[310px] w-full" onTouchEnd={handleChartTouchEnd} onTouchMove={handleChartTouchMove} onTouchStart={handleChartTouchStart}>
        <ResponsiveContainer>
          <LineChart data={visibleData}>
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
                  animationDuration={220}
                  dataKey={platform.slug}
                  dot={false}
                  isAnimationActive={selectedPlatforms.length <= 3}
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

export const VisibilityTrend = memo(VisibilityTrendComponent);
