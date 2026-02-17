"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type HallucinationRiskLevel = "critical" | "high" | "medium" | "low";
export type HallucinationStatus = "open" | "corrected" | "monitoring";

export type HallucinationRow = {
  id: string;
  platform: string;
  platformSlug: string;
  query: string;
  incorrectInfo: string;
  correctInfo: string;
  riskLevel: HallucinationRiskLevel;
  status: HallucinationStatus;
  detectedAt: string;
  correctedAt: string | null;
  correctionNote: string | null;
};

export type HallucinationSummary = {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  correctedRate: number;
  avgResolutionHours: number;
};

export type PlatformHallucinationStats = {
  platform: string;
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
};

export type HallucinationPayload = {
  rows: HallucinationRow[];
  summary: HallucinationSummary;
  platformStats: PlatformHallucinationStats[];
};

const riskWeight: Record<HallucinationRiskLevel, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1
};

const fallbackRows: HallucinationRow[] = [
  {
    id: "fallback-hallucination-1",
    platform: "ChatGPT",
    platformSlug: "chatgpt",
    query: "Does Brand Radar include enterprise SSO?",
    incorrectInfo: "Brand Radar does not support SSO for enterprise customers.",
    correctInfo: "Brand Radar supports SAML-based enterprise SSO on Business and Enterprise plans.",
    riskLevel: "critical",
    status: "open",
    detectedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    correctedAt: null,
    correctionNote: null
  },
  {
    id: "fallback-hallucination-2",
    platform: "Perplexity",
    platformSlug: "perplexity",
    query: "What is the data retention policy for Brand Radar analytics?",
    incorrectInfo: "Analytics data is retained for only 7 days.",
    correctInfo: "Analytics data retention is 24 months by default and configurable per contract.",
    riskLevel: "high",
    status: "monitoring",
    detectedAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    correctedAt: null,
    correctionNote: "Waiting for model refresh verification."
  },
  {
    id: "fallback-hallucination-3",
    platform: "Claude",
    platformSlug: "claude",
    query: "How accurate is Brand Radar sentiment scoring?",
    incorrectInfo: "Sentiment scoring is binary and cannot detect neutral statements.",
    correctInfo: "Scoring supports positive, neutral, and negative classes with calibrated confidence.",
    riskLevel: "medium",
    status: "corrected",
    detectedAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    correctedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    correctionNote: "Docs updated and model citations now reference the latest spec."
  }
];

function buildSummary(rows: HallucinationRow[]): HallucinationSummary {
  if (rows.length === 0) {
    return {
      total: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      correctedRate: 0,
      avgResolutionHours: 0
    };
  }

  const correctedRows = rows.filter((row) => row.correctedAt);
  const totalResolutionHours = correctedRows.reduce((total, row) => {
    if (!row.correctedAt) return total;
    const detected = new Date(row.detectedAt).getTime();
    const corrected = new Date(row.correctedAt).getTime();
    if (Number.isNaN(detected) || Number.isNaN(corrected)) return total;
    return total + Math.max(0, corrected - detected) / (1000 * 60 * 60);
  }, 0);

  return {
    total: rows.length,
    critical: rows.filter((row) => row.riskLevel === "critical").length,
    high: rows.filter((row) => row.riskLevel === "high").length,
    medium: rows.filter((row) => row.riskLevel === "medium").length,
    low: rows.filter((row) => row.riskLevel === "low").length,
    correctedRate: Math.round((correctedRows.length / rows.length) * 100),
    avgResolutionHours: correctedRows.length === 0 ? 0 : Number((totalResolutionHours / correctedRows.length).toFixed(1))
  };
}

function buildPlatformStats(rows: HallucinationRow[]): PlatformHallucinationStats[] {
  const grouped = new Map<string, PlatformHallucinationStats>();
  for (const row of rows) {
    const key = row.platform || "Unknown";
    const bucket = grouped.get(key) ?? {
      platform: key,
      total: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };
    bucket.total += 1;
    bucket[row.riskLevel] += 1;
    grouped.set(key, bucket);
  }

  return [...grouped.values()].sort((a, b) => b.total - a.total);
}

