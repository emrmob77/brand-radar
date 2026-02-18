"use server";

import { subDays } from "date-fns";
import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type PlatformVisibility = {
  slug: string;
  name: string;
  share: number;
  delta: number;
  mentions: number;
};

export async function getPlatformVisibility(clientId: string | null): Promise<PlatformVisibility[]> {
  const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return [];
  }

  const supabase = createServerSupabaseClient(accessToken);
  const now = new Date();
  const currentSince = subDays(now, 30).toISOString();
  const previousSince = subDays(now, 60).toISOString();
  const currentUntil = now.toISOString();
  const previousUntil = currentSince;

  const platformsResult = await supabase.from("platforms").select("id,name,slug").eq("active", true).order("name", { ascending: true });

  const currentMentionsBase = supabase
    .from("mentions")
    .select("platform_id")
    .gte("detected_at", currentSince)
    .lt("detected_at", currentUntil);
  const previousMentionsBase = supabase
    .from("mentions")
    .select("platform_id")
    .gte("detected_at", previousSince)
    .lt("detected_at", previousUntil);

  const [currentMentionsResult, previousMentionsResult] = await Promise.all([
    clientId ? currentMentionsBase.eq("client_id", clientId) : currentMentionsBase,
    clientId ? previousMentionsBase.eq("client_id", clientId) : previousMentionsBase
  ]);

  if (!platformsResult.data || currentMentionsResult.error || previousMentionsResult.error) {
    return [];
  }

  const currentCountByPlatform = new Map<string, number>();
  const previousCountByPlatform = new Map<string, number>();

  for (const mention of currentMentionsResult.data ?? []) {
    const next = (currentCountByPlatform.get(mention.platform_id) ?? 0) + 1;
    currentCountByPlatform.set(mention.platform_id, next);
  }

  for (const mention of previousMentionsResult.data ?? []) {
    const next = (previousCountByPlatform.get(mention.platform_id) ?? 0) + 1;
    previousCountByPlatform.set(mention.platform_id, next);
  }

  const totalCurrentMentions = Array.from(currentCountByPlatform.values()).reduce((sum, count) => sum + count, 0);
  const totalPreviousMentions = Array.from(previousCountByPlatform.values()).reduce((sum, count) => sum + count, 0);

  return platformsResult.data.map((platform) => {
    const currentCount = currentCountByPlatform.get(platform.id) ?? 0;
    const previousCount = previousCountByPlatform.get(platform.id) ?? 0;
    const currentShare = totalCurrentMentions > 0 ? (currentCount / totalCurrentMentions) * 100 : 0;
    const previousShare = totalPreviousMentions > 0 ? (previousCount / totalPreviousMentions) * 100 : 0;

    return {
      slug: platform.slug,
      name: platform.name,
      share: currentShare,
      delta: currentShare - previousShare,
      mentions: currentCount
    };
  });
}

export type HeatmapPlatform = {
  id: string;
  slug: string;
  name: string;
};

export type HeatmapCell = {
  topic: string;
  platformSlug: string;
  count: number;
  value: number;
};

export type PlatformTopicHeatmapPayload = {
  topics: string[];
  platforms: HeatmapPlatform[];
  cells: HeatmapCell[];
};

export async function getPlatformTopicHeatmapPayload(clientId: string | null): Promise<PlatformTopicHeatmapPayload> {
  const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return { topics: [], platforms: [], cells: [] };
  }

  const supabase = createServerSupabaseClient(accessToken);
  const platformsResult = await supabase.from("platforms").select("id,slug,name").eq("active", true).order("name", { ascending: true });
  if (!platformsResult.data) {
    return { topics: [], platforms: [], cells: [] };
  }

  const queryBase = supabase.from("queries").select("text,category");
  const mentionsBase = supabase.from("mentions").select("query,platform_id");
  const [queriesResult, mentionsResult] = await Promise.all([
    clientId ? queryBase.eq("client_id", clientId) : queryBase,
    clientId ? mentionsBase.eq("client_id", clientId) : mentionsBase
  ]);

  const queryCategoryMap = new Map<string, string>();
  for (const query of queriesResult.data ?? []) {
    queryCategoryMap.set(query.text, query.category);
  }

  const counts = new Map<string, number>();
  for (const mention of mentionsResult.data ?? []) {
    const category = queryCategoryMap.get(mention.query) ?? "Uncategorized";
    const key = `${category}::${mention.platform_id}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const categoryTotals = new Map<string, number>();
  for (const [key, count] of counts.entries()) {
    const [category] = key.split("::");
    if (!category) continue;
    categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + count);
  }

  const topics = Array.from(categoryTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([category]) => category)
    .slice(0, 8);
  const activeTopics = topics;
  const denominator = Math.max(...counts.values(), 1);
  const cells: HeatmapCell[] = [];

  for (const topic of activeTopics) {
    for (const platform of platformsResult.data) {
      const count = counts.get(`${topic}::${platform.id}`) ?? 0;

      cells.push({
        topic,
        platformSlug: platform.slug,
        count,
        value: Math.min(100, Math.round((count / denominator) * 100))
      });
    }
  }

  return {
    topics: activeTopics,
    platforms: platformsResult.data,
    cells
  };
}
