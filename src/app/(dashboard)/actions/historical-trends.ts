"use server";

import {
  addDays,
  differenceInCalendarDays,
  endOfDay,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays
} from "date-fns";
import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type TrendGranularity = "daily" | "weekly" | "monthly";

export type TrendPoint = {
  key: string;
  label: string;
  date: string;
  mentions: number;
  citations: number;
  sentiment: number;
  mentionsMovingShort: number;
  mentionsMovingLong: number;
  citationsMovingShort: number;
  citationsMovingLong: number;
};

export type HeatmapCell = {
  date: string;
  value: number;
  intensity: number;
};

export type TrendComparisonMetric = {
  label: string;
  current: number;
  previous: number;
  change: number;
};

export type HistoricalTrendsPayload = {
  granularity: TrendGranularity;
  series: TrendPoint[];
  heatmap: HeatmapCell[];
  comparison: TrendComparisonMetric[];
  range: {
    from: string;
    to: string;
    compareFrom: string;
    compareTo: string;
  };
};

type MentionRow = {
  detected_at: string;
  sentiment_score: number | null;
};

type CitationRow = {
  detected_at: string;
};

function normalizeDateInput(value: string | undefined, fallback: Date) {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed;
}

function bucketStart(date: Date, granularity: TrendGranularity) {
  if (granularity === "weekly") return startOfWeek(date, { weekStartsOn: 1 });
  if (granularity === "monthly") return startOfMonth(date);
  return startOfDay(date);
}

function bucketKey(date: Date, granularity: TrendGranularity) {
  const start = bucketStart(date, granularity);
  return format(start, "yyyy-MM-dd");
}

function bucketLabel(date: Date, granularity: TrendGranularity) {
  if (granularity === "weekly") return `Week of ${format(date, "MMM dd")}`;
  if (granularity === "monthly") return format(date, "MMM yyyy");
  return format(date, "MMM dd");
}

function calculateMovingAverage(values: number[], windowSize: number) {
  return values.map((_, index) => {
    const start = Math.max(0, index - windowSize + 1);
    const subset = values.slice(start, index + 1);
    const avg = subset.reduce((sum, value) => sum + value, 0) / Math.max(1, subset.length);
    return Number(avg.toFixed(2));
  });
}

function percentageChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / Math.abs(previous)) * 100).toFixed(1));
}

function granularityWindowShort(granularity: TrendGranularity) {
  if (granularity === "weekly") return 4;
  if (granularity === "monthly") return 3;
  return 7;
}

function granularityWindowLong(granularity: TrendGranularity) {
  if (granularity === "weekly") return 12;
  if (granularity === "monthly") return 6;
  return 30;
}

