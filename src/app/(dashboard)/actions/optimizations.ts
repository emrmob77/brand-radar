"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type OptimizationStatus = "todo" | "in_progress" | "done";
export type OptimizationImpact = "low" | "medium" | "high";
export type OptimizationEffort = "low" | "medium" | "high";

export type OptimizationCard = {
  id: string;
  title: string;
  description: string;
  impact: OptimizationImpact;
  effort: OptimizationEffort;
  status: OptimizationStatus;
  readinessScore: number;
};

export type OptimizationPayload = {
  cards: OptimizationCard[];
  readinessScore: number;
  quickWins: number;
};

export type ContentGapPriority = "low" | "medium" | "high";

export type ContentGapGroup = {
  category: string;
  totalQueries: number;
  coveredQueries: number;
  missingQueries: number;
  coverageRate: number;
  priority: ContentGapPriority;
  recommendedAction: string;
  examples: string[];
};

const fallbackCards: Omit<OptimizationCard, "id">[] = [
  {
    title: "Schema Coverage Expansion",
    description: "Extend schema coverage for product and support pages.",
    impact: "high",
    effort: "medium",
    status: "todo",
    readinessScore: 72
  },
  {
    title: "Authoritative FAQ Hub",
    description: "Build an FAQ cluster targeting comparison and trust queries.",
    impact: "high",
    effort: "low",
    status: "in_progress",
    readinessScore: 84
  },
  {
    title: "Citation Recovery Sprint",
    description: "Recover lost citations on high-authority domains.",
    impact: "medium",
    effort: "medium",
    status: "todo",
    readinessScore: 63
  },
  {
    title: "Brand Prompt Playbook",
    description: "Define model prompt patterns for consistent brand answers.",
    impact: "high",
    effort: "low",
    status: "done",
    readinessScore: 88
  }
];

const fallbackGapGroups: ContentGapGroup[] = [
  {
    category: "Brand Comparisons",
    totalQueries: 8,
    coveredQueries: 2,
    missingQueries: 6,
    coverageRate: 25,
    priority: "high",
    recommendedAction: "Create dedicated comparison pages with structured FAQs this sprint.",
    examples: ["brand vs competitor pricing", "best alternative to brand"]
  },
  {
    category: "Implementation Guides",
    totalQueries: 10,
    coveredQueries: 5,
    missingQueries: 5,
    coverageRate: 50,
    priority: "medium",
    recommendedAction: "Expand product docs with use-case templates and troubleshooting sections.",
    examples: ["how to set up brand workflow", "brand onboarding checklist"]
  },
  {
    category: "Trust and Proof",
    totalQueries: 6,
    coveredQueries: 4,
    missingQueries: 2,
    coverageRate: 67,
    priority: "low",
    recommendedAction: "Refresh social proof pages and keep citation sources current.",
    examples: ["brand customer success stories", "brand security compliance"]
  }
];

function normalizeQuery(input: string) {
  return input.trim().toLowerCase();
}

function resolvePriority(missingRatio: number, hasHighPriorityMissing: boolean): ContentGapPriority {
  if (hasHighPriorityMissing || missingRatio >= 0.65) return "high";
  if (missingRatio >= 0.35) return "medium";
  return "low";
}

function actionForPriority(priority: ContentGapPriority) {
  if (priority === "high") return "Create dedicated pages and schema blocks in the next sprint.";
  if (priority === "medium") return "Refresh existing pages with FAQs and deeper intent coverage.";
  return "Monitor trend changes and optimize internal linking to improve discoverability.";
}

function calculateReadinessScore(cards: Array<Pick<OptimizationCard, "readinessScore">>) {
  if (cards.length === 0) return 0;
  return Math.round(cards.reduce((sum, card) => sum + card.readinessScore, 0) / cards.length);
}

function buildFallbackPayload(): OptimizationPayload {
  const cards = fallbackCards.map((card, index) => ({ ...card, id: `fallback-${index}` }));
  return {
    cards,
    readinessScore: calculateReadinessScore(cards),
    quickWins: cards.filter((card) => card.impact === "high" && card.effort === "low").length
  };
}