function parseCorrectionNotes(messages: Array<{ message: string | null }>) {
  const noteMap = new Map<string, string>();
  for (const row of messages) {
    const message = row.message ?? "";
    const idMatch = message.match(/\[hallucination:([^\]]+)\]/i);
    if (!idMatch?.[1]) continue;

    const noteMatch = message.match(/Correction note:\s*(.+)$/i);
    if (!noteMatch?.[1]) continue;

    const hallucinationId = idMatch[1].trim();
    if (!hallucinationId || noteMap.has(hallucinationId)) continue;
    noteMap.set(hallucinationId, noteMatch[1].trim());
  }

  return noteMap;
}

function sortRows(rows: HallucinationRow[]) {
  return [...rows].sort((a, b) => {
    const riskDiff = riskWeight[b.riskLevel] - riskWeight[a.riskLevel];
    if (riskDiff !== 0) return riskDiff;
    return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime();
  });
}

function fallbackPayload(): HallucinationPayload {
  const rows = sortRows(fallbackRows);
  return {
    rows,
    summary: buildSummary(rows),
    platformStats: buildPlatformStats(rows)
  };
}

async function resolveHallucinationAlertRuleId(supabase: ReturnType<typeof createServerSupabaseClient>, clientId: string) {
  const existing = await supabase
    .from("alert_rules")
    .select("id")
    .eq("client_id", clientId)
    .eq("metric", "hallucinations")
    .limit(1)
    .maybeSingle();

  if (existing.data?.id) return existing.data.id;

  const inserted = await supabase
    .from("alert_rules")
    .insert({
      client_id: clientId,
      name: "Critical Hallucination Detector",
      metric: "hallucinations",
      condition: "above",
      threshold: 0
    })
    .select("id")
    .maybeSingle();

  return inserted.data?.id ?? null;
}

export async function getHallucinationPayload(clientId: string | null): Promise<HallucinationPayload> {
  const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken || !clientId) {
    return fallbackPayload();
  }

  const supabase = createServerSupabaseClient(accessToken);
  const [hallucinationsResult, alertsResult] = await Promise.all([
    supabase
      .from("hallucinations")
      .select("id,query,incorrect_info,correct_info,risk_level,status,detected_at,corrected_at,platforms(name,slug)")
      .eq("client_id", clientId)
      .order("detected_at", { ascending: false }),
    supabase
      .from("alerts")
      .select("message")
      .eq("client_id", clientId)
      .ilike("message", "%[hallucination:%")
      .order("created_at", { ascending: false })
      .limit(300)
  ]);

  const noteMap = parseCorrectionNotes(alertsResult.data ?? []);
  const rows: HallucinationRow[] =
    hallucinationsResult.data?.map((row) => {
      const platformRelation = Array.isArray(row.platforms) ? row.platforms[0] : row.platforms;
      return {
        id: row.id,
        platform: platformRelation?.name ?? "Unknown",
        platformSlug: platformRelation?.slug ?? "unknown",
        query: row.query,
        incorrectInfo: row.incorrect_info,
        correctInfo: row.correct_info,
        riskLevel: row.risk_level as HallucinationRiskLevel,
        status: row.status as HallucinationStatus,
        detectedAt: row.detected_at,
        correctedAt: row.corrected_at ?? null,
        correctionNote: noteMap.get(row.id) ?? null
      };
    }) ?? [];

  if (rows.length === 0) {
    return fallbackPayload();
  }

  const sorted = sortRows(rows);
  return {
    rows: sorted,
    summary: buildSummary(sorted),
    platformStats: buildPlatformStats(sorted)
  };
}

