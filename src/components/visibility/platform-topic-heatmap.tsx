"use client";

import { useMemo } from "react";
import type { PlatformTopicHeatmapPayload } from "@/app/(dashboard)/actions/ai-visibility";

type PlatformTopicHeatmapProps = {
  payload: PlatformTopicHeatmapPayload;
};

function getCellColor(value: number) {
  const clamped = Math.max(0, Math.min(100, value));
  const lightness = 96 - clamped * 0.45;
  return `hsl(214 84% ${lightness}%)`;
}

export function PlatformTopicHeatmap({ payload }: PlatformTopicHeatmapProps) {
  const byTopic = useMemo(() => {
    const map = new Map<string, Map<string, { value: number; count: number }>>();
    for (const topic of payload.topics) {
      map.set(topic, new Map());
    }

    for (const cell of payload.cells) {
      const topicRow = map.get(cell.topic);
      if (!topicRow) continue;
      topicRow.set(cell.platformSlug, { value: cell.value, count: cell.count });
    }

    return map;
  }, [payload.cells, payload.topics]);

  if (payload.topics.length === 0 || payload.platforms.length === 0) {
    return <p className="mt-5 text-sm text-text-secondary">Not enough data to render the heatmap.</p>;
  }

  return (
    <div className="mt-5 overflow-x-auto">
      <table className="w-full min-w-[720px] border-separate border-spacing-2 text-sm">
        <thead>
          <tr>
            <th className="px-2 py-2 text-left text-xs uppercase tracking-[0.14em] text-text-secondary">Topic</th>
            {payload.platforms.map((platform) => (
              <th className="px-2 py-2 text-center text-xs uppercase tracking-[0.14em] text-text-secondary" key={platform.slug}>
                {platform.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {payload.topics.map((topic) => (
            <tr key={topic}>
              <td className="rounded-lg border border-surface-border bg-white px-3 py-2 font-semibold text-ink">{topic}</td>
              {payload.platforms.map((platform) => {
                const cell = byTopic.get(topic)?.get(platform.slug) ?? { value: 0, count: 0 };

                return (
                  <td
                    className="rounded-lg border border-surface-border px-3 py-2 text-center font-semibold text-ink"
                    key={`${topic}-${platform.slug}`}
                    style={{ background: getCellColor(cell.value) }}
                    title={`${platform.name} x ${topic}: ${cell.count} mentions (${cell.value}%)`}
                  >
                    {cell.value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
