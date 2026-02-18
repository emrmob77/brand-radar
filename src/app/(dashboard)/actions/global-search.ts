"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/session";
import { getCurrentUser } from "@/lib/auth/current-user";
import { logServerError } from "@/lib/monitoring/error-logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const globalSearchSchema = z.object({
  term: z.string().trim().min(2).max(80),
  clientId: z.string().uuid().nullable().optional(),
  limit: z.number().int().min(6).max(30).optional()
});

type SearchKind = "mention" | "citation" | "query";

export type GlobalSearchResult = {
  id: string;
  kind: SearchKind;
  title: string;
  subtitle: string;
  meta: string;
  href: string;
  occurredAt: string | null;
};

export type GlobalSearchResponse =
  | {
      ok: true;
      results: GlobalSearchResult[];
    }
  | {
      ok: false;
      error: string;
    };

function stripWildcards(value: string) {
  return value.replace(/[%_]/g, "").trim();
}

function relationName(value: unknown): string | null {
  if (Array.isArray(value)) {
    const first = value[0];
    if (first && typeof first === "object" && "name" in first) {
      const name = (first as { name?: unknown }).name;
      return typeof name === "string" ? name : null;
    }
    return null;
  }

  if (value && typeof value === "object" && "name" in value) {
    const name = (value as { name?: unknown }).name;
    return typeof name === "string" ? name : null;
  }

  return null;
}

function shorten(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, Math.max(0, maxLength - 3))}...`;
}

function buildSearchHref(path: string, clientId: string | null, term: string) {
  const params = new URLSearchParams();
  if (clientId) {
    params.set("clientId", clientId);
  }
  params.set("q", term);
  return `${path}?${params.toString()}`;
}

export async function searchGlobalAction(input: {
  term: string;
  clientId?: string | null;
  limit?: number;
}): Promise<GlobalSearchResponse> {
  try {
    const parsed = globalSearchSchema.safeParse({
      term: input.term,
      clientId: input.clientId ?? null,
      limit: input.limit
    });

    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid search query." };
    }

    const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
    if (!accessToken) {
      return { ok: false, error: "Session not found." };
    }

    const user = await getCurrentUser(accessToken);
    if (!user) {
      return { ok: false, error: "User not authenticated." };
    }

    const supabase = createServerSupabaseClient(accessToken);
    const term = stripWildcards(parsed.data.term);
    const ilikeTerm = `%${term}%`;
    const perSource = Math.max(2, Math.floor((parsed.data.limit ?? 15) / 3));

    let mentionQuery = supabase
      .from("mentions")
      .select("id,query,content,detected_at,client_id,platforms(name),clients(name)")
      .or(`query.ilike.${ilikeTerm},content.ilike.${ilikeTerm}`)
      .order("detected_at", { ascending: false })
      .limit(perSource);

    if (parsed.data.clientId) {
      mentionQuery = mentionQuery.eq("client_id", parsed.data.clientId);
    }

    let citationQuery = supabase
    .from("citations")
    .select("id,query,source_url,source_type,detected_at,client_id,clients(name)")
    .or(`query.ilike.${ilikeTerm},source_url.ilike.${ilikeTerm}`)
    .order("detected_at", { ascending: false })
    .limit(perSource);

    if (parsed.data.clientId) {
      citationQuery = citationQuery.eq("client_id", parsed.data.clientId);
    }

    let querySearch = supabase
    .from("queries")
    .select("id,text,category,priority,created_at,client_id,clients(name)")
    .or(`text.ilike.${ilikeTerm},category.ilike.${ilikeTerm}`)
    .order("created_at", { ascending: false })
    .limit(perSource);

    if (parsed.data.clientId) {
      querySearch = querySearch.eq("client_id", parsed.data.clientId);
    }

    const [mentionsResult, citationsResult, queriesResult] = await Promise.all([mentionQuery, citationQuery, querySearch]);

    if (mentionsResult.error) {
      return { ok: false, error: mentionsResult.error.message };
    }
    if (citationsResult.error) {
      return { ok: false, error: citationsResult.error.message };
    }
    if (queriesResult.error) {
      return { ok: false, error: queriesResult.error.message };
    }

    const mentionRows = (mentionsResult.data ?? []).map((row): GlobalSearchResult => {
    const clientName = relationName(row.clients) ?? "Client";
    const platformName = relationName(row.platforms) ?? "Platform";
    const title = shorten(row.query, 88);
    const subtitle = shorten(row.content, 110);

    return {
      id: row.id,
      kind: "mention",
      title,
      subtitle,
      meta: `${clientName} • ${platformName}`,
      href: buildSearchHref("/mentions", row.client_id, term),
      occurredAt: row.detected_at
    };
  });

    const citationRows = (citationsResult.data ?? []).map((row): GlobalSearchResult => {
    const clientName = relationName(row.clients) ?? "Client";
    const sourceType = row.source_type ?? "source";
    const title = shorten(row.query, 88);
    const subtitle = shorten(row.source_url, 110);

    return {
      id: row.id,
      kind: "citation",
      title,
      subtitle,
      meta: `${clientName} • ${sourceType}`,
      href: buildSearchHref("/forensics", row.client_id, term),
      occurredAt: row.detected_at
    };
  });

    const queryRows = (queriesResult.data ?? []).map((row): GlobalSearchResult => {
    const clientName = relationName(row.clients) ?? "Client";
    const category = row.category ?? "general";
    const title = shorten(row.text, 88);
    const subtitle = `Category: ${category} • Priority: ${row.priority ?? "medium"}`;

    return {
      id: row.id,
      kind: "query",
      title,
      subtitle,
      meta: `${clientName} • Query`,
      href: buildSearchHref("/visibility", row.client_id, term),
      occurredAt: row.created_at
    };
  });

    const results = [...mentionRows, ...citationRows, ...queryRows]
      .sort((left, right) => {
        const leftTime = left.occurredAt ? Date.parse(left.occurredAt) : 0;
        const rightTime = right.occurredAt ? Date.parse(right.occurredAt) : 0;
        return rightTime - leftTime;
      })
      .slice(0, parsed.data.limit ?? 15);

    return {
      ok: true,
      results
    };
  } catch (error) {
    await logServerError(error, {
      area: "actions/global-search",
      metadata: {
        clientId: input.clientId ?? null,
        termLength: input.term.length
      }
    });
    return { ok: false, error: "Search request failed unexpectedly." };
  }
}
