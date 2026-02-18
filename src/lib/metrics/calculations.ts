export function percentageChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function signedNumber(value: number, digits = 1) {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}`;
}

export function signedInteger(value: number) {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${Math.round(value)}`;
}

export function calculateAISoV(clientMentions: number, totalMentions: number) {
  if (totalMentions === 0) return 0;
  return (clientMentions / totalMentions) * 100;
}

export function calculateSentimentHealth(sentimentScores: Array<number | null>) {
  const validScores = sentimentScores.filter((score): score is number => typeof score === "number");
  if (validScores.length === 0) return 0;
  const average = validScores.reduce((sum, value) => sum + value, 0) / validScores.length;
  return ((average + 1) / 2) * 100;
}

export function calculateEstimatedTrafficValue(authorityScores: Array<number | null>) {
  const highAuthorityCount = authorityScores.filter((score): score is number => typeof score === "number" && score >= 70).length;
  return highAuthorityCount * 5;
}

export function buildSparkline(current: number, previous: number) {
  const midOne = previous + (current - previous) * 0.35;
  const midTwo = previous + (current - previous) * 0.7;
  return [previous, midOne, midTwo, current];
}
