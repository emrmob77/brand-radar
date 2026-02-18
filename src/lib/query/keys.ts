export const queryKeys = {
  dashboardMetrics: (clientId: string | null) => ["dashboard-metrics", clientId ?? "all"] as const,
  visibilityTrend: (clientId: string | null) => ["visibility-trend", clientId ?? "all"] as const,
  mentionsPayload: (clientId: string | null) => ["mentions-payload", clientId ?? "all"] as const,
  globalSearch: (clientId: string | null, term: string) => ["global-search", clientId ?? "all", term] as const,
  liveMentionsFeed: (clientId: string | null) => ["live-mentions-feed", clientId ?? "all"] as const
};
