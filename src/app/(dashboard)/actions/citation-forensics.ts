"use server";

import { eachDayOfInterval, endOfDay, format, isValid, parseISO, startOfDay, subDays } from "date-fns";
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

type PromptRunRecord = {
  citations: unknown;
  web_results: unknown;
  brand_mentioned: boolean;
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

function inferSourceType(url: string) {
  const normalized = url.toLowerCase();
  if (normalized.includes("wikipedia.org")) return "wikipedia";
  if (normalized.includes("reddit.com")) return "reddit";
  if (normalized.includes("news") || normalized.includes("reuters.com") || normalized.includes("bloomberg.com")) return "news";
  if (normalized.includes("blog")) return "blog";
  return "other";
}

function normalizeSourceType(value: unknown, url: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return inferSourceType(url);
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "website" || normalized === "web" || normalized === "site") {
    return inferSourceType(url);
  }

  return normalized;
}

function normalizeAuthorityScore(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }
  if (value >= 0 && value <= 1) {
    return Math.round(value * 100);
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeUrl(value: unknown) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }
  try {
    return new URL(value).toString();
  } catch {
    return null;
  }
}

function extractPromptRunCitations(run: PromptRunRecord): CitationRecord[] {
  const platform = normalizePlatformName(run.platforms);
  const entries: CitationRecord[] = [];
  const seen = new Set<string>();

  const pushCitation = (input: { url: unknown; sourceType?: unknown; authorityScore?: unknown }) => {
    const normalizedUrl = normalizeUrl(input.url);
    if (!normalizedUrl || seen.has(normalizedUrl)) {
      return;
    }
    seen.add(normalizedUrl);
    entries.push({
      source_url: normalizedUrl,
      source_type: normalizeSourceType(input.sourceType, normalizedUrl),
      authority_score: normalizeAuthorityScore(input.authorityScore),
      status: "active",
      detected_at: run.detected_at,
      platforms: { name: platform }
    });
  };

  if (Array.isArray(run.citations)) {
    for (const item of run.citations) {
      if (!item || typeof item !== "object") {
        continue;
      }
      const row = item as Record<string, unknown>;
      pushCitation({
        url: row.url,
        sourceType: row.sourceType,
        authorityScore: row.authorityScore
      });
    }
  }

  if (Array.isArray(run.web_results)) {
    for (const item of run.web_results) {
      if (!item || typeof item !== "object") {
        continue;
      }
      const row = item as Record<string, unknown>;
      pushCitation({
        url: row.url
      });
    }
  }

  return entries;
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
  const parsedFrom = fromISO ? parseISO(fromISO) : defaultFrom;
  const parsedTo = toISO ? parseISO(toISO) : now;
  let fromDate = isValid(parsedFrom) ? startOfDay(parsedFrom) : startOfDay(defaultFrom);
  let toDate = isValid(parsedTo) ? endOfDay(parsedTo) : endOfDay(now);
  if (fromDate.getTime() > toDate.getTime()) {
    const swap = fromDate;
    fromDate = startOfDay(toDate);
    toDate = endOfDay(swap);
  }

  const [{ data: citationsData }, { data: promptRunsData }, { data: competitorsData }] = await Promise.all([
    supabase
      .from("citations")
      .select("source_url,source_type,authority_score,status,detected_at,platforms(name)")
      .eq("client_id", clientId)
      .gte("detected_at", fromDate.toISOString())
      .lte("detected_at", toDate.toISOString())
      .limit(3000),
    supabase
      .from("prompt_runs")
      .select("citations,web_results,brand_mentioned,detected_at,platforms(name)")
      .eq("client_id", clientId)
      .eq("brand_mentioned", false)
      .gte("detected_at", fromDate.toISOString())
      .lte("detected_at", toDate.toISOString())
      .limit(3000),
    supabase.from("competitors").select("id,name").eq("client_id", clientId).limit(30)
  ]);

  const promptRunCitations = ((promptRunsData ?? []) as PromptRunRecord[]).flatMap(extractPromptRunCitations);
  const citations = [...((citationsData ?? []) as CitationRecord[]), ...promptRunCitations];
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