export async function getOptimizationPayload(clientId: string | null): Promise<OptimizationPayload> {
  const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken || !clientId) {
    return buildFallbackPayload();
  }

  const supabase = createServerSupabaseClient(accessToken);
  const { data } = await supabase
    .from("optimizations")
    .select("id,title,description,impact,effort,status,readiness_score")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  const cards: OptimizationCard[] =
    data?.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      impact: row.impact as OptimizationImpact,
      effort: row.effort as OptimizationEffort,
      status: row.status as OptimizationStatus,
      readinessScore: row.readiness_score ?? 0
    })) ?? [];

  if (cards.length === 0) return buildFallbackPayload();

  return {
    cards,
    readinessScore: calculateReadinessScore(cards),
    quickWins: cards.filter((card) => card.impact === "high" && card.effort === "low").length
  };
}

export async function getContentGapGroups(clientId: string | null): Promise<ContentGapGroup[]> {
  const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken || !clientId) {
    return fallbackGapGroups;
  }

  const supabase = createServerSupabaseClient(accessToken);
  const [queriesResult, mentionsResult] = await Promise.all([
    supabase.from("queries").select("text,category,priority").eq("client_id", clientId),
    supabase.from("mentions").select("query").eq("client_id", clientId)
  ]);

  const queryRows = queriesResult.data ?? [];
  if (queryRows.length === 0) {
    return fallbackGapGroups;
  }

  const coveredQueries = new Set((mentionsResult.data ?? []).map((row) => normalizeQuery(row.query)));
  const grouped = new Map<
    string,
    {
      total: number;
      covered: number;
      highPriorityMissing: boolean;
      examples: string[];
    }
  >();

  for (const row of queryRows) {
    const category = row.category?.trim() || "Uncategorized";
    const bucket = grouped.get(category) ?? {
      total: 0,
      covered: 0,
      highPriorityMissing: false,
      examples: []
    };

    const normalized = normalizeQuery(row.text ?? "");
    const isCovered = coveredQueries.has(normalized);
    const isMissing = !isCovered;

    bucket.total += 1;
    if (isCovered) {
      bucket.covered += 1;
    } else if (bucket.examples.length < 3 && row.text) {
      bucket.examples.push(row.text);
    }

    if (isMissing && row.priority === "high") {
      bucket.highPriorityMissing = true;
    }

    grouped.set(category, bucket);
  }

  const priorityWeight: Record<ContentGapPriority, number> = {
    high: 3,
    medium: 2,
    low: 1
  };

  const groups = [...grouped.entries()]
    .map(([category, bucket]) => {
      const missingQueries = Math.max(bucket.total - bucket.covered, 0);
      const missingRatio = bucket.total === 0 ? 0 : missingQueries / bucket.total;
      const priority = resolvePriority(missingRatio, bucket.highPriorityMissing);

      return {
        category,
        totalQueries: bucket.total,
        coveredQueries: bucket.covered,
        missingQueries,
        coverageRate: Math.round((bucket.covered / Math.max(1, bucket.total)) * 100),
        priority,
        recommendedAction: actionForPriority(priority),
        examples: bucket.examples
      } satisfies ContentGapGroup;
    })
    .filter((item) => item.missingQueries > 0)
    .sort((a, b) => {
      const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.missingQueries - a.missingQueries;
    });

  return groups.length > 0 ? groups : fallbackGapGroups;
}

export async function updateOptimizationStatusAction(optimizationId: string, status: OptimizationStatus) {
  if (optimizationId.startsWith("fallback-")) {
    return { ok: true };
  }

  const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return { ok: false, error: "Session not found." };
  }

  const supabase = createServerSupabaseClient(accessToken);
  const { error } = await supabase.from("optimizations").update({ status }).eq("id", optimizationId);
  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/optimizations");
  return { ok: true };
}