function buildSeries(
  mentions: MentionRow[],
  citations: CitationRow[],
  from: Date,
  to: Date,
  granularity: TrendGranularity
): TrendPoint[] {
  const mentionBuckets = new Map<string, { mentions: number; sentimentSum: number; sentimentCount: number }>();
  const citationBuckets = new Map<string, number>();

  for (const mention of mentions) {
    const date = new Date(mention.detected_at);
    const key = bucketKey(date, granularity);
    const bucket = mentionBuckets.get(key) ?? { mentions: 0, sentimentSum: 0, sentimentCount: 0 };
    bucket.mentions += 1;
    if (typeof mention.sentiment_score === "number") {
      bucket.sentimentSum += mention.sentiment_score;
      bucket.sentimentCount += 1;
    }
    mentionBuckets.set(key, bucket);
  }

  for (const citation of citations) {
    const date = new Date(citation.detected_at);
    const key = bucketKey(date, granularity);
    citationBuckets.set(key, (citationBuckets.get(key) ?? 0) + 1);
  }

  const rows: TrendPoint[] = [];
  let cursor = bucketStart(from, granularity);
  const limit = endOfDay(to);
  while (cursor <= limit) {
    const key = bucketKey(cursor, granularity);
    const mentionBucket = mentionBuckets.get(key) ?? { mentions: 0, sentimentSum: 0, sentimentCount: 0 };
    const citationCount = citationBuckets.get(key) ?? 0;
    const sentiment = mentionBucket.sentimentCount === 0 ? 0 : mentionBucket.sentimentSum / mentionBucket.sentimentCount;

    rows.push({
      key,
      label: bucketLabel(cursor, granularity),
      date: key,
      mentions: mentionBucket.mentions,
      citations: citationCount,
      sentiment: Number(sentiment.toFixed(2)),
      mentionsMovingShort: 0,
      mentionsMovingLong: 0,
      citationsMovingShort: 0,
      citationsMovingLong: 0
    });

    if (granularity === "daily") {
      cursor = addDays(cursor, 1);
    } else if (granularity === "weekly") {
      cursor = addDays(cursor, 7);
    } else {
      const next = new Date(cursor);
      next.setMonth(next.getMonth() + 1, 1);
      cursor = startOfMonth(next);
    }
  }

  const mentionsValues = rows.map((row) => row.mentions);
  const citationValues = rows.map((row) => row.citations);
  const mentionsShort = calculateMovingAverage(mentionsValues, granularityWindowShort(granularity));
  const mentionsLong = calculateMovingAverage(mentionsValues, granularityWindowLong(granularity));
  const citationsShort = calculateMovingAverage(citationValues, granularityWindowShort(granularity));
  const citationsLong = calculateMovingAverage(citationValues, granularityWindowLong(granularity));

  return rows.map((row, index) => ({
    ...row,
    mentionsMovingShort: mentionsShort[index] ?? 0,
    mentionsMovingLong: mentionsLong[index] ?? 0,
    citationsMovingShort: citationsShort[index] ?? 0,
    citationsMovingLong: citationsLong[index] ?? 0
  }));
}

function buildHeatmap(mentions: MentionRow[], citations: CitationRow[]): HeatmapCell[] {
  const from = subDays(startOfDay(new Date()), 89);
  const bucket = new Map<string, number>();

  for (const row of mentions) {
    const key = format(startOfDay(new Date(row.detected_at)), "yyyy-MM-dd");
    bucket.set(key, (bucket.get(key) ?? 0) + 1);
  }

  for (const row of citations) {
    const key = format(startOfDay(new Date(row.detected_at)), "yyyy-MM-dd");
    bucket.set(key, (bucket.get(key) ?? 0) + 1);
  }

  const cells: HeatmapCell[] = [];
  for (let i = 0; i < 90; i += 1) {
    const date = addDays(from, i);
    const key = format(date, "yyyy-MM-dd");
    cells.push({
      date: key,
      value: bucket.get(key) ?? 0,
      intensity: 0
    });
  }

  const maxValue = Math.max(1, ...cells.map((cell) => cell.value));
  return cells.map((cell) => ({ ...cell, intensity: Number((cell.value / maxValue).toFixed(2)) }));
}

function buildComparison(
  currentMentions: MentionRow[],
  currentCitations: CitationRow[],
  previousMentions: MentionRow[],
  previousCitations: CitationRow[]
): TrendComparisonMetric[] {
  const currentSentimentValues = currentMentions
    .map((row) => row.sentiment_score)
    .filter((value): value is number => typeof value === "number");
  const previousSentimentValues = previousMentions
    .map((row) => row.sentiment_score)
    .filter((value): value is number => typeof value === "number");
  const currentSentiment =
    currentSentimentValues.length === 0 ? 0 : currentSentimentValues.reduce((sum, value) => sum + value, 0) / currentSentimentValues.length;
  const previousSentiment =
    previousSentimentValues.length === 0 ? 0 : previousSentimentValues.reduce((sum, value) => sum + value, 0) / previousSentimentValues.length;

  return [
    {
      label: "Mentions",
      current: currentMentions.length,
      previous: previousMentions.length,
      change: percentageChange(currentMentions.length, previousMentions.length)
    },
    {
      label: "Citations",
      current: currentCitations.length,
      previous: previousCitations.length,
      change: percentageChange(currentCitations.length, previousCitations.length)
    },
    {
      label: "Sentiment",
      current: Number(currentSentiment.toFixed(2)),
      previous: Number(previousSentiment.toFixed(2)),
      change: percentageChange(currentSentiment, previousSentiment)
    }
  ];
}

