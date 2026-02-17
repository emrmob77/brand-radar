"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

type SentimentGaugeProps = {
  score: number;
};

function clampScore(score: number) {
  return Math.max(-1, Math.min(1, score));
}

export function SentimentGauge({ score }: SentimentGaugeProps) {
  const safeScore = clampScore(score);
  const angle = useMemo(() => safeScore * 90, [safeScore]);
  const scoreLabel = useMemo(() => safeScore.toFixed(2), [safeScore]);

  return (
    <div className="rounded-2xl border border-surface-border bg-white p-4">
      <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-text-secondary">Sentiment Gauge</p>
      <div className="relative mt-3 grid place-items-center">
        <svg aria-label="Sentiment gauge" className="h-[180px] w-[280px]" role="img" viewBox="0 0 280 180">
          <defs>
            <linearGradient id="sentimentGaugeGradient" x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>
          <path d="M 40 140 A 100 100 0 0 1 240 140" fill="none" stroke="url(#sentimentGaugeGradient)" strokeLinecap="round" strokeWidth="14" />
          <path d="M 40 140 A 100 100 0 0 1 240 140" fill="none" stroke="#e2e8f0" strokeDasharray="2 8" strokeLinecap="round" strokeWidth="1.5" />
          <circle cx="140" cy="140" fill="#0f172a" r="7" />
        </svg>

        <motion.div
          animate={{ rotate: angle }}
          className="absolute bottom-[36px] left-1/2 h-[70px] w-[2px] origin-bottom bg-ink"
          initial={{ rotate: -90 }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-text-secondary">
        <span>-1.00</span>
        <span className="text-base font-semibold text-ink">{scoreLabel}</span>
        <span>+1.00</span>
      </div>
    </div>
  );
}

