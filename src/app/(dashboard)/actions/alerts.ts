"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AlertSeverity = "info" | "warning" | "critical";
export type AlertRuleMetric = "mentions" | "sentiment" | "citations" | "hallucinations" | "competitor_movement";
export type AlertRuleCondition = "above" | "below" | "equals" | "changes_by";

export type AlertItem = {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  read: boolean;
  createdAt: string;
  clientId: string;
};

export type AlertRuleItem = {
  id: string;
  clientId: string;
  name: string;
  metric: AlertRuleMetric;
  condition: AlertRuleCondition;
  threshold: number;
  enabled: boolean;
  createdAt: string;
};

export type AlertsPagePayload = {
  alerts: AlertItem[];
  rules: AlertRuleItem[];
  unreadCount: number;
};

const fallbackAlerts: AlertItem[] = [
  {
    id: "fallback-alert-1",
    title: "Critical hallucination detected",
    message: "Incorrect pricing statement detected on ChatGPT responses for enterprise plans.",
    severity: "critical",
    read: false,
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    clientId: "fallback"
  },
  {
    id: "fallback-alert-2",
    title: "Mentions spike",
    message: "Mentions volume increased by 38% vs previous 24h window.",
    severity: "warning",
    read: false,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    clientId: "fallback"
  },
  {
    id: "fallback-alert-3",
    title: "Citation momentum improved",
    message: "New citations gained on high-authority domains this week.",
    severity: "info",
    read: true,
    createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    clientId: "fallback"
  }
];

const fallbackRules: AlertRuleItem[] = [
  {
    id: "fallback-rule-1",
    clientId: "fallback",
    name: "Mentions spike",
    metric: "mentions",
    condition: "changes_by",
    threshold: 25,
    enabled: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "fallback-rule-2",
    clientId: "fallback",
    name: "Critical hallucination watch",
    metric: "hallucinations",
    condition: "above",
    threshold: 0,
    enabled: true,
    createdAt: new Date().toISOString()
  }
];

type MetricSnapshot = {
  current: number;
  previous: number;
};

function mapAlert(row: {
  id: string;
  title: string;
  message: string;
  severity: string;
  read: boolean;
  created_at: string;
  client_id: string;
}): AlertItem {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    severity: row.severity as AlertSeverity,
    read: row.read,
    createdAt: row.created_at,
    clientId: row.client_id
  };
}

function mapRule(row: {
  id: string;
  client_id: string;
  name: string;
  metric: string;
  condition: string;
  threshold: number;
  enabled: boolean;
  created_at: string;
}): AlertRuleItem {
  return {
    id: row.id,
    clientId: row.client_id,
    name: row.name,
    metric: row.metric as AlertRuleMetric,
    condition: row.condition as AlertRuleCondition,
    threshold: Number(row.threshold ?? 0),
    enabled: row.enabled,
    createdAt: row.created_at
  };
}

function buildFallbackPayload(): AlertsPagePayload {
  return {
    alerts: fallbackAlerts,
    rules: fallbackRules,
    unreadCount: fallbackAlerts.filter((alert) => !alert.read).length
  };
}

function evaluateCondition(snapshot: MetricSnapshot, condition: AlertRuleCondition, threshold: number) {
  if (condition === "above") return snapshot.current > threshold;
  if (condition === "below") return snapshot.current < threshold;
  if (condition === "equals") return Math.abs(snapshot.current - threshold) < 0.001;

  const percentChange =
    snapshot.previous === 0
      ? snapshot.current > 0
        ? 100
        : 0
      : ((snapshot.current - snapshot.previous) / Math.abs(snapshot.previous)) * 100;
  return Math.abs(percentChange) >= threshold;
}

function severityForRule(rule: AlertRuleItem, snapshot: MetricSnapshot): AlertSeverity {
  if (rule.metric === "hallucinations") return "critical";
  if (rule.metric === "sentiment" && snapshot.current < 0) return "critical";

  const delta =
    snapshot.previous === 0
      ? snapshot.current > 0
        ? 100
        : 0
      : Math.abs(((snapshot.current - snapshot.previous) / Math.abs(snapshot.previous)) * 100);
  if (delta >= 50) return "critical";
  if (delta >= 20) return "warning";
  return "info";
}

