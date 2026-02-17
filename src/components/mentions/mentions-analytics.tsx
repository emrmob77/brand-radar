"use client";

import { createClient } from "@supabase/supabase-js";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { MentionAnalytics, MentionRecord } from "@/app/(dashboard)/actions/mentions";
import { SentimentGauge } from "@/components/mentions/sentiment-gauge";

type SortField = "platform" | "sentiment" | "detectedAt" | "query";
type SortDirection = "asc" | "desc";

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

export function MentionsAnalytics({ accessToken, analytics, clientId, rows }: MentionsAnalyticsProps) {
  const [liveRows, setLiveRows] = useState(rows);
  const [newMentionsCount, setNewMentionsCount] = useState(0);
  const [sortField, setSortField] = useState<SortField>("detectedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [sentimentFilter, setSentimentFilter] = useState<"all" | MentionRecord["sentiment"]>("all");
  const [platformFilter, setPlatformFilter] = useState("all");
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
    return liveRows.filter((row) => {
      const sentimentMatch = sentimentFilter === "all" ? true : row.sentiment === sentimentFilter;
      const platformMatch = platformFilter === "all" ? true : row.platform === platformFilter;
      return sentimentMatch && platformMatch;
    });
  }, [liveRows, platformFilter, sentimentFilter]);

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
            .select("id,query,content,sentiment,detected_at,platforms(name,slug)")
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
            detectedAt: data.detected_at
          };

          setLiveRows((prev) => [nextRow, ...prev].slice(0, 300));
          setNewMentionsCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [accessToken, clientId]);

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
            <div className="flex flex-wrap gap-2">
              <select
                className="focus-ring rounded-xl border border-surface-border bg-white px-3 py-2 text-xs"
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
              <select
                className="focus-ring rounded-xl border border-surface-border bg-white px-3 py-2 text-xs"
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
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
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
                  <th className="px-2 py-2">
                    <button onClick={() => setSort("detectedAt")} type="button">
                      Timestamp
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((row) => (
                  <tr className="border-b border-surface-border/70" key={row.id}>
                    <td className="px-2 py-3 font-semibold text-ink">{row.platform}</td>
                    <td className="px-2 py-3 text-ink">{row.query}</td>
                    <td className="max-w-[320px] truncate px-2 py-3 text-text-secondary">{row.content}</td>
                    <td className="px-2 py-3 capitalize text-ink">{row.sentiment}</td>
                    <td className="px-2 py-3 text-text-secondary">{format(new Date(row.detectedAt), "yyyy-MM-dd HH:mm")}</td>
                  </tr>
                ))}
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