function fallbackPayload(
  from: Date,
  to: Date,
  compareFrom: Date,
  compareTo: Date,
  granularity: TrendGranularity
): HistoricalTrendsPayload {
  const series = buildSeries([], [], from, to, granularity);
  const heatmap = buildHeatmap([], []);

  return {
    granularity,
    series,
    heatmap,
    comparison: [
      { label: "Mentions", current: 0, previous: 0, change: 0 },
      { label: "Citations", current: 0, previous: 0, change: 0 },
      { label: "Sentiment", current: 0, previous: 0, change: 0 }
    ],
    range: {
      from: format(from, "yyyy-MM-dd"),
      to: format(to, "yyyy-MM-dd"),
      compareFrom: format(compareFrom, "yyyy-MM-dd"),
      compareTo: format(compareTo, "yyyy-MM-dd")
    }
  };
}

export async function getHistoricalTrendsPayload(input: {
  clientId: string | null;
  from?: string;
  to?: string;
  compareFrom?: string;
  compareTo?: string;
  granularity?: TrendGranularity;
}): Promise<HistoricalTrendsPayload> {
  const granularity = input.granularity ?? "daily";
  const defaultTo = endOfDay(new Date());
  const defaultFrom = startOfDay(subDays(defaultTo, 89));
  const from = startOfDay(normalizeDateInput(input.from, defaultFrom));
  const to = endOfDay(normalizeDateInput(input.to, defaultTo));

  const rangeDays = Math.max(1, differenceInCalendarDays(to, from) + 1);
  const defaultCompareTo = endOfDay(subDays(from, 1));
  const defaultCompareFrom = startOfDay(subDays(defaultCompareTo, rangeDays - 1));
  const compareFrom = startOfDay(normalizeDateInput(input.compareFrom, defaultCompareFrom));
  const compareTo = endOfDay(normalizeDateInput(input.compareTo, defaultCompareTo));

  const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken || !input.clientId) {
    return fallbackPayload(from, to, compareFrom, compareTo, granularity);
  }

  const supabase = createServerSupabaseClient(accessToken);
  const [currentMentionsResult, currentCitationsResult, previousMentionsResult, previousCitationsResult] = await Promise.all([
    supabase
      .from("mentions")
      .select("detected_at,sentiment_score")
      .eq("client_id", input.clientId)
      .gte("detected_at", from.toISOString())
      .lte("detected_at", to.toISOString()),
    supabase.from("citations").select("detected_at").eq("client_id", input.clientId).gte("detected_at", from.toISOString()).lte("detected_at", to.toISOString()),
    supabase
      .from("mentions")
      .select("detected_at,sentiment_score")
      .eq("client_id", input.clientId)
      .gte("detected_at", compareFrom.toISOString())
      .lte("detected_at", compareTo.toISOString()),
    supabase
      .from("citations")
      .select("detected_at")
      .eq("client_id", input.clientId)
      .gte("detected_at", compareFrom.toISOString())
      .lte("detected_at", compareTo.toISOString())
  ]);

  const currentMentions = (currentMentionsResult.data ?? []) as MentionRow[];
  const currentCitations = (currentCitationsResult.data ?? []) as CitationRow[];
  const previousMentions = (previousMentionsResult.data ?? []) as MentionRow[];
  const previousCitations = (previousCitationsResult.data ?? []) as CitationRow[];

  const series = buildSeries(currentMentions, currentCitations, from, to, granularity);
  const heatmap = buildHeatmap(currentMentions, currentCitations);
  const comparison = buildComparison(currentMentions, currentCitations, previousMentions, previousCitations);

  return {
    granularity,
    series,
    heatmap,
    comparison,
    range: {
      from: format(from, "yyyy-MM-dd"),
      to: format(to, "yyyy-MM-dd"),
      compareFrom: format(compareFrom, "yyyy-MM-dd"),
      compareTo: format(compareTo, "yyyy-MM-dd")
    }
  };
}