async function metricSnapshot(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  clientId: string,
  metric: AlertRuleMetric
): Promise<MetricSnapshot> {
  const now = Date.now();
  const hour = 60 * 60 * 1000;

  if (metric === "mentions") {
    const currentFrom = new Date(now - 24 * hour).toISOString();
    const previousFrom = new Date(now - 48 * hour).toISOString();
    const previousTo = new Date(now - 24 * hour).toISOString();

    const [current, previous] = await Promise.all([
      supabase
        .from("mentions")
        .select("id", { count: "exact", head: true })
        .eq("client_id", clientId)
        .gte("detected_at", currentFrom),
      supabase
        .from("mentions")
        .select("id", { count: "exact", head: true })
        .eq("client_id", clientId)
        .gte("detected_at", previousFrom)
        .lt("detected_at", previousTo)
    ]);

    return { current: current.count ?? 0, previous: previous.count ?? 0 };
  }

  if (metric === "citations") {
    const currentFrom = new Date(now - 24 * hour).toISOString();
    const previousFrom = new Date(now - 48 * hour).toISOString();
    const previousTo = new Date(now - 24 * hour).toISOString();

    const [current, previous] = await Promise.all([
      supabase
        .from("citations")
        .select("id", { count: "exact", head: true })
        .eq("client_id", clientId)
        .eq("status", "active")
        .gte("detected_at", currentFrom),
      supabase
        .from("citations")
        .select("id", { count: "exact", head: true })
        .eq("client_id", clientId)
        .eq("status", "active")
        .gte("detected_at", previousFrom)
        .lt("detected_at", previousTo)
    ]);

    return { current: current.count ?? 0, previous: previous.count ?? 0 };
  }

  if (metric === "sentiment") {
    const currentFrom = new Date(now - 24 * hour).toISOString();
    const previousFrom = new Date(now - 48 * hour).toISOString();
    const previousTo = new Date(now - 24 * hour).toISOString();

    const [currentRows, previousRows] = await Promise.all([
      supabase.from("mentions").select("sentiment_score").eq("client_id", clientId).gte("detected_at", currentFrom),
      supabase
        .from("mentions")
        .select("sentiment_score")
        .eq("client_id", clientId)
        .gte("detected_at", previousFrom)
        .lt("detected_at", previousTo)
    ]);

    const avg = (values: Array<{ sentiment_score: number | null }>) => {
      const filtered = values.map((row) => row.sentiment_score ?? null).filter((value): value is number => typeof value === "number");
      if (filtered.length === 0) return 0;
      return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
    };

    return {
      current: Number(avg(currentRows.data ?? []).toFixed(2)),
      previous: Number(avg(previousRows.data ?? []).toFixed(2))
    };
  }

  if (metric === "hallucinations") {
    const currentFrom = new Date(now - 7 * 24 * hour).toISOString();
    const previousFrom = new Date(now - 14 * 24 * hour).toISOString();
    const previousTo = new Date(now - 7 * 24 * hour).toISOString();

    const [current, previous] = await Promise.all([
      supabase
        .from("hallucinations")
        .select("id", { count: "exact", head: true })
        .eq("client_id", clientId)
        .in("risk_level", ["critical", "high"])
        .in("status", ["open", "monitoring"])
        .gte("detected_at", currentFrom),
      supabase
        .from("hallucinations")
        .select("id", { count: "exact", head: true })
        .eq("client_id", clientId)
        .in("risk_level", ["critical", "high"])
        .in("status", ["open", "monitoring"])
        .gte("detected_at", previousFrom)
        .lt("detected_at", previousTo)
    ]);

    return { current: current.count ?? 0, previous: previous.count ?? 0 };
  }

  const currentFrom = new Date(now - 30 * 24 * hour).toISOString();
  const previousFrom = new Date(now - 60 * 24 * hour).toISOString();
  const previousTo = new Date(now - 30 * 24 * hour).toISOString();

  const [current, previous] = await Promise.all([
    supabase
      .from("competitors")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId)
      .gte("created_at", currentFrom),
    supabase
      .from("competitors")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId)
      .gte("created_at", previousFrom)
      .lt("created_at", previousTo)
  ]);

  return { current: current.count ?? 0, previous: previous.count ?? 0 };
}

export async function getAlertsPagePayload(clientId: string | null): Promise<AlertsPagePayload> {
  const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken || !clientId) {
    return buildFallbackPayload();
  }

  const supabase = createServerSupabaseClient(accessToken);
  const [alertsResult, rulesResult, unreadResult] = await Promise.all([
    supabase.from("alerts").select("id,title,message,severity,read,created_at,client_id").eq("client_id", clientId).order("created_at", { ascending: false }).limit(120),
    supabase
      .from("alert_rules")
      .select("id,client_id,name,metric,condition,threshold,enabled,created_at")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
    supabase.from("alerts").select("id", { count: "exact", head: true }).eq("client_id", clientId).eq("read", false)
  ]);

  return {
    alerts: (alertsResult.data ?? []).map(mapAlert),
    rules: (rulesResult.data ?? []).map(mapRule),
    unreadCount: unreadResult.count ?? 0
  };
}

