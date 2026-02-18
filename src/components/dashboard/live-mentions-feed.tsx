"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getMentionFeedPage, type MentionFeedRow } from "@/app/(dashboard)/actions/mentions";
import { queryKeys } from "@/lib/query/keys";

type LiveMentionsFeedProps = {
  accessToken: string | null;
  clientId: string | null;
  initialMentions: MentionFeedRow[];
};

const PAGE_SIZE = 20;

function relativeTime(value: string) {
  const seconds = Math.max(Math.floor((Date.now() - new Date(value).getTime()) / 1000), 0);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function mergeUniqueMentions(rows: MentionFeedRow[]) {
  const seen = new Set<string>();
  const output: MentionFeedRow[] = [];

  for (const row of rows) {
    if (seen.has(row.id)) {
      continue;
    }
    seen.add(row.id);
    output.push(row);
  }

  return output;
}

export function LiveMentionsFeed({ accessToken, clientId, initialMentions }: LiveMentionsFeedProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const pendingMentionsRef = useRef<MentionFeedRow[]>([]);
  const flushTimerRef = useRef<number | null>(null);
  const [liveMentions, setLiveMentions] = useState<MentionFeedRow[]>([]);
  const [newItemsCount, setNewItemsCount] = useState(0);

  const feedQuery = useInfiniteQuery({
    queryKey: queryKeys.liveMentionsFeed(clientId),
    staleTime: 30_000,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      getMentionFeedPage({
        clientId,
        page: pageParam,
        pageSize: PAGE_SIZE
      }),
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined
  });

  const pagedMentions = useMemo(() => {
    if (!feedQuery.data) {
      return initialMentions;
    }
    return feedQuery.data.pages.flatMap((page) => page.rows);
  }, [feedQuery.data, initialMentions]);

  const mentions = useMemo(() => mergeUniqueMentions([...liveMentions, ...pagedMentions]), [liveMentions, pagedMentions]);

  const flushRealtimeMentions = useCallback(() => {
    flushTimerRef.current = null;
    if (pendingMentionsRef.current.length === 0) {
      return;
    }

    const batch = pendingMentionsRef.current.splice(0);
    setLiveMentions((prev) => mergeUniqueMentions([...batch, ...prev]).slice(0, 80));
    setNewItemsCount((prev) => prev + batch.length);
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const queueRealtimeMention = useCallback(
    (row: MentionFeedRow) => {
      pendingMentionsRef.current.push(row);
      if (flushTimerRef.current !== null) {
        return;
      }
      flushTimerRef.current = window.setTimeout(flushRealtimeMentions, 220);
    },
    [flushRealtimeMentions]
  );

  useEffect(() => {
    setLiveMentions([]);
    setNewItemsCount(0);
    pendingMentionsRef.current = [];
    if (flushTimerRef.current !== null) {
      window.clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
  }, [clientId]);

  useEffect(() => {
    const rootNode = containerRef.current;
    const sentinelNode = loadMoreRef.current;
    if (!rootNode || !sentinelNode) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) {
          return;
        }

        if (feedQuery.hasNextPage && !feedQuery.isFetchingNextPage) {
          void feedQuery.fetchNextPage();
        }
      },
      {
        root: rootNode,
        rootMargin: "140px"
      }
    );

    observer.observe(sentinelNode);
    return () => observer.disconnect();
  }, [feedQuery]);

  const supabase = useMemo(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabasePublishableKey) {
      return null;
    }

    return createClient(supabaseUrl, supabasePublishableKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }, []);

  useEffect(() => {
    if (!supabase || !accessToken) {
      return;
    }

    supabase.realtime.setAuth(accessToken);
    const channel = supabase
      .channel(`live-mentions-${clientId ?? "all"}`)
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
            .select("id,query,content,sentiment,detected_at,platforms(name)")
            .eq("id", mentionId)
            .maybeSingle();

          if (!data) return;
          const platformRelation = Array.isArray(data.platforms) ? data.platforms[0] : data.platforms;

          const nextMention: MentionFeedRow = {
            id: String(data.id),
            platform: platformRelation?.name ?? "Unknown",
            sentiment: (data.sentiment as MentionFeedRow["sentiment"]) ?? "neutral",
            query: data.query,
            excerpt: data.content,
            detectedAt: data.detected_at
          };

          queueRealtimeMention(nextMention);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [accessToken, clientId, queueRealtimeMention, supabase]);

  useEffect(() => {
    return () => {
      if (flushTimerRef.current !== null) {
        window.clearTimeout(flushTimerRef.current);
      }
    };
  }, []);

  return (
    <article className="surface-panel panel-hover p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink">Live Mentions</h2>
        <span className="rounded-full border border-surface-border bg-brand-soft px-2 py-1 text-[11px] font-semibold text-ink">LIVE</span>
      </div>

      {newItemsCount > 0 ? (
        <p className="mt-2 rounded-lg border border-brand/30 bg-brand-soft px-2.5 py-1.5 text-[11px] font-semibold text-ink">
          {newItemsCount} new mention{newItemsCount > 1 ? "s" : ""} received
        </p>
      ) : null}

      <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1" ref={containerRef}>
        {feedQuery.isLoading && mentions.length === 0 ? (
          <div className="space-y-2">
            <div className="h-16 animate-pulse rounded-xl border border-surface-border bg-brand-soft/50" />
            <div className="h-16 animate-pulse rounded-xl border border-surface-border bg-brand-soft/50" />
            <div className="h-16 animate-pulse rounded-xl border border-surface-border bg-brand-soft/50" />
          </div>
        ) : null}

        {mentions.map((mention) => (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-surface-border bg-white p-3"
            initial={{ opacity: 0, y: 8 }}
            key={mention.id}
            style={{ willChange: "transform, opacity" }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-ink">{mention.platform}</p>
              <p className="text-[11px] font-mono text-text-secondary">{relativeTime(mention.detectedAt)}</p>
            </div>
            <p className="mt-1 text-sm font-medium text-ink">{mention.query}</p>
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">{mention.excerpt}</p>
            <p className="mt-2 text-[11px] font-semibold capitalize text-ink">{mention.sentiment}</p>
          </motion.div>
        ))}

        {!feedQuery.isLoading && mentions.length === 0 ? (
          <p className="rounded-xl border border-surface-border bg-white px-3 py-4 text-sm text-text-secondary">No mention data yet.</p>
        ) : null}

        <div className="h-2 w-full" ref={loadMoreRef} />

        {feedQuery.isFetchingNextPage ? (
          <p className="pb-2 text-center text-xs font-semibold text-text-secondary">Loading older mentions...</p>
        ) : null}
      </div>
    </article>
  );
}
