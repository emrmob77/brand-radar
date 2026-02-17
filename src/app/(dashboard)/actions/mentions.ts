"use server";

import { subDays } from "date-fns";
import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type MentionRecord = {
  id: string;
  platform: string;
  platformSlug: string;
  query: string;
  content: string;
  sentiment: "positive" | "neutral" | "negative";
  detectedAt: string;
};

export type MentionAnalytics = {
  total: number;
  positive: number;
  neutral: number;
  negative: number;
};

export type MentionPayload = {
  analytics: MentionAnalytics;
  rows: MentionRecord[];
};

export async function getMentionPayload(clientId: string | null): Promise<MentionPayload> {
  const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return {
      analytics: { total: 0, positive: 0, neutral: 0, negative: 0 },
      rows: []
    };
  }

  const supabase = createServerSupabaseClient(accessToken);
  const since = subDays(new Date(), 30).toISOString();
  const mentionsBaseQuery = supabase
    .from("mentions")
    .select("id,query,content,sentiment,detected_at,platforms(name,slug)")
    .gte("detected_at", since)
    .order("detected_at", { ascending: false })
    .limit(200);

  const mentionsResult = clientId ? await mentionsBaseQuery.eq("client_id", clientId) : await mentionsBaseQuery;
  if (!mentionsResult.data) {
    return {
      analytics: { total: 0, positive: 0, neutral: 0, negative: 0 },
      rows: []
    };
  }

  const rows: MentionRecord[] = mentionsResult.data.map((mention) => {
    const platformRelation = Array.isArray(mention.platforms) ? mention.platforms[0] : mention.platforms;
    return {
      id: String(mention.id),
      platform: platformRelation?.name ?? "Unknown",
      platformSlug: platformRelation?.slug ?? "unknown",
      query: mention.query,
      content: mention.content,
      sentiment: (mention.sentiment as MentionRecord["sentiment"]) ?? "neutral",
      detectedAt: mention.detected_at
    };
  });

  const analytics: MentionAnalytics = {
    total: rows.length,
    positive: rows.filter((row) => row.sentiment === "positive").length,
    neutral: rows.filter((row) => row.sentiment === "neutral").length,
    negative: rows.filter((row) => row.sentiment === "negative").length
  };

  return { analytics, rows };
}

