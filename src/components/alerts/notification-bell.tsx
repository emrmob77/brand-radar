"use client";

import { createClient } from "@supabase/supabase-js";
import { formatDistanceToNow } from "date-fns";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type AlertItem, evaluateAlertRulesAction, getRecentAlertsAction, markAlertsAsReadAction } from "@/app/(dashboard)/actions/alerts";

type NotificationBellProps = {
  accessToken: string | null;
  clientId: string | null;
};

function severityClass(severity: AlertItem["severity"]) {
  if (severity === "critical") return "text-red-700";
  if (severity === "warning") return "text-amber-700";
  return "text-sky-700";
}

export function NotificationBell({ accessToken, clientId }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const alertsHref = useMemo(() => (clientId ? `/alerts?clientId=${encodeURIComponent(clientId)}` : "/alerts"), [clientId]);

  const refreshAlerts = useCallback(async () => {
    setLoading(true);
    const result = await getRecentAlertsAction(clientId, 8);
    setAlerts(result.alerts);
    setUnreadCount(result.unreadCount);
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    void refreshAlerts();
  }, [refreshAlerts]);

  useEffect(() => {
    if (!clientId) return;

    const timer = window.setInterval(() => {
      void (async () => {
        await evaluateAlertRulesAction(clientId);
        await refreshAlerts();
      })();
    }, 5 * 60 * 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [clientId, refreshAlerts]);

  useEffect(() => {
    if (!accessToken || !clientId) {
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
      .channel(`alerts-bell-${clientId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "alerts",
          filter: `client_id=eq.${clientId}`
        },
        (payload) => {
          const next: AlertItem = {
            id: String(payload.new.id),
            title: String(payload.new.title ?? "New alert"),
            message: String(payload.new.message ?? ""),
            severity: (payload.new.severity as AlertItem["severity"]) ?? "info",
            read: Boolean(payload.new.read),
            createdAt: String(payload.new.created_at ?? new Date().toISOString()),
            clientId: String(payload.new.client_id ?? clientId)
          };
          setAlerts((prev) => [next, ...prev.filter((item) => item.id !== next.id)].slice(0, 8));
          if (!next.read) {
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "alerts",
          filter: `client_id=eq.${clientId}`
        },
        (payload) => {
          const alertId = String(payload.new.id);
          const read = Boolean(payload.new.read);
          setAlerts((prev) => prev.map((item) => (item.id === alertId ? { ...item, read } : item)));
          if (read) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [accessToken, clientId]);

  useEffect(() => {
    if (!open) return;

    function closeOnOutside(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", closeOnOutside);
    return () => window.removeEventListener("mousedown", closeOnOutside);
  }, [open]);

  async function markVisibleRead() {
    const unreadIds = alerts.filter((alert) => !alert.read).map((alert) => alert.id);
    if (unreadIds.length === 0) return;
    setAlerts((prev) => prev.map((alert) => ({ ...alert, read: true })));
    setUnreadCount(0);
    await markAlertsAsReadAction(unreadIds);
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        aria-label="Notifications"
        className="focus-ring relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-surface-border bg-white text-text-secondary hover:text-ink"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) {
            void markVisibleRead();
          }
        }}
        type="button"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-critical px-1 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-[320px] rounded-xl border border-surface-border bg-white p-2 shadow-[0_14px_26px_rgba(17,19,24,0.12)]">
          <div className="flex items-center justify-between px-2 py-1.5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">Recent Alerts</p>
            <Link className="text-xs font-semibold text-brand hover:underline" href={alertsHref}>
              Open
            </Link>
          </div>

          <div className="max-h-[320px] overflow-y-auto">
            {loading ? (
              <p className="px-2 py-3 text-xs text-text-secondary">Loading alerts...</p>
            ) : alerts.length === 0 ? (
              <p className="px-2 py-3 text-xs text-text-secondary">No alerts yet.</p>
            ) : (
              alerts.map((alert) => (
                <article className="mt-1 rounded-lg border border-surface-border px-2.5 py-2" key={alert.id}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-semibold text-ink">{alert.title}</p>
                    <span className={`text-[10px] font-semibold uppercase ${severityClass(alert.severity)}`}>{alert.severity}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-text-secondary">{alert.message}</p>
                  <p className="mt-1 text-[10px] text-text-secondary">{formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}</p>
                </article>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