export async function runCriticalHallucinationAlertAction(clientId: string | null) {
  const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken || !clientId) {
    return { ok: false, created: 0, notificationsSent: 0, error: "Session or client not found." };
  }

  const supabase = createServerSupabaseClient(accessToken);
  const [criticalResult, existingAlertsResult] = await Promise.all([
    supabase
      .from("hallucinations")
      .select("id,query,platforms(name)")
      .eq("client_id", clientId)
      .eq("risk_level", "critical")
      .eq("status", "open"),
    supabase
      .from("alerts")
      .select("message")
      .eq("client_id", clientId)
      .eq("severity", "critical")
      .ilike("message", "%[hallucination:%")
      .order("created_at", { ascending: false })
      .limit(500)
  ]);

  const criticalRows = criticalResult.data ?? [];
  if (criticalRows.length === 0) {
    return { ok: true, created: 0, notificationsSent: 0 };
  }

  const existingIds = new Set<string>();
  for (const alert of existingAlertsResult.data ?? []) {
    const match = (alert.message ?? "").match(/\[hallucination:([^\]]+)\]/i);
    if (match?.[1]) existingIds.add(match[1].trim());
  }

  const ruleId = await resolveHallucinationAlertRuleId(supabase, clientId);
  if (!ruleId) {
    return { ok: false, created: 0, notificationsSent: 0, error: "Could not resolve alert rule." };
  }

  const inserts = criticalRows
    .filter((row) => !existingIds.has(row.id))
    .map((row) => {
      const platformRelation = Array.isArray(row.platforms) ? row.platforms[0] : row.platforms;
      const platformName = platformRelation?.name ?? "Unknown platform";
      return {
        alert_rule_id: ruleId,
        client_id: clientId,
        title: "Critical hallucination detected",
        message: `[hallucination:${row.id}] Critical risk on ${platformName}. Query: "${row.query}".`,
        severity: "critical" as const
      };
    });

  if (inserts.length === 0) {
    return { ok: true, created: 0, notificationsSent: 0 };
  }

  const insertResult = await supabase.from("alerts").insert(inserts);
  if (insertResult.error) {
    return { ok: false, created: 0, notificationsSent: 0, error: insertResult.error.message };
  }

  revalidatePath("/hallucinations");
  return { ok: true, created: inserts.length, notificationsSent: inserts.length };
}

export async function markHallucinationCorrectedAction(hallucinationId: string, note: string) {
  if (hallucinationId.startsWith("fallback-hallucination-")) {
    return { ok: true, correctedAt: new Date().toISOString(), note: note.trim() || null };
  }

  const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return { ok: false, error: "Session not found." };
  }

  const supabase = createServerSupabaseClient(accessToken);
  const hallucinationResult = await supabase
    .from("hallucinations")
    .select("id,client_id,status")
    .eq("id", hallucinationId)
    .maybeSingle();

  if (!hallucinationResult.data) {
    return { ok: false, error: "Hallucination record not found." };
  }

  const correctedAt = new Date().toISOString();
  const updateResult = await supabase
    .from("hallucinations")
    .update({ status: "corrected", corrected_at: correctedAt })
    .eq("id", hallucinationId);
  if (updateResult.error) {
    return { ok: false, error: updateResult.error.message };
  }

  const clientId = hallucinationResult.data.client_id;
  const ruleId = await resolveHallucinationAlertRuleId(supabase, clientId);
  if (ruleId) {
    const cleanNote = note.trim();
    const message = cleanNote
      ? `[hallucination:${hallucinationId}] Marked as corrected. Correction note: ${cleanNote}`
      : `[hallucination:${hallucinationId}] Marked as corrected.`;
    await supabase.from("alerts").insert({
      alert_rule_id: ruleId,
      client_id: clientId,
      title: "Hallucination corrected",
      message,
      severity: "info"
    });
  }

  revalidatePath("/hallucinations");
  return { ok: true, correctedAt, note: note.trim() || null };
}
