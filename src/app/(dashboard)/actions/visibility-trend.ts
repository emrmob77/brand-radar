"use server";

import { eachDayOfInterval, format, subDays } from "date-fns";
import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const fallbackColors = ["#376df6", "#16a34a", "#f59e0b", "#ef4444", "#7c3aed", "#0891b2"];

export type VisibilityTrendPoint = {
  date: string;
  label: string;
  [platformKey: string]: string | number;
};

export type VisibilityTrendSeries = {
  slug: string;
  name: string;
  color: string;
};

export type VisibilityTrendPayload = {
  data: VisibilityTrendPoint[];
  platforms: VisibilityTrendSeries[];
};

function buildEmptyTrendRows() {
  const endDate = new Date();
  const startDate = subDays(endDate, 29);
  return eachDayOfInterval({ start: startDate, end: endDate }).map((date) => ({
    date: format(date, "yyyy-MM-dd"),
    label: format(date, "MMM dd")
  }));
}

export async function getVisibilityTrendPayload(clientId: string | null): Promise<VisibilityTrendPayload> {
  const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return { data: [], platforms: [] };
  }

  const supabase = createServerSupabaseClient(accessToken);
  const since = subDays(new Date(), 30).toISOString();

  const platformsResult = await supabase.from("platforms").select("slug,name").eq("active", true).order("name", { ascending: true });
  const mentionsBaseQuery = supabase.from("mentions").select("detected_at,platform_id,platforms(slug,name)").gte("detected_at", since);
  const mentionsResult = clientId ? await mentionsBaseQuery.eq("client_id", clientId) : await mentionsBaseQuery;

  const activePlatforms = (platformsResult.data ?? []).map((platform, index) => ({
    slug: platform.slug,
    name: platform.name,
    color: fallbackColors[index % fallbackColors.length] ?? "#376df6"
  }));

  const days = buildEmptyTrendRows();
  const byDate = new Map<string, VisibilityTrendPoint>(days.map((day) => [day.date, { ...day }]));

  for (const day of days) {
    const row = byDate.get(day.date);
    if (!row) continue;
    for (const platform of activePlatforms) {
      row[platform.slug] = 0;
    }
  }

  for (const mention of mentionsResult.data ?? []) {
    const dateKey = format(new Date(mention.detected_at), "yyyy-MM-dd");
    const row = byDate.get(dateKey);
    const platformRelation = Array.isArray(mention.platforms) ? mention.platforms[0] : mention.platforms;
    const platformSlug = platformRelation?.slug;
    if (!row || !platformSlug) continue;

    row[platformSlug] = ((row[platformSlug] as number | undefined) ?? 0) + 1;
  }

  return { data: Array.from(byDate.values()), platforms: activePlatforms };
}
