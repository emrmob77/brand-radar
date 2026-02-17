"use client";

import { motion } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import { useEffect, useMemo, useRef, useState } from "react";

export type MentionRow = {
  id: string;
  platform: string;
  sentiment: "positive" | "neutral" | "negative";
  query: string;
  excerpt: string;
  detectedAt: string;
};

type LiveMentionsFeedProps = {
  accessToken: string | null;
  clientId: string | null;
  initialMentions: MentionRow[];
};

function relativeTime(value: string) {
  const seconds = Math.max(Math.floor((Date.now() - new Date(value).getTime()) / 1000), 0);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function LiveMentionsFeed({ accessToken, clientId, initialMentions }: LiveMentionsFeedProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mentions, setMentions] = useState<MentionRow[]>(initialMentions);
  const [newItemsCount, setNewItemsCount] = useState(0);

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

          const nextMention: MentionRow = {
            id: String(data.id),
            platform: platformRelation?.name ?? "Unknown",
            sentiment: (data.sentiment as MentionRow["sentiment"]) ?? "neutral",
            query: data.query,
            excerpt: data.content,
            detectedAt: data.detected_at
          };

          setMentions((prev) => [nextMention, ...prev].slice(0, 20));
          setNewItemsCount((prev) => prev + 1);
          containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [accessToken, clientId, supabase]);

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
        {mentions.map((mention) => (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-surface-border bg-white p-3"
            initial={{ opacity: 0, y: 8 }}
            key={mention.id}
            transition={{ duration: 0.2 }}
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
      </div>
    </article>
  );
}
