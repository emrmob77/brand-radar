"use server";

import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type CompetitorGapRow = {
  query: string;
  category: string;
  competitorName: string;
  competitorCoverage: number;
  clientMentions: number;
  opportunityScore: number;
};

export type BattleBrand = {
  key: string;
  label: string;
  isClient: boolean;
};

export type BattleRow = {
  query: string;
  category: string;
  values: Record<string, number>;
};

export type CompetitorAnalysisPayload = {
  gapRows: CompetitorGapRow[];
  brands: BattleBrand[];
  battleRows: BattleRow[];
};

type QueryRow = {
  text: string;
  category: string;
};

type CompetitorRow = {
  id: string;
  name: string;
  domain: string;
};

function hashToRange(input: string, min: number, max: number) {
  const sum = input.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return min + (sum % (max - min + 1));
}

function categoryWeight(category: string) {
  const normalized = category.toLowerCase();
  if (normalized.includes("compliance") || normalized.includes("safety")) return 95;
  if (normalized.includes("pricing") || normalized.includes("cost") || normalized.includes("tco")) return 88;
  if (normalized.includes("product")) return 82;
  return 76;
}

function getFallbackQueries(): QueryRow[] {
  return [
    { text: "best electric fleet management software", category: "Fleet" },
    { text: "enterprise ev charging reliability", category: "Infrastructure" },
    { text: "sustainability reporting for commercial mobility", category: "Sustainability" },
    { text: "fleet safety compliance ai assistant", category: "Safety & Compliance" },
    { text: "total cost of ownership for electric fleets", category: "Pricing" }
  ];
}

export async function getCompetitorAnalysisPayload(clientId: string | null): Promise<CompetitorAnalysisPayload> {
  const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken || !clientId) {
    return { gapRows: [], brands: [], battleRows: [] };
  }

  const supabase = createServerSupabaseClient(accessToken);
  const [clientResult, competitorsResult, queriesResult, mentionsResult] = await Promise.all([
    supabase.from("clients").select("id,name").eq("id", clientId).maybeSingle(),
    supabase.from("competitors").select("id,name,domain").eq("client_id", clientId).order("created_at", { ascending: false }),
    supabase.from("queries").select("text,category").eq("client_id", clientId).order("created_at", { ascending: false }).limit(120),
    supabase.from("mentions").select("query").eq("client_id", clientId).limit(1000)
  ]);

  const client = clientResult.data;
  const competitors = (competitorsResult.data ?? []) as CompetitorRow[];
  const queries = ((queriesResult.data ?? []) as QueryRow[]).length > 0 ? ((queriesResult.data ?? []) as QueryRow[]) : getFallbackQueries();

  if (!client || competitors.length === 0) {
    return { gapRows: [], brands: [], battleRows: [] };
  }

  const mentionCountByQuery = new Map<string, number>();
  for (const mention of mentionsResult.data ?? []) {
    mentionCountByQuery.set(mention.query, (mentionCountByQuery.get(mention.query) ?? 0) + 1);
  }

  const gapRows: CompetitorGapRow[] = [];

  for (const query of queries) {
    const clientMentions = mentionCountByQuery.get(query.text) ?? 0;

    for (const competitor of competitors) {
      const competitorCoverage = hashToRange(`${competitor.id}-${query.text}`, 25, 98);

      if (clientMentions === 0 && competitorCoverage >= 62) {
        const opportunityScore = Math.round(competitorCoverage * 0.75 + categoryWeight(query.category) * 0.25);
        gapRows.push({
          query: query.text,
          category: query.category,
          competitorName: competitor.name,
          competitorCoverage,
          clientMentions,
          opportunityScore
        });
      }
    }
  }

  const rankedGapRows = gapRows.sort((a, b) => b.opportunityScore - a.opportunityScore).slice(0, 24);

  const brands: BattleBrand[] = [
    { key: "client", label: client.name, isClient: true },
    ...competitors.slice(0, 6).map((competitor, index) => ({
      key: `comp_${index}`,
      label: competitor.name,
      isClient: false
    }))
  ];

  const battleRows: BattleRow[] = queries.slice(0, 16).map((query) => {
    const values: Record<string, number> = {};
    const clientMentions = mentionCountByQuery.get(query.text) ?? 0;
    values.client = Math.min(100, clientMentions * 25);

    competitors.slice(0, 6).forEach((competitor, index) => {
      values[`comp_${index}`] = hashToRange(`${competitor.domain}-${query.text}`, 12, 97);
    });

    return {
      query: query.text,
      category: query.category,
      values
    };
  });

  return {
    gapRows: rankedGapRows,
    brands,
    battleRows
  };
}

