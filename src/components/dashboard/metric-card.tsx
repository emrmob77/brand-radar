"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type MetricFormat = "percent" | "integer" | "currency" | "score";

type MetricCardProps = {
  title: string;
  value: number;
  change: string;
  positive?: boolean;
  description?: string;
  format?: MetricFormat;
  sparkline?: number[];
  scoreMax?: number;
};

function formatMetricValue(value: number, format: MetricFormat, scoreMax = 100) {
  if (format === "percent") return `${value.toFixed(1)}%`;
  if (format === "currency") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(value);
  }
  if (format === "score") return `${Math.round(value)} / ${scoreMax}`;

  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

function createSparklinePoints(series: number[], width = 120, height = 30) {
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;

  return series
    .map((value, index) => {
      const x = (index / (series.length - 1 || 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");
}

export function MetricCard({
  title,
  value,
  change,
  positive = true,
  description,
  format = "integer",
  sparkline,
  scoreMax = 100
}: MetricCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const formattedValue = useMemo(() => formatMetricValue(displayValue, format, scoreMax), [displayValue, format, scoreMax]);
  const sparklinePoints = useMemo(() => (sparkline && sparkline.length > 1 ? createSparklinePoints(sparkline) : null), [sparkline]);

  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const duration = 700;

    const tick = (time: number) => {
      const progress = Math.min((time - start) / duration, 1);
      setDisplayValue(value * progress);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <motion.article
      animate={{ opacity: 1, y: 0 }}
      className="surface-panel panel-hover stagger-in p-5"
      initial={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.24 }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-text-secondary">{title}</p>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${positive ? "bg-brand-soft text-ink" : "bg-[#f8ebea] text-critical"}`}>
          {positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
          {change}
        </span>
      </div>

      <p className="mt-4 text-3xl font-semibold tracking-tight text-ink">{formattedValue}</p>
      {description ? <p className="mt-1 text-xs text-text-secondary">{description}</p> : null}

      {sparklinePoints ? (
        <div className="mt-4 rounded-xl border border-surface-border bg-white px-2 py-1.5">
          <svg aria-label={`${title} sparkline`} className="h-8 w-full" role="img" viewBox="0 0 120 30">
            <polyline fill="none" points={sparklinePoints} stroke={positive ? "#376df6" : "#ef4444"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
          </svg>
        </div>
      ) : null}
    </motion.article>
  );
}

