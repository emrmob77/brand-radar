"use client";

import { memo } from "react";
import { Cell, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis, ResponsiveContainer } from "recharts";

type AuthorityPoint = {
  domain: string;
  authority: number;
  citations: number;
  sourceType: string;
};

type AuthorityMapProps = {
  points: AuthorityPoint[];
};

const palette = ["#376df6", "#22c55e", "#f59e0b", "#ef4444", "#7c3aed", "#0891b2"];

function AuthorityMapComponent({ points }: AuthorityMapProps) {
  if (points.length === 0) {
    return <p className="mt-4 text-sm text-text-secondary">No authority map data available for the selected range.</p>;
  }

  return (
    <div className="mt-4 h-[320px] w-full rounded-2xl border border-surface-border bg-white p-3">
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 18, right: 16, bottom: 14, left: 10 }}>
          <XAxis dataKey="authority" domain={[0, 100]} name="Authority" type="number" />
          <YAxis dataKey="citations" name="Citations" type="number" />
          <ZAxis dataKey="citations" range={[60, 420]} />
          <Tooltip
            cursor={{ strokeDasharray: "4 4" }}
            labelFormatter={(_value, payload) => {
              const row = payload?.[0]?.payload as AuthorityPoint | undefined;
              return row?.domain ?? "";
            }}
          />
          <Scatter animationDuration={220} data={points} name="Sources">
            {points.map((point, index) => (
              <Cell fill={palette[index % palette.length] ?? "#376df6"} key={`${point.domain}-${point.sourceType}`} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

export const AuthorityMap = memo(AuthorityMapComponent);
