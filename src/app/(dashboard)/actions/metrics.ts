"use server";

import { subDays } from "date-fns";
import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/session";
import {
  buildSparkline,
  calculateAISoV,
  calculateEstimatedTrafficValue,
  calculateSentimentHealth,
  percentageChange,
  signedInteger,
  signedNumber
} from "@/lib/metrics/calculations";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type MetricSnapshot = {
  aiSov: number;
  totalCitations: number;
  sentimentHealth: number;
  estimatedTrafficValue: number;
};

export type DashboardMetricCard = {
  label: string;
  value: number;
  format: "percent" | "integer" | "currency" | "score";
  delta: string;
  positive: boolean;
  description: string;
  sparkline: number[];
};

async function getWindowSnapshot(clientId: string | null, fromISO: string, toISO: string): Promise<MetricSnapshot> {
  const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return {
      aiSov: 0,
      totalCitations: 0,
      sentimentHealth: 0,
      estimatedTrafficValue: 0
    };
  }

  const supabase = createServerSupabaseClient(accessToken);

  const mentionsQuery = supabase
    .from("mentions")
    .select("id,sentiment_score,client_id")
    .gte("detected_at", fromISO)
    .lt("detected_at", toISO);

  const citationsQuery = supabase
    .from("citations")
    .select("id,authority_score")
    .gte("detected_at", fromISO)
    .lt("detected_at", toISO);

  const [mentionsResult, citationsResult, totalMentionsResult] = await Promise.all([
    clientId ? mentionsQuery.eq("client_id", clientId) : mentionsQuery,
    clientId ? citationsQuery.eq("client_id", clientId) : citationsQuery,
    supabase.from("mentions").select("*", { count: "exact", head: true }).gte("detected_at", fromISO).lt("detected_at", toISO)
  ]);

  if (mentionsResult.error || citationsResult.error || totalMentionsResult.error) {
    return {
      aiSov: 0,
      totalCitations: 0,
      sentimentHealth: 0,
      estimatedTrafficValue: 0
    };
  }

  const mentions = mentionsResult.data ?? [];
  const citations = citationsResult.data ?? [];
  const totalMentions = totalMentionsResult.count ?? 0;
  const clientMentions = mentions.length;

  return {
    aiSov: calculateAISoV(clientMentions, totalMentions),
    totalCitations: citations.length,
    sentimentHealth: calculateSentimentHealth(mentions.map((mention) => mention.sentiment_score)),
    estimatedTrafficValue: calculateEstimatedTrafficValue(citations.map((citation) => citation.authority_score))
  };
}

export async function getDashboardMetricCards(clientId: string | null): Promise<DashboardMetricCard[]> {
  const now = new Date();
  const currentStart = subDays(now, 30);
  const previousStart = subDays(now, 60);

  const [current, previous] = await Promise.all([
    getWindowSnapshot(clientId, currentStart.toISOString(), now.toISOString()),
    getWindowSnapshot(clientId, previousStart.toISOString(), currentStart.toISOString())
  ]);

  const aiSovDelta = current.aiSov - previous.aiSov;
  const citationDelta = current.totalCitations - previous.totalCitations;
  const sentimentDelta = current.sentimentHealth - previous.sentimentHealth;
  const trafficDeltaPercent = percentageChange(current.estimatedTrafficValue, previous.estimatedTrafficValue);

  return [
    {
      label: "AI Share of Voice",
      value: current.aiSov,
      format: "percent",
      delta: `${signedNumber(aiSovDelta, 1)} pts`,
      positive: aiSovDelta >= 0,
      description: "vs previous 30 days",
      sparkline: buildSparkline(current.aiSov, previous.aiSov)
    },
    {
      label: "Qualified Citations",
      value: current.totalCitations,
      format: "integer",
      delta: signedInteger(citationDelta),
      positive: citationDelta >= 0,
      description: "high-authority sources",
      sparkline: buildSparkline(current.totalCitations, previous.totalCitations)
    },
    {
      label: "Sentiment Health",
      value: current.sentimentHealth,
      format: "score",
      delta: signedNumber(sentimentDelta, 1),
      positive: sentimentDelta >= 0,
      description: "normalized sentiment score",
      sparkline: buildSparkline(current.sentimentHealth, previous.sentimentHealth)
    },
    {
      label: "Est. Traffic Value",
      value: current.estimatedTrafficValue,
      format: "currency",
      delta: `${signedNumber(trafficDeltaPercent, 1)}%`,
      positive: trafficDeltaPercent >= 0,
      description: "authority-weighted estimate",
      sparkline: buildSparkline(current.estimatedTrafficValue, previous.estimatedTrafficValue)
    }
  ];
}
