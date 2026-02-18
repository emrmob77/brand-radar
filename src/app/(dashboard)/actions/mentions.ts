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
  sentimentScore: number | null;
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

export type MentionFeedRow = {
  id: string;
  platform: string;
  sentiment: "positive" | "neutral" | "negative";
  query: string;
  excerpt: string;
  detectedAt: string;
};

export type MentionFeedPage = {
  rows: MentionFeedRow[];
  nextPage: number | null;
};

function clampPageSize(value: number | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 20;
  }
  return Math.min(50, Math.max(10, Math.floor(value)));
}

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
    .select("id,query,content,sentiment,sentiment_score,detected_at,platforms(name,slug)")
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
      sentimentScore: mention.sentiment_score ?? null,
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

export async function getMentionFeedPage(input: {
  clientId: string | null;
  page?: number;
  pageSize?: number;
}): Promise<MentionFeedPage> {
  const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return {
      rows: [],
      nextPage: null
    };
  }

  const page = Math.max(0, Math.floor(input.page ?? 0));
  const pageSize = clampPageSize(input.pageSize);
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const supabase = createServerSupabaseClient(accessToken);
  const baseQuery = supabase
    .from("mentions")
    .select("id,query,content,sentiment,detected_at,platforms(name)")
    .order("detected_at", { ascending: false })
    .range(from, to);
  const { data, error } = input.clientId ? await baseQuery.eq("client_id", input.clientId) : await baseQuery;

  if (error || !data) {
    return {
      rows: [],
      nextPage: null
    };
  }

  const rows: MentionFeedRow[] = data.map((item) => {
    const platformRelation = Array.isArray(item.platforms) ? item.platforms[0] : item.platforms;

    return {
      id: String(item.id),
      platform: platformRelation?.name ?? "Unknown",
      sentiment: (item.sentiment as MentionFeedRow["sentiment"]) ?? "neutral",
      query: item.query,
      excerpt: item.content,
      detectedAt: item.detected_at
    };
  });

  return {
    rows,
    nextPage: rows.length === pageSize ? page + 1 : null
  };
}
