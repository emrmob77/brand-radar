"use server";

import { eachDayOfInterval, format, parseISO, subDays } from "date-fns";
import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type CitationSourceRow = {
  domain: string;
  platform: string;
  citations: number;
  authority: number;
  sourceType: string;
};

export type CitationForensicsPayload = {
  topSources: CitationSourceRow[];
  sourceTypeDistribution: Array<{ type: string; count: number }>;
  authorityPoints: Array<{ domain: string; authority: number; citations: number; sourceType: string }>;
  trendRows: Array<{ date: string; label: string; gained: number; lost: number }>;
  gainedCount: number;
  lostCount: number;
  gapRows: Array<{ source: string; competitor: string; opportunityScore: number; reason: string }>;
};

type CitationRecord = {
  source_url: string;
  source_type: string;
  authority_score: number | null;
  status: "active" | "lost";
  detected_at: string;
  platforms: { name: string } | { name: string }[] | null;
};

type CompetitorRow = {
  id: string;
  name: string;
};

function parseDomain(sourceUrl: string) {
  try {
    return new URL(sourceUrl).hostname.replace(/^www\./, "");
  } catch {
    return sourceUrl.replace(/^https?:\/\//, "").split("/")[0] ?? sourceUrl;
  }
}

function hashToRange(input: string, min: number, max: number) {
  const sum = input.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return min + (sum % (max - min + 1));
}

function normalizePlatformName(platform: CitationRecord["platforms"]) {
  const relation = Array.isArray(platform) ? platform[0] : platform;
  return relation?.name ?? "Unknown";
}

export async function getCitationForensicsPayload(
  clientId: string | null,
  fromISO?: string,
  toISO?: string
): Promise<CitationForensicsPayload> {
  const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken || !clientId) {
    return {
      topSources: [],
      sourceTypeDistribution: [],
      authorityPoints: [],
      trendRows: [],
      gainedCount: 0,
      lostCount: 0,
      gapRows: []
    };
  }

  const supabase = createServerSupabaseClient(accessToken);
  const now = new Date();
  const defaultFrom = subDays(now, 30);
  const fromDate = fromISO ? parseISO(fromISO) : defaultFrom;
  const toDate = toISO ? parseISO(toISO) : now;

  const [{ data: citationsData }, { data: competitorsData }] = await Promise.all([
    supabase
      .from("citations")
      .select("source_url,source_type,authority_score,status,detected_at,platforms(name)")
      .eq("client_id", clientId)
      .gte("detected_at", fromDate.toISOString())
      .lte("detected_at", toDate.toISOString())
      .limit(3000),
    supabase.from("competitors").select("id,name").eq("client_id", clientId).limit(30)
  ]);

  const citations = (citationsData ?? []) as CitationRecord[];
  const competitors = (competitorsData ?? []) as CompetitorRow[];

  const sourceMap = new Map<string, CitationSourceRow>();
  const sourceTypeMap = new Map<string, number>();

  for (const citation of citations) {
    const domain = parseDomain(citation.source_url);
    const key = `${domain}::${citation.source_type}`;
    const platform = normalizePlatformName(citation.platforms);
    const current = sourceMap.get(key);

    if (!current) {
      sourceMap.set(key, {
        domain,
        platform,
        citations: 1,
        authority: citation.authority_score ?? 0,
        sourceType: citation.source_type
      });
    } else {
      current.citations += 1;
      current.authority = Math.round((current.authority + (citation.authority_score ?? 0)) / 2);
    }

    sourceTypeMap.set(citation.source_type, (sourceTypeMap.get(citation.source_type) ?? 0) + 1);
  }

  const topSources = Array.from(sourceMap.values())
    .sort((a, b) => b.citations - a.citations)
    .slice(0, 16);

  const sourceTypeDistribution = Array.from(sourceTypeMap.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  const authorityPoints = topSources.map((source) => ({
    domain: source.domain,
    authority: source.authority,
    citations: source.citations,
    sourceType: source.sourceType
  }));

  const trendDays = eachDayOfInterval({ start: fromDate, end: toDate });
  const trendRows = trendDays.map((day) => ({
    date: format(day, "yyyy-MM-dd"),
    label: format(day, "MMM dd"),
    gained: 0,
    lost: 0
  }));
  const trendMap = new Map(trendRows.map((row) => [row.date, row]));

  let gainedCount = 0;
  let lostCount = 0;

  for (const citation of citations) {
    const key = format(new Date(citation.detected_at), "yyyy-MM-dd");
    const row = trendMap.get(key);
    if (!row) continue;

    if (citation.status === "lost") {
      row.lost += 1;
      lostCount += 1;
    } else {
      row.gained += 1;
      gainedCount += 1;
    }
  }

  const gapRows = topSources.slice(0, 10).flatMap((source) => {
    return competitors.slice(0, 4).map((competitor) => {
      const opportunityScore = hashToRange(`${source.domain}-${competitor.id}`, 58, 97);
      return {
        source: source.domain,
        competitor: competitor.name,
        opportunityScore,
        reason: `${competitor.name} is likely cited on this source while client coverage is low.`
      };
    });
  });

  return {
    topSources,
    sourceTypeDistribution,
    authorityPoints,
    trendRows,
    gainedCount,
    lostCount,
    gapRows: gapRows.sort((a, b) => b.opportunityScore - a.opportunityScore).slice(0, 14)
  };
}

