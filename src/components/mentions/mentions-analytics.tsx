"use client";

import { createClient } from "@supabase/supabase-js";
import { format, formatDistanceToNowStrict } from "date-fns";
import { ArrowUpDown, Check, Copy, ExternalLink, Filter, Search } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { MentionAnalytics, MentionRecord } from "@/app/(dashboard)/actions/mentions";
import { FilterChips, type FilterChipItem } from "@/components/filters/filter-chips";
import { SentimentGauge } from "@/components/mentions/sentiment-gauge";
import { deriveMentionRisk, type MentionRiskLevel } from "@/lib/mentions/realtime";
import { cn } from "@/lib/utils";

type SortField = "detectedAt" | "platform" | "query" | "sentiment" | "risk" | "brandMentioned";
type SortDirection = "asc" | "desc";
type RiskFilter = "all" | MentionRiskLevel;
type DatePreset = "all" | "7d" | "30d" | "90d" | "custom";
type BrandFilter = "all" | "matched" | "unmatched";

type MentionsAnalyticsProps = {
  accessToken: string | null;
  analytics: MentionAnalytics;
  clientId: string | null;
  rows: MentionRecord[];
};

type InlineToken =
  | {
      type: "text";
      value: string;
    }
  | {
      type: "link";
      value: string;
      href: string;
    };

const SENTIMENT_COLORS = {
  positive: "#1f7a43",
  neutral: "#64748b",
  negative: "#b3261e"
};

const RISK_WEIGHTS: Record<MentionRiskLevel, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1
};