export async function getRecentAlertsAction(clientId: string | null, limit = 6) {
  const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken || !clientId) {
    return {
      alerts: fallbackAlerts.slice(0, limit),
      unreadCount: fallbackAlerts.filter((alert) => !alert.read).length
    };
  }

  const supabase = createServerSupabaseClient(accessToken);
  const [alertsResult, unreadResult] = await Promise.all([
    supabase.from("alerts").select("id,title,message,severity,read,created_at,client_id").eq("client_id", clientId).order("created_at", { ascending: false }).limit(limit),
    supabase.from("alerts").select("id", { count: "exact", head: true }).eq("client_id", clientId).eq("read", false)
  ]);

  return {
    alerts: (alertsResult.data ?? []).map(mapAlert),
    unreadCount: unreadResult.count ?? 0
  };
}

export async function markAlertsAsReadAction(alertIds: string[]) {
  const safeIds = alertIds.filter((id) => id && !id.startsWith("fallback-"));
  if (safeIds.length === 0) {
    return { ok: true };
  }

  const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return { ok: false, error: "Session not found." };
  }

  const supabase = createServerSupabaseClient(accessToken);
  const { error } = await supabase.from("alerts").update({ read: true }).in("id", safeIds);
  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/alerts");
  return { ok: true };
}

export async function createAlertRuleAction(input: {
  clientId: string;
  name: string;
  metric: AlertRuleMetric;
  condition: AlertRuleCondition;
  threshold: number;
}) {
  if (!input.clientId) {
    return { ok: false, error: "Client is required." };
  }

  const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return { ok: false, error: "Session not found." };
  }

  const cleanName = input.name.trim();
  if (!cleanName) {
    return { ok: false, error: "Rule name is required." };
  }

  const supabase = createServerSupabaseClient(accessToken);
  const { data, error } = await supabase
    .from("alert_rules")
    .insert({
      client_id: input.clientId,
      name: cleanName,
      metric: input.metric,
      condition: input.condition,
      threshold: Number(input.threshold),
      enabled: true
    })
    .select("id,client_id,name,metric,condition,threshold,enabled,created_at")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not create alert rule." };
  }

  revalidatePath("/alerts");
  return { ok: true, rule: mapRule(data) };
}

export async function evaluateAlertRulesAction(clientId: string | null) {
  const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken || !clientId) {
    return { ok: false, evaluated: 0, created: 0, error: "Session or client not found." };
  }

  const supabase = createServerSupabaseClient(accessToken);
  const rulesResult = await supabase
    .from("alert_rules")
    .select("id,client_id,name,metric,condition,threshold,enabled,created_at")
    .eq("client_id", clientId)
    .eq("enabled", true);

  const rules = (rulesResult.data ?? []).map(mapRule);
  if (rules.length === 0) {
    return { ok: true, evaluated: 0, created: 0 };
  }

  let created = 0;
  for (const rule of rules) {
    const snapshot = await metricSnapshot(supabase, rule.clientId, rule.metric);
    const triggered = evaluateCondition(snapshot, rule.condition, Number(rule.threshold));
    if (!triggered) continue;

    const recentAlert = await supabase
      .from("alerts")
      .select("id")
      .eq("alert_rule_id", rule.id)
      .eq("client_id", rule.clientId)
      .eq("read", false)
      .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .limit(1)
      .maybeSingle();
    if (recentAlert.data?.id) continue;

    const severity = severityForRule(rule, snapshot);
    const previousLabel = Number.isFinite(snapshot.previous) ? snapshot.previous.toFixed(2) : "0";
    const currentLabel = Number.isFinite(snapshot.current) ? snapshot.current.toFixed(2) : "0";
    const message = `${rule.metric} ${rule.condition} ${rule.threshold}. Current=${currentLabel}, previous=${previousLabel}.`;
    const insertResult = await supabase.from("alerts").insert({
      alert_rule_id: rule.id,
      client_id: rule.clientId,
      title: rule.name,
      message,
      severity
    });
    if (!insertResult.error) {
      created += 1;
    }
  }

  revalidatePath("/alerts");
  return { ok: true, evaluated: rules.length, created };
}
