"use client";

import { Legend, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";

export type CompetitiveRadarSeries = {
  key: string;
  label: string;
  color: string;
};

export type CompetitiveRadarPoint = {
  metric: string;
  [seriesKey: string]: string | number;
};

type CompetitiveRadarProps = {
  data: CompetitiveRadarPoint[];
  series: CompetitiveRadarSeries[];
};

export function CompetitiveRadar({ data, series }: CompetitiveRadarProps) {
  return (
    <section className="surface-panel p-6">
      <h2 className="text-lg font-bold text-ink">Competitive Landscape Radar</h2>
      <div className="mt-5 h-[340px] w-full">
        <ResponsiveContainer>
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" />
            <PolarRadiusAxis angle={90} domain={[0, 100]} />
            {series.map((item) => (
              <Radar
                dataKey={item.key}
                fill={item.color}
                fillOpacity={0.12}
                key={item.key}
                name={item.label}
                stroke={item.color}
                strokeWidth={2}
              />
            ))}
            <Tooltip />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