function riskBadgeClass(level: MentionRiskLevel) {
  if (level === "critical") return "border-red-200 bg-red-50 text-red-700";
  if (level === "high") return "border-orange-200 bg-orange-50 text-orange-700";
  if (level === "medium") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function sentimentBadgeClass(sentiment: MentionRecord["sentiment"]) {
  if (sentiment === "positive") return "border-[#d4e8d7] bg-[#f2faf4] text-[#1f6b40]";
  if (sentiment === "negative") return "border-[#f0c8c4] bg-[#fdf2f1] text-[#8e2e28]";
  return "border-[#d9dadd] bg-[#f6f7f8] text-ink";
}

function brandBadgeClass(brandMentioned: boolean) {
  if (brandMentioned) return "border-[#d4e8d7] bg-[#f2faf4] text-[#1f6b40]";
  return "border-[#f0c8c4] bg-[#fdf2f1] text-[#8e2e28]";
}

function startOfDay(input: Date) {
  const next = new Date(input);
  next.setHours(0, 0, 0, 0);
  return next.getTime();
}

function endOfDay(input: Date) {
  const next = new Date(input);
  next.setHours(23, 59, 59, 999);
  return next.getTime();
}

function normalizeText(value: string) {
  return value.toLowerCase().trim();
}

function compactText(value: string, limit: number) {
  if (value.length <= limit) {
    return {
      text: value,
      truncated: false
    };
  }

  return {
    text: `${value.slice(0, limit)}...`,
    truncated: true
  };
}

function normalizeUrl(url: string) {
  try {
    return new URL(url).toString();
  } catch {
    return null;
  }
}

function extractUrls(text: string) {
  const matches = text.match(/https?:\/\/[^\s)"'<>]+/g) ?? [];
  const unique = new Set<string>();
  for (const match of matches) {
    const normalized = normalizeUrl(match);
    if (normalized) {
      unique.add(normalized);
    }
  }
  return Array.from(unique);
}

function getUrlLabel(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function splitTextWithUrls(value: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  const regex = /(https?:\/\/[^\s)\]]+)/gi;
  let lastIndex = 0;

  for (const match of value.matchAll(regex)) {
    const rawUrl = match[1] ?? "";
    const index = match.index ?? 0;
    if (index > lastIndex) {
      tokens.push({
        type: "text",
        value: value.slice(lastIndex, index)
      });
    }

    tokens.push({
      type: "link",
      value: rawUrl,
      href: rawUrl
    });
    lastIndex = index + rawUrl.length;
  }

  if (lastIndex < value.length) {
    tokens.push({
      type: "text",
      value: value.slice(lastIndex)
    });
  }

  return tokens;
}

function parseInlineTokens(value: string): InlineToken[] {
  const markdownTokens: InlineToken[] = [];
  const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gi;
  let lastIndex = 0;

  for (const match of value.matchAll(regex)) {
    const text = match[1] ?? "";
    const url = match[2] ?? "";
    const index = match.index ?? 0;

    if (index > lastIndex) {
      markdownTokens.push({
        type: "text",
        value: value.slice(lastIndex, index)
      });
    }

    markdownTokens.push({
      type: "link",
      value: text,
      href: url
    });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < value.length) {
    markdownTokens.push({
      type: "text",
      value: value.slice(lastIndex)
    });
  }

  return markdownTokens.flatMap((token) => (token.type === "text" ? splitTextWithUrls(token.value) : [token]));
}

function renderInlineContent(value: string, keyPrefix: string): ReactNode {
  const tokens = parseInlineTokens(value);

  return tokens.map((token, index) => {
    if (token.type === "text") {
      return <span key={`${keyPrefix}-text-${index}`}>{token.value}</span>;
    }

    return (
      <a
        className="inline-flex items-center gap-1 break-all font-semibold text-secondary hover:underline"
        href={token.href}
        key={`${keyPrefix}-link-${index}`}
        rel="noreferrer"
        target="_blank"
      >
        {token.value}
        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
      </a>
    );
  });
}

function FormattedResponse({ text }: { text: string }) {
  const lines = text.split(/\r?\n/);
  const blocks: ReactNode[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]?.trim() ?? "";
    if (line.length === 0) {
      continue;
    }

    if (/^#{1,3}\s+/.test(line)) {
      const headingText = line.replace(/^#{1,3}\s+/, "");
      blocks.push(
        <h4 className="text-sm font-semibold text-ink md:text-base" key={`heading-${i}`}>
          {renderInlineContent(headingText, `heading-${i}`)}
        </h4>
      );
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      let cursor = i;
      while (cursor < lines.length && /^[-*]\s+/.test(lines[cursor]?.trim() ?? "")) {
        items.push((lines[cursor]?.trim() ?? "").replace(/^[-*]\s+/, ""));
        cursor += 1;
      }

      blocks.push(
        <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-ink" key={`ul-${i}`}>
          {items.map((item, itemIndex) => (
            <li key={`ul-${i}-item-${itemIndex}`}>{renderInlineContent(item, `ul-${i}-item-${itemIndex}`)}</li>
          ))}
        </ul>
      );

      i = cursor - 1;
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      let cursor = i;
      while (cursor < lines.length && /^\d+\.\s+/.test(lines[cursor]?.trim() ?? "")) {
        items.push((lines[cursor]?.trim() ?? "").replace(/^\d+\.\s+/, ""));
        cursor += 1;
      }

      blocks.push(
        <ol className="list-decimal space-y-1 pl-5 text-sm leading-relaxed text-ink" key={`ol-${i}`}>
          {items.map((item, itemIndex) => (
            <li key={`ol-${i}-item-${itemIndex}`}>{renderInlineContent(item, `ol-${i}-item-${itemIndex}`)}</li>
          ))}
        </ol>
      );

      i = cursor - 1;
      continue;
    }

    blocks.push(
      <p className="text-sm leading-relaxed text-ink" key={`p-${i}`}>
        {renderInlineContent(line, `p-${i}`)}
      </p>
    );
  }

  if (blocks.length === 0) {
    return <p className="text-sm text-text-secondary">No response text found.</p>;
  }

  return <div className="space-y-2">{blocks}</div>;
}

export function MentionsAnalytics({ accessToken, analytics, clientId, rows }: MentionsAnalyticsProps) {
  const pendingRowsRef = useRef<MentionRecord[]>([]);
  const flushTimerRef = useRef<number | null>(null);
  const copyTimerRef = useRef<number | null>(null);

  const [liveRows, setLiveRows] = useState(rows);
  const [newMentionsCount, setNewMentionsCount] = useState(0);
  const [sortField, setSortField] = useState<SortField>("detectedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sentimentFilter, setSentimentFilter] = useState<"all" | MentionRecord["sentiment"]>("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [brandFilter, setBrandFilter] = useState<BrandFilter>("all");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [copiedRowId, setCopiedRowId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const pageSize = 7;

  const platformOptions = useMemo(() => Array.from(new Set(liveRows.map((row) => row.platform))), [liveRows]);

  const liveAnalytics = useMemo<MentionAnalytics>(() => {
    if (liveRows.length === 0) return analytics;
    return {
      total: liveRows.length,
      positive: liveRows.filter((row) => row.sentiment === "positive").length,
      neutral: liveRows.filter((row) => row.sentiment === "neutral").length,
      negative: liveRows.filter((row) => row.sentiment === "negative").length
    };
  }, [analytics, liveRows]);

  const brandMatchedCount = useMemo(() => liveRows.filter((row) => row.brandMentioned).length, [liveRows]);
  const brandUnmatchedCount = liveAnalytics.total - brandMatchedCount;
  const brandMatchRatio = liveAnalytics.total === 0 ? 0 : Math.round((brandMatchedCount / liveAnalytics.total) * 100);

  const chartData = useMemo(
    () => [
      { name: "Positive", value: liveAnalytics.positive, color: SENTIMENT_COLORS.positive },
      { name: "Neutral", value: liveAnalytics.neutral, color: SENTIMENT_COLORS.neutral },
      { name: "Negative", value: liveAnalytics.negative, color: SENTIMENT_COLORS.negative }
    ],
    [liveAnalytics.negative, liveAnalytics.neutral, liveAnalytics.positive]
  );

  const sentimentScore = useMemo(() => {
    if (liveAnalytics.total === 0) return 0;
    return (liveAnalytics.positive - liveAnalytics.negative) / liveAnalytics.total;
  }, [liveAnalytics.negative, liveAnalytics.positive, liveAnalytics.total]);

  const positiveRatio = useMemo(() => {
    if (liveAnalytics.total === 0) return 0;
    return Math.round((liveAnalytics.positive / liveAnalytics.total) * 100);
  }, [liveAnalytics.positive, liveAnalytics.total]);

  const avgSentimentScore = useMemo(() => {
    const scores = liveRows.map((row) => row.sentimentScore).filter((score): score is number => typeof score === "number");
    if (scores.length === 0) {
      return 0;
    }

    const sum = scores.reduce((acc, score) => acc + score, 0);
    return sum / scores.length;
  }, [liveRows]);

  const filteredRows = useMemo(() => {
    const now = Date.now();
    const normalizedSearch = normalizeText(searchTerm);
    const presetToStart: Record<Exclude<DatePreset, "all" | "custom">, number> = {
      "7d": now - 7 * 24 * 60 * 60 * 1000,
      "30d": now - 30 * 24 * 60 * 60 * 1000,
      "90d": now - 90 * 24 * 60 * 60 * 1000
    };

    return liveRows.filter((row) => {
      const sentimentMatch = sentimentFilter === "all" ? true : row.sentiment === sentimentFilter;
      const platformMatch = platformFilter === "all" ? true : row.platform === platformFilter;
      const riskMatch = riskFilter === "all" ? true : deriveMentionRisk(row) === riskFilter;
      const brandMatch =
        brandFilter === "all" ? true : brandFilter === "matched" ? row.brandMentioned === true : row.brandMentioned === false;

      const haystack = `${row.query} ${row.content} ${row.platform}`.toLowerCase();
      const searchMatch = normalizedSearch.length === 0 ? true : haystack.includes(normalizedSearch);

      let dateMatch = true;
      const detectedTime = Date.parse(row.detectedAt);
      if (!Number.isNaN(detectedTime)) {
        if (datePreset === "7d" || datePreset === "30d" || datePreset === "90d") {
          dateMatch = detectedTime >= presetToStart[datePreset];
        } else if (datePreset === "custom") {
          const fromTime = dateFrom ? startOfDay(new Date(dateFrom)) : Number.NEGATIVE_INFINITY;
          const toTime = dateTo ? endOfDay(new Date(dateTo)) : Number.POSITIVE_INFINITY;
          dateMatch = detectedTime >= fromTime && detectedTime <= toTime;
        }
      }

      return sentimentMatch && platformMatch && riskMatch && brandMatch && searchMatch && dateMatch;
    });
  }, [brandFilter, dateFrom, datePreset, dateTo, liveRows, platformFilter, riskFilter, searchTerm, sentimentFilter]);

  const activeFilterChips = useMemo<FilterChipItem[]>(() => {
    const chips: FilterChipItem[] = [];

    if (searchTerm.trim().length > 0) {
      chips.push({
        id: "search-term",
        label: `Search: ${searchTerm}`,
        onRemove: () => setSearchTerm("")
      });
    }

    if (platformFilter !== "all") {
      chips.push({
        id: `platform-${platformFilter}`,
        label: `Platform: ${platformFilter}`,
        onRemove: () => setPlatformFilter("all")
      });
    }

    if (sentimentFilter !== "all") {
      chips.push({
        id: `sentiment-${sentimentFilter}`,
        label: `Sentiment: ${sentimentFilter}`,
        onRemove: () => setSentimentFilter("all")
      });
    }

    if (riskFilter !== "all") {
      chips.push({
        id: `risk-${riskFilter}`,
        label: `Risk: ${riskFilter}`,
        onRemove: () => setRiskFilter("all")
      });
    }

    if (brandFilter !== "all") {
      chips.push({
        id: `brand-${brandFilter}`,
        label: brandFilter === "matched" ? "Brand: Matched" : "Brand: No Match",
        onRemove: () => setBrandFilter("all")
      });
    }

    if (datePreset !== "all") {
      if (datePreset === "custom") {
        const fromText = dateFrom || "Any";
        const toText = dateTo || "Any";
        chips.push({
          id: "date-custom",
          label: `Date: ${fromText} to ${toText}`,
          onRemove: () => {
            setDatePreset("all");
            setDateFrom("");
            setDateTo("");
          }
        });
      } else {
        chips.push({
          id: `date-${datePreset}`,
          label: `Date: Last ${datePreset.slice(0, -1)} days`,
          onRemove: () => setDatePreset("all")
        });
      }
    }

    return chips;
  }, [brandFilter, dateFrom, datePreset, dateTo, platformFilter, riskFilter, searchTerm, sentimentFilter]);

  function clearAllFilters() {
    setSearchTerm("");
    setPlatformFilter("all");
    setSentimentFilter("all");
    setRiskFilter("all");
    setBrandFilter("all");
    setDatePreset("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  const flushPendingRows = useCallback(() => {
    flushTimerRef.current = null;
    if (pendingRowsRef.current.length === 0) {
      return;
    }

    const batch = pendingRowsRef.current.splice(0);
    setLiveRows((prev) => {
      const seen = new Set(prev.map((item) => item.id));
      const nextRows = batch.filter((item) => !seen.has(item.id));
      if (nextRows.length === 0) {
        return prev;
      }
      return [...nextRows, ...prev].slice(0, 350);
    });
    setNewMentionsCount((prev) => prev + batch.length);
  }, []);

  const queueIncomingRow = useCallback(
    (row: MentionRecord) => {
      pendingRowsRef.current.push(row);
      if (flushTimerRef.current !== null) {
        return;
      }
      flushTimerRef.current = window.setTimeout(flushPendingRows, 220);
    },
    [flushPendingRows]
  );

  const handleCopy = useCallback(async (rowId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedRowId(rowId);
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = window.setTimeout(() => {
        setCopiedRowId((current) => (current === rowId ? null : current));
      }, 1500);
    } catch {
      setCopiedRowId(null);
    }
  }, []);

  useEffect(() => {
    setLiveRows(rows);
    setNewMentionsCount(0);
    setExpandedRows({});
    setCopiedRowId(null);
    setPage(1);
    pendingRowsRef.current = [];
    if (flushTimerRef.current !== null) {
      window.clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
  }, [rows]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl || !supabasePublishableKey) {
      return;
    }

    const supabase = createClient(supabaseUrl, supabasePublishableKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    supabase.realtime.setAuth(accessToken);
    const channel = supabase
      .channel(`prompt-runs-table-${clientId ?? "all"}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "prompt_runs",
          filter: clientId ? `client_id=eq.${clientId}` : undefined
        },
        async (payload) => {
          const runId = String(payload.new.id);
          const { data } = await supabase
            .from("prompt_runs")
            .select("id,answer,sentiment,sentiment_score,brand_mentioned,detected_at,platforms(name,slug),queries(text)")
            .eq("id", runId)
            .maybeSingle();

          if (!data) {
            return;
          }

          const platformRelation = Array.isArray(data.platforms) ? data.platforms[0] : data.platforms;
          const queryRelation = Array.isArray(data.queries) ? data.queries[0] : data.queries;

          const nextRow: MentionRecord = {
            id: String(data.id),
            platform: platformRelation?.name ?? "Unknown",
            platformSlug: platformRelation?.slug ?? "unknown",
            query: queryRelation?.text ?? "Unknown query",
            content: data.answer ?? "",
            sentiment: (data.sentiment as MentionRecord["sentiment"]) ?? "neutral",
            sentimentScore: data.sentiment_score ?? null,
            detectedAt: data.detected_at,
            brandMentioned: data.brand_mentioned ?? false,
            source: "prompt_run"
          };

          queueIncomingRow(nextRow);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [accessToken, clientId, queueIncomingRow]);

  useEffect(() => {
    return () => {
      if (flushTimerRef.current !== null) {
        window.clearTimeout(flushTimerRef.current);
      }
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const sortedRows = useMemo(() => {
    const copy = [...filteredRows];
    copy.sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1;

      if (sortField === "detectedAt") {
        return (new Date(a.detectedAt).getTime() - new Date(b.detectedAt).getTime()) * direction;
      }

      if (sortField === "risk") {
        return (RISK_WEIGHTS[deriveMentionRisk(a)] - RISK_WEIGHTS[deriveMentionRisk(b)]) * direction;
      }

      if (sortField === "brandMentioned") {
        return ((a.brandMentioned ? 1 : 0) - (b.brandMentioned ? 1 : 0)) * direction;
      }

      return String(a[sortField]).localeCompare(String(b[sortField])) * direction;
    });

    return copy;
  }, [filteredRows, sortDirection, sortField]);

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pagedRows = sortedRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  function toggleExpanded(rowId: string) {
    setExpandedRows((prev) => ({
      ...prev,
      [rowId]: !prev[rowId]
    }));
  }

  const sortOptions: Array<{ value: SortField; label: string }> = [
    { value: "detectedAt", label: "Newest" },
    { value: "risk", label: "Risk" },
    { value: "brandMentioned", label: "Brand Match" },
    { value: "sentiment", label: "Sentiment" },
    { value: "platform", label: "Platform" },
    { value: "query", label: "Query" }
  ];

  return (
    <>
      {newMentionsCount > 0 ? (
        <section className="mb-4 rounded-2xl border border-brand/30 bg-brand-soft px-4 py-2.5 text-xs font-semibold text-ink">
          {newMentionsCount} new live output{newMentionsCount > 1 ? "s" : ""} received. Stream updated in real-time.
        </section>
      ) : null}

      <section className="surface-panel relative overflow-hidden rounded-3xl border border-surface-border bg-gradient-to-br from-[#141820] via-[#1b2432] to-[#101218] p-5 text-white md:p-7">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute -bottom-16 left-1/4 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="relative z-10">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/70">Prompt Output Intelligence</p>
          <h2 className="mt-2 text-2xl font-semibold leading-tight md:text-3xl">Mentions feed redesigned for live model responses</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/75">
            Every run is shown with readable response formatting, source links, sentiment, and brand-match status so you can audit outputs without opening raw logs.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-6">
            <article className="rounded-2xl border border-white/15 bg-white/10 px-3 py-3">
              <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/65">Total Outputs</p>
              <p className="mt-1 text-2xl font-semibold text-white">{liveAnalytics.total}</p>
            </article>
            <article className="rounded-2xl border border-white/15 bg-white/10 px-3 py-3">
              <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/65">Brand Match</p>
              <p className="mt-1 text-2xl font-semibold text-white">{brandMatchedCount}</p>
            </article>
            <article className="rounded-2xl border border-white/15 bg-white/10 px-3 py-3">
              <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/65">No Match</p>
              <p className="mt-1 text-2xl font-semibold text-white">{brandUnmatchedCount}</p>
            </article>
            <article className="rounded-2xl border border-white/15 bg-white/10 px-3 py-3">
              <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/65">Match Rate</p>
              <p className="mt-1 text-2xl font-semibold text-white">{brandMatchRatio}%</p>
            </article>
            <article className="rounded-2xl border border-white/15 bg-white/10 px-3 py-3">
              <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/65">Positive Share</p>
              <p className="mt-1 text-2xl font-semibold text-white">{positiveRatio}%</p>
            </article>
            <article className="rounded-2xl border border-white/15 bg-white/10 px-3 py-3">
              <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/65">Platforms</p>
              <p className="mt-1 text-2xl font-semibold text-white">{platformOptions.length}</p>
            </article>
          </div>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(300px,380px)_minmax(0,1fr)]">
        <article className="surface-panel p-5">
          <h2 className="text-lg font-semibold text-ink">Sentiment + Risk Snapshot</h2>
          <p className="mt-1 text-xs text-text-secondary">Built from live run responses under current client scope.</p>
          <div className="mt-4 h-[250px] w-full">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={chartData} dataKey="value" innerRadius={54} outerRadius={86} paddingAngle={2}>
                  {chartData.map((entry) => (
                    <Cell fill={entry.color} key={entry.name} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-surface-border bg-brand-soft px-3 py-2">
              <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-text-secondary">Positive</p>
              <p className="mt-1 text-lg font-semibold text-[#1f6b40]">{liveAnalytics.positive}</p>
            </div>
            <div className="rounded-xl border border-surface-border bg-brand-soft px-3 py-2">
              <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-text-secondary">Neutral</p>
              <p className="mt-1 text-lg font-semibold text-ink">{liveAnalytics.neutral}</p>
            </div>
            <div className="rounded-xl border border-surface-border bg-brand-soft px-3 py-2">
              <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-text-secondary">Negative</p>
              <p className="mt-1 text-lg font-semibold text-[#8e2e28]">{liveAnalytics.negative}</p>
            </div>
          </div>

          <div className="mt-4">
            <SentimentGauge score={sentimentScore} />
          </div>

          <div className="mt-3 rounded-xl border border-surface-border bg-brand-soft/40 px-3 py-2 text-xs text-text-secondary">
            Average sentiment score: <span className="font-semibold text-ink">{avgSentimentScore.toFixed(2)}</span>
          </div>
        </article>

        <article className="surface-panel p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-ink">Response Stream</h2>
              <p className="mt-1 text-xs text-text-secondary">Readable prompt outputs with structured text rendering and source links.</p>
            </div>
            <button
              className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl border border-surface-border bg-white px-3 text-xs font-semibold text-ink hover:bg-brand-soft"
              onClick={() => setFiltersOpen((prev) => !prev)}
              type="button"
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterChips.length > 0 ? (
                <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white">{activeFilterChips.length}</span>
              ) : null}
            </button>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1fr)_170px_130px]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
              <input
                className="focus-ring min-h-11 w-full rounded-xl border border-surface-border bg-white pl-10 pr-3 text-sm text-ink placeholder:text-text-secondary"
                onChange={(event) => {
                  setPage(1);
                  setSearchTerm(event.target.value);
                }}
                placeholder="Search query or output text"
                type="text"
                value={searchTerm}
              />
            </label>

            <select
              className="focus-ring min-h-11 rounded-xl border border-surface-border bg-white px-3 text-xs font-semibold text-ink"
              onChange={(event) => {
                setPage(1);
                setSortField(event.target.value as SortField);
              }}
              value={sortField}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              className="focus-ring inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border border-surface-border bg-white px-3 text-xs font-semibold text-ink hover:bg-brand-soft"
              onClick={() => setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))}
              type="button"
            >
              <ArrowUpDown className="h-4 w-4" />
              {sortDirection === "desc" ? "Desc" : "Asc"}
            </button>
          </div>

          {filtersOpen ? (
            <div className="mt-3 rounded-2xl border border-surface-border bg-brand-soft/30 p-3 md:p-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="text-xs font-semibold text-ink">
                  Platform
                  <select
                    className="focus-ring mt-1 min-h-11 w-full rounded-xl border border-surface-border bg-white px-3 text-xs"
                    onChange={(event) => {
                      setPage(1);
                      setPlatformFilter(event.target.value);
                    }}
                    value={platformFilter}
                  >
                    <option value="all">All Platforms</option>
                    {platformOptions.map((platform) => (
                      <option key={platform} value={platform}>
                        {platform}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs font-semibold text-ink">
                  Sentiment
                  <select
                    className="focus-ring mt-1 min-h-11 w-full rounded-xl border border-surface-border bg-white px-3 text-xs"
                    onChange={(event) => {
                      setPage(1);
                      setSentimentFilter(event.target.value as "all" | MentionRecord["sentiment"]);
                    }}
                    value={sentimentFilter}
                  >
                    <option value="all">All Sentiment</option>
                    <option value="positive">Positive</option>
                    <option value="neutral">Neutral</option>
                    <option value="negative">Negative</option>
                  </select>
                </label>

                <label className="text-xs font-semibold text-ink">
                  Brand Match
                  <select
                    className="focus-ring mt-1 min-h-11 w-full rounded-xl border border-surface-border bg-white px-3 text-xs"
                    onChange={(event) => {
                      setPage(1);
                      setBrandFilter(event.target.value as BrandFilter);
                    }}
                    value={brandFilter}
                  >
                    <option value="all">All</option>
                    <option value="matched">Matched</option>
                    <option value="unmatched">No Match</option>
                  </select>
                </label>

                <label className="text-xs font-semibold text-ink">
                  Risk
                  <select
                    className="focus-ring mt-1 min-h-11 w-full rounded-xl border border-surface-border bg-white px-3 text-xs"
                    onChange={(event) => {
                      setPage(1);
                      setRiskFilter(event.target.value as RiskFilter);
                    }}
                    value={riskFilter}
                  >
                    <option value="all">All Risks</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </label>

                <label className="text-xs font-semibold text-ink md:col-span-2">
                  Date Range
                  <select
                    className="focus-ring mt-1 min-h-11 w-full rounded-xl border border-surface-border bg-white px-3 text-xs"
                    onChange={(event) => {
                      const nextPreset = event.target.value as DatePreset;
                      setPage(1);
                      setDatePreset(nextPreset);
                      if (nextPreset !== "custom") {
                        setDateFrom("");
                        setDateTo("");
                      }
                    }}
                    value={datePreset}
                  >
                    <option value="all">All Time</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="90d">Last 90 Days</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </label>
              </div>

              {datePreset === "custom" ? (
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <label className="text-xs font-semibold text-ink">
                    From
                    <input
                      className="focus-ring mt-1 min-h-11 w-full rounded-xl border border-surface-border bg-white px-3 text-xs"
                      onChange={(event) => {
                        setPage(1);
                        setDateFrom(event.target.value);
                      }}
                      type="date"
                      value={dateFrom}
                    />
                  </label>
                  <label className="text-xs font-semibold text-ink">
                    To
                    <input
                      className="focus-ring mt-1 min-h-11 w-full rounded-xl border border-surface-border bg-white px-3 text-xs"
                      onChange={(event) => {
                        setPage(1);
                        setDateTo(event.target.value);
                      }}
                      type="date"
                      value={dateTo}
                    />
                  </label>
                </div>
              ) : null}
            </div>
          ) : null}

          <FilterChips chips={activeFilterChips} onClearAll={clearAllFilters} />

          <div className="mt-3 space-y-3">
            {pagedRows.length === 0 ? (
              <p className="rounded-2xl border border-surface-border bg-white px-4 py-5 text-sm text-text-secondary">
                No output matches these filters.
              </p>
            ) : (
              pagedRows.map((row) => {
                const riskLevel = deriveMentionRisk(row);
                const expanded = expandedRows[row.id] ?? false;
                const compact = compactText(row.content, 920);
                const displayText = expanded ? row.content : compact.text;
                const detectedAt = new Date(row.detectedAt);
                const responseUrls = extractUrls(row.content).slice(0, 4);
                const isCopied = copiedRowId === row.id;

                return (
                  <article
                    className="group relative overflow-hidden rounded-2xl border border-surface-border bg-white p-4 shadow-soft transition duration-150 hover:-translate-y-0.5 hover:border-[#c5c8cf] hover:shadow-panel md:p-5"
                    key={row.id}
                  >
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#1f7a43] via-[#2563eb] to-[#8e2e28]" />

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-md border border-surface-border bg-brand-soft px-2 py-1 text-[11px] font-semibold text-ink">{row.platform}</span>
                      <span className={cn("rounded-md border px-2 py-1 text-[11px] font-semibold capitalize", sentimentBadgeClass(row.sentiment))}>{row.sentiment}</span>
                      <span className={cn("rounded-md border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]", riskBadgeClass(riskLevel))}>{riskLevel}</span>
                      <span className={cn("rounded-md border px-2 py-1 text-[11px] font-semibold", brandBadgeClass(row.brandMentioned))}>
                        {row.brandMentioned ? "Brand matched" : "No brand match"}
                      </span>
                      <span className="rounded-md border border-surface-border bg-white px-2 py-1 text-[11px] font-semibold text-text-secondary">
                        {row.source === "prompt_run" ? "Live Run" : "Mention Record"}
                      </span>
                    </div>

                    <h3 className="mt-3 text-base font-semibold leading-snug text-ink md:text-lg">{row.query}</h3>
                    <p className="mt-1 text-[11px] text-text-secondary">
                      {formatDistanceToNowStrict(detectedAt, { addSuffix: true })} | {format(detectedAt, "yyyy-MM-dd HH:mm")}
                    </p>

                    <div className="relative mt-3 rounded-2xl border border-surface-border bg-[#fafbfd] p-3 md:p-4">
                      <FormattedResponse text={displayText} />
                      {!expanded && compact.truncated ? <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#fafbfd] to-transparent" /> : null}
                    </div>

                    {responseUrls.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {responseUrls.map((url) => (
                          <a
                            className="focus-ring inline-flex min-h-11 items-center gap-1 rounded-xl border border-surface-border bg-white px-3 text-xs font-semibold text-secondary hover:bg-brand-soft"
                            href={url}
                            key={url}
                            rel="noreferrer"
                            target="_blank"
                          >
                            {getUrlLabel(url)}
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[11px] text-text-secondary">
                        Sentiment score: {typeof row.sentimentScore === "number" ? row.sentimentScore.toFixed(2) : "N/A"}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          className="focus-ring inline-flex min-h-11 items-center rounded-xl border border-surface-border bg-white px-3 text-xs font-semibold text-ink hover:bg-brand-soft"
                          onClick={() => handleCopy(row.id, row.content)}
                          type="button"
                        >
                          {isCopied ? <Check className="mr-1 h-4 w-4 text-success" /> : <Copy className="mr-1 h-4 w-4" />}
                          {isCopied ? "Copied" : "Copy Response"}
                        </button>
                        {compact.truncated ? (
                          <button
                            className="focus-ring inline-flex min-h-11 items-center rounded-xl border border-surface-border bg-white px-3 text-xs font-semibold text-ink hover:bg-brand-soft"
                            onClick={() => toggleExpanded(row.id)}
                            type="button"
                          >
                            {expanded ? "Collapse" : "Read Full Response"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs">
            <p className="text-text-secondary">
              Page {safePage} / {pageCount} | {sortedRows.length} results
            </p>
            <div className="flex gap-2">
              <button
                className="focus-ring min-h-11 rounded-xl border border-surface-border bg-white px-3 text-ink disabled:cursor-not-allowed disabled:opacity-60"
                disabled={safePage <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                type="button"
              >
                Previous
              </button>
              <button
                className="focus-ring min-h-11 rounded-xl border border-surface-border bg-white px-3 text-ink disabled:cursor-not-allowed disabled:opacity-60"
                disabled={safePage >= pageCount}
                onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
                type="button"
              >
                Next
              </button>
            </div>
          </div>
        </article>
      </section>
    </>
  );
}
