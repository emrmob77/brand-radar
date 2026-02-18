"use client";

import { createClient } from "@supabase/supabase-js";
import { format } from "date-fns";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Filter } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { MentionAnalytics, MentionRecord } from "@/app/(dashboard)/actions/mentions";
import { FilterChips, type FilterChipItem } from "@/components/filters/filter-chips";
import { SentimentGauge } from "@/components/mentions/sentiment-gauge";
import { deriveMentionRisk, type MentionRiskLevel } from "@/lib/mentions/realtime";
import { cn } from "@/lib/utils";

type SortField = "platform" | "sentiment" | "detectedAt" | "query";
type SortDirection = "asc" | "desc";
type RiskFilter = "all" | MentionRiskLevel;
type DatePreset = "all" | "7d" | "30d" | "90d" | "custom";

type MentionsAnalyticsProps = {
  accessToken: string | null;
  analytics: MentionAnalytics;
  clientId: string | null;
  rows: MentionRecord[];
};

const SENTIMENT_COLORS = {
  positive: "#22c55e",
  neutral: "#64748b",
  negative: "#ef4444"
};

function riskBadgeClass(level: MentionRiskLevel) {
  if (level === "critical") return "border-red-200 bg-red-50 text-red-700";
  if (level === "high") return "border-orange-200 bg-orange-50 text-orange-700";
  if (level === "medium") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
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

export function MentionsAnalytics({ accessToken, analytics, clientId, rows }: MentionsAnalyticsProps) {
  const pendingRowsRef = useRef<MentionRecord[]>([]);
  const flushTimerRef = useRef<number | null>(null);
  const [liveRows, setLiveRows] = useState(rows);
  const [newMentionsCount, setNewMentionsCount] = useState(0);
  const [sortField, setSortField] = useState<SortField>("detectedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sentimentFilter, setSentimentFilter] = useState<"all" | MentionRecord["sentiment"]>("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

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

  const filteredRows = useMemo(() => {
    const now = Date.now();
    const presetToStart: Record<Exclude<DatePreset, "all" | "custom">, number> = {
      "7d": now - 7 * 24 * 60 * 60 * 1000,
      "30d": now - 30 * 24 * 60 * 60 * 1000,
      "90d": now - 90 * 24 * 60 * 60 * 1000
    };

    return liveRows.filter((row) => {
      const sentimentMatch = sentimentFilter === "all" ? true : row.sentiment === sentimentFilter;
      const platformMatch = platformFilter === "all" ? true : row.platform === platformFilter;
      const riskMatch = riskFilter === "all" ? true : deriveMentionRisk(row) === riskFilter;

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

      return sentimentMatch && platformMatch && riskMatch && dateMatch;
    });
  }, [dateFrom, datePreset, dateTo, liveRows, platformFilter, riskFilter, sentimentFilter]);

  const activeFilterChips = useMemo<FilterChipItem[]>(() => {
    const chips: FilterChipItem[] = [];

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
  }, [dateFrom, datePreset, dateTo, platformFilter, riskFilter, sentimentFilter]);

  function clearAllFilters() {
    setPlatformFilter("all");
    setSentimentFilter("all");
    setRiskFilter("all");
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
      return [...nextRows, ...prev].slice(0, 300);
    });
    setNewMentionsCount((prev) => prev + batch.length);
  }, []);

  const queueIncomingRow = useCallback(
    (row: MentionRecord) => {
      pendingRowsRef.current.push(row);
      if (flushTimerRef.current !== null) {
        return;
      }
      flushTimerRef.current = window.setTimeout(flushPendingRows, 240);
    },
    [flushPendingRows]
  );

  useEffect(() => {
    setLiveRows(rows);
    setNewMentionsCount(0);
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
      .channel(`mentions-table-${clientId ?? "all"}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mentions",
          filter: clientId ? `client_id=eq.${clientId}` : undefined
        },
        async (payload) => {
          const mentionId = String(payload.new.id);
          const { data } = await supabase
            .from("mentions")
            .select("id,query,content,sentiment,sentiment_score,detected_at,platforms(name,slug)")
            .eq("id", mentionId)
            .maybeSingle();
          if (!data) return;

          const platformRelation = Array.isArray(data.platforms) ? data.platforms[0] : data.platforms;
          const nextRow: MentionRecord = {
            id: String(data.id),
            platform: platformRelation?.name ?? "Unknown",
            platformSlug: platformRelation?.slug ?? "unknown",
            query: data.query,
            content: data.content,
            sentiment: (data.sentiment as MentionRecord["sentiment"]) ?? "neutral",
            sentimentScore: data.sentiment_score ?? null,
            detectedAt: data.detected_at
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
    };
  }, []);

  const sortedRows = useMemo(() => {
    const copy = [...filteredRows];
    copy.sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1;

      if (sortField === "detectedAt") {
        return (new Date(a.detectedAt).getTime() - new Date(b.detectedAt).getTime()) * direction;
      }

      return a[sortField].localeCompare(b[sortField]) * direction;
    });

    return copy;
  }, [filteredRows, sortDirection, sortField]);

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pagedRows = sortedRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  function setSort(next: SortField) {
    setPage(1);
    if (next === sortField) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(next);
    setSortDirection("asc");
  }

  return (
    <>
      {newMentionsCount > 0 ? (
        <section className="mb-4 rounded-xl border border-brand/30 bg-brand-soft px-3 py-2 text-xs font-semibold text-ink">
          {newMentionsCount} new mentions received, table updated live.
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <article className="surface-panel p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">Total Mentions</p>
          <p className="mt-2 text-3xl font-extrabold text-ink">{liveAnalytics.total}</p>
        </article>
        <article className="surface-panel p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">Positive</p>
          <p className="mt-2 text-3xl font-extrabold text-success">{liveAnalytics.positive}</p>
        </article>
        <article className="surface-panel p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">Neutral</p>
          <p className="mt-2 text-3xl font-extrabold text-ink">{liveAnalytics.neutral}</p>
        </article>
        <article className="surface-panel p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">Negative</p>
          <p className="mt-2 text-3xl font-extrabold text-critical">{liveAnalytics.negative}</p>
        </article>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <article className="surface-panel p-5 lg:col-span-1">
          <h2 className="text-lg font-bold text-ink">Sentiment Distribution</h2>
          <div className="mt-4 h-[260px] w-full">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={chartData} dataKey="value" innerRadius={58} outerRadius={88} paddingAngle={2}>
                  {chartData.map((entry) => (
                    <Cell fill={entry.color} key={entry.name} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <SentimentGauge score={sentimentScore} />
        </article>

        <article className="surface-panel p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-ink">Mention Table</h2>
            <button
              className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl border border-surface-border bg-white px-3 py-2 text-xs font-semibold text-ink hover:bg-brand-soft"
              onClick={() => setFiltersOpen((prev) => !prev)}
              type="button"
            >
              <Filter className="h-3.5 w-3.5" />
              Advanced Filters
              {activeFilterChips.length > 0 ? (
                <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white">{activeFilterChips.length}</span>
              ) : null}
            </button>
          </div>

          {filtersOpen ? (
            <div className="mt-3 rounded-xl border border-surface-border bg-brand-soft/35 p-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="text-xs font-semibold text-ink">
                  Platform
                  <select
                    className="focus-ring mt-1 min-h-11 w-full rounded-xl border border-surface-border bg-white px-3 py-2 text-xs"
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
                    className="focus-ring mt-1 min-h-11 w-full rounded-xl border border-surface-border bg-white px-3 py-2 text-xs"
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
                  Risk Level
                  <select
                    className="focus-ring mt-1 min-h-11 w-full rounded-xl border border-surface-border bg-white px-3 py-2 text-xs"
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

                <label className="text-xs font-semibold text-ink">
                  Date Range
                  <select
                    className="focus-ring mt-1 min-h-11 w-full rounded-xl border border-surface-border bg-white px-3 py-2 text-xs"
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
                      className="focus-ring mt-1 min-h-11 w-full rounded-xl border border-surface-border bg-white px-3 py-2 text-xs"
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
                      className="focus-ring mt-1 min-h-11 w-full rounded-xl border border-surface-border bg-white px-3 py-2 text-xs"
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

          <div className="mt-4 space-y-2 sm:hidden">
            {pagedRows.length === 0 ? (
              <p className="rounded-xl border border-surface-border bg-white px-3 py-4 text-sm text-text-secondary">No mention matches these filters.</p>
            ) : (
              pagedRows.map((row) => {
                const riskLevel = deriveMentionRisk(row);
                return (
                  <article className="rounded-xl border border-surface-border bg-white p-3" key={row.id}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-ink">{row.platform}</p>
                      <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]", riskBadgeClass(riskLevel))}>
                        {riskLevel}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-ink">{row.query}</p>
                    <p className="mt-1 text-xs leading-relaxed text-text-secondary">{row.content}</p>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="capitalize text-ink">{row.sentiment}</span>
                      <span className="text-text-secondary">{format(new Date(row.detectedAt), "yyyy-MM-dd HH:mm")}</span>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          <div className="mt-4 hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-surface-border text-xs uppercase tracking-[0.12em] text-text-secondary">
                  <th className="px-2 py-2">
                    <button onClick={() => setSort("platform")} type="button">
                      Platform
                    </button>
                  </th>
                  <th className="px-2 py-2">
                    <button onClick={() => setSort("query")} type="button">
                      Query
                    </button>
                  </th>
                  <th className="px-2 py-2">Content</th>
                  <th className="px-2 py-2">
                    <button onClick={() => setSort("sentiment")} type="button">
                      Sentiment
                    </button>
                  </th>
                  <th className="px-2 py-2">Risk</th>
                  <th className="px-2 py-2">
                    <button onClick={() => setSort("detectedAt")} type="button">
                      Timestamp
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.length === 0 ? (
                  <tr>
                    <td className="px-2 py-6 text-sm text-text-secondary" colSpan={6}>
                      No mention matches these filters.
                    </td>
                  </tr>
                ) : (
                  pagedRows.map((row) => {
                    const riskLevel = deriveMentionRisk(row);
                    return (
                      <tr className="border-b border-surface-border/70" key={row.id}>
                        <td className="px-2 py-3 font-semibold text-ink">{row.platform}</td>
                        <td className="px-2 py-3 text-ink">{row.query}</td>
                        <td className="max-w-[320px] truncate px-2 py-3 text-text-secondary">{row.content}</td>
                        <td className="px-2 py-3 capitalize text-ink">{row.sentiment}</td>
                        <td className="px-2 py-3">
                          <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em]", riskBadgeClass(riskLevel))}>
                            {riskLevel}
                          </span>
                        </td>
                        <td className="px-2 py-3 text-text-secondary">{format(new Date(row.detectedAt), "yyyy-MM-dd HH:mm")}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs">
            <p className="text-text-secondary">
              Page {safePage} / {pageCount}
            </p>
            <div className="flex gap-2">
              <button
                className="focus-ring rounded-lg border border-surface-border bg-white px-2.5 py-1.5 text-ink disabled:cursor-not-allowed disabled:opacity-60"
                disabled={safePage <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                type="button"
              >
                Previous
              </button>
              <button
                className="focus-ring rounded-lg border border-surface-border bg-white px-2.5 py-1.5 text-ink disabled:cursor-not-allowed disabled:opacity-60"
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
