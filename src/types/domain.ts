export interface Client {
  id: string;
  agency_id: string;
  name: string;
  domain: string;
  logo_url: string | null;
  industry: string;
  health_score: number;
  active_platforms: string[];
  created_at: string;
  updated_at: string;
}

export interface Mention {
  id: string;
  client_id: string;
  platform_id: string;
  query: string;
  content: string;
  sentiment: "positive" | "neutral" | "negative";
  sentiment_score: number;
  detected_at: string;
  created_at: string;
}
