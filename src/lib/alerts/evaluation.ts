export type AlertRuleCondition = "above" | "below" | "equals" | "changes_by";
export type AlertRuleMetric = "mentions" | "sentiment" | "citations" | "hallucinations" | "competitor_movement";
export type AlertSeverity = "info" | "warning" | "critical";

export type MetricSnapshot = {
  current: number;
  previous: number;
};

export function evaluateCondition(snapshot: MetricSnapshot, condition: AlertRuleCondition, threshold: number) {
  if (condition === "above") return snapshot.current > threshold;
  if (condition === "below") return snapshot.current < threshold;
  if (condition === "equals") return Math.abs(snapshot.current - threshold) < 0.001;

  const percentChange =
    snapshot.previous === 0
      ? snapshot.current > 0
        ? 100
        : 0
      : ((snapshot.current - snapshot.previous) / Math.abs(snapshot.previous)) * 100;
  return Math.abs(percentChange) >= threshold;
}

export function severityForRule(
  rule: {
    metric: AlertRuleMetric;
  },
  snapshot: MetricSnapshot
): AlertSeverity {
  if (rule.metric === "hallucinations") return "critical";
  if (rule.metric === "sentiment" && snapshot.current < 0) return "critical";

  const delta =
    snapshot.previous === 0
      ? snapshot.current > 0
        ? 100
        : 0
      : Math.abs(((snapshot.current - snapshot.previous) / Math.abs(snapshot.previous)) * 100);
  if (delta >= 50) return "critical";
  if (delta >= 20) return "warning";
  return "info";
}
