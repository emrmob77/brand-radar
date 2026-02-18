export type MentionRiskLevel = "low" | "medium" | "high" | "critical";

export type MentionRiskInput = {
  sentiment: "positive" | "neutral" | "negative";
  sentimentScore?: number | null;
};

export type MentionIdentity = {
  id: string;
};

export function deriveMentionRisk(row: MentionRiskInput): MentionRiskLevel {
  const fallbackScore = row.sentiment === "positive" ? 0.45 : row.sentiment === "neutral" ? 0 : -0.45;
  const score = typeof row.sentimentScore === "number" ? row.sentimentScore : fallbackScore;

  if (score <= -0.65) return "critical";
  if (score <= -0.35 || row.sentiment === "negative") return "high";
  if (score <= 0.2) return "medium";
  return "low";
}

export function mergeUniqueById<T extends MentionIdentity>(rows: T[]) {
  const seen = new Set<string>();
  const output: T[] = [];

  for (const row of rows) {
    if (seen.has(row.id)) {
      continue;
    }
    seen.add(row.id);
    output.push(row);
  }

  return output;
}
