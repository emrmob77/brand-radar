"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/session";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const promptCreateSchema = z.object({
  clientId: z.string().uuid(),
  text: z.string().trim().min(3, "Prompt must be at least 3 characters."),
  category: z.string().trim().min(2, "Category must be at least 2 characters."),
  priority: z.enum(["low", "medium", "high"])
});

const promptDeleteSchema = z.object({
  clientId: z.string().uuid(),
  queryId: z.string().uuid()
});

const runTestSchema = z.object({
  clientId: z.string().uuid(),
  queryId: z.string().uuid(),
  platformSlug: z.string().trim().min(2).optional()
});

const citationSourceTypes = ["wikipedia", "reddit", "review_site", "news", "blog", "other"] as const;
type CitationSourceType = (typeof citationSourceTypes)[number];

const webResultSchema = z.object({
  url: z.string().url(),
  title: z.string().trim().min(1).optional(),
  snippet: z.string().trim().min(1).optional()
});

const livePromptResultSchema = z.object({
  answer: z.string().trim().min(3),
  sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
  sentimentScore: z.number().min(-1).max(1).optional(),
  brandMentioned: z.boolean().optional(),
  webResults: z.array(webResultSchema).optional(),
  citations: z
    .array(
      z.object({
        url: z.string().url(),
        sourceType: z.string().trim().min(1).optional(),
        authorityScore: z.number().min(0).max(100).nullable().optional()
      })
    )
    .optional()
});

function promptsPath(clientId: string, status: string) {
  return `/prompts?clientId=${encodeURIComponent(clientId)}&status=${encodeURIComponent(status)}`;
}

function getStringField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : null;
}

function inferCitationSourceType(url: string): CitationSourceType {
  let hostname = "";
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    return "other";
  }

  if (hostname.includes("wikipedia.org")) return "wikipedia";
  if (hostname.includes("reddit.com")) return "reddit";
  if (hostname.includes("g2.com") || hostname.includes("capterra.com") || hostname.includes("trustpilot.com")) return "review_site";
  if (
    hostname.includes("news") ||
    hostname.includes("reuters.com") ||
    hostname.includes("bloomberg.com") ||
    hostname.includes("forbes.com") ||
    hostname.includes("wsj.com")
  ) {
    return "news";
  }
  if (hostname.includes("blog")) return "blog";
  return "other";
}

function resolveCitationSourceType(value: string | undefined, url: string): CitationSourceType {
  if (!value) {
    return inferCitationSourceType(url);
  }

  const normalized = value.trim().toLowerCase();
  if (citationSourceTypes.includes(normalized as CitationSourceType)) {
    return normalized as CitationSourceType;
  }
  if (normalized === "web" || normalized === "website" || normalized === "site") {
    return inferCitationSourceType(url);
  }

  return inferCitationSourceType(url);
}

function normalizeAuthorityScore(value: number | null | undefined): number | null {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  if (value >= 0 && value <= 1) {
    return Math.round(value * 100);
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeUrl(value: string) {
  try {
    return new URL(value).toString();
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

function normalizeTextForLookup(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9.\s/_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractBrandKeywords(input: { domain: string; clientName: string }) {
  const keywords = new Set<string>();
  const normalizedDomain = input.domain.trim().toLowerCase();
  if (normalizedDomain.length >= 3) {
    keywords.add(normalizedDomain);
  }

  const hostname = normalizedDomain.replace(/^https?:\/\//, "").split("/")[0] ?? "";
  if (hostname.length >= 3) {
    keywords.add(hostname);
  }

  const rootToken = hostname.split(".")[0] ?? "";
  if (rootToken.length >= 3) {
    keywords.add(rootToken);
  }

  const normalizedName = normalizeTextForLookup(input.clientName);
  if (normalizedName.length >= 3) {
    keywords.add(normalizedName);
    const compact = normalizedName.replace(/\s+/g, "");
    if (compact.length >= 3) {
      keywords.add(compact);
    }
  }

  return Array.from(keywords);
}

type NormalizedCitation = {
  url: string;
  sourceType: CitationSourceType;
  authorityScore: number | null;
};

type NormalizedWebResult = {
  url: string;
  title: string | null;
  snippet: string | null;
};

function detectBrandMention(input: {
  answer: string;
  citations: NormalizedCitation[];
  webResults: NormalizedWebResult[];
  domain: string;
  clientName: string;
}) {
  const keywords = extractBrandKeywords({
    domain: input.domain,
    clientName: input.clientName
  });
  const searchableText = normalizeTextForLookup(
    [
      input.answer,
      ...input.citations.map((citation) => citation.url),
      ...input.webResults.map((result) => [result.url, result.title ?? "", result.snippet ?? ""].join(" "))
    ].join(" ")
  );

  const matchedKeywords = keywords.filter((keyword) => {
    const normalizedKeyword = normalizeTextForLookup(keyword);
    return normalizedKeyword.length >= 3 && searchableText.includes(normalizedKeyword);
  });

  return {
    brandMentioned: matchedKeywords.length > 0,
    matchedKeywords
  };
}

function parseJsonObject(raw: string) {
  const normalized = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(normalized) as unknown;
  } catch {
    const firstBrace = normalized.indexOf("{");
    const lastBrace = normalized.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(normalized.slice(firstBrace, lastBrace + 1)) as unknown;
    }
    throw new Error("JSON object could not be parsed.");
  }
}

function normalizeAnswerText(raw: string) {
  return raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
}

function extractTextAndAnnotationUrlsFromResponses(payload: unknown) {
  const annotationUrls = new Set<string>();
  const textSegments: string[] = [];

  if (!payload || typeof payload !== "object") {
    return {
      text: "",
      annotationUrls: [] as string[]
    };
  }

  const responsePayload = payload as Record<string, unknown>;
  if (typeof responsePayload.output_text === "string" && responsePayload.output_text.trim().length > 0) {
    textSegments.push(responsePayload.output_text.trim());
  }

  const outputItems = Array.isArray(responsePayload.output) ? responsePayload.output : [];
  for (const outputItem of outputItems) {
    if (!outputItem || typeof outputItem !== "object") {
      continue;
    }

    const outputRecord = outputItem as Record<string, unknown>;
    const contentItems = Array.isArray(outputRecord.content) ? outputRecord.content : [];
    for (const contentItem of contentItems) {
      if (!contentItem || typeof contentItem !== "object") {
        continue;
      }

      const contentRecord = contentItem as Record<string, unknown>;
      if (typeof contentRecord.text === "string" && contentRecord.text.trim().length > 0) {
        textSegments.push(contentRecord.text.trim());
      }

      const annotations = Array.isArray(contentRecord.annotations) ? contentRecord.annotations : [];
      for (const annotation of annotations) {
        if (!annotation || typeof annotation !== "object") {
          continue;
        }

        const annotationRecord = annotation as Record<string, unknown>;
        const directUrl = typeof annotationRecord.url === "string" ? annotationRecord.url : null;
        const nestedSource = annotationRecord.source;
        const nestedUrl =
          nestedSource && typeof nestedSource === "object" && typeof (nestedSource as Record<string, unknown>).url === "string"
            ? ((nestedSource as Record<string, unknown>).url as string)
            : null;
        const normalized = normalizeUrl(directUrl ?? nestedUrl ?? "");
        if (normalized) {
          annotationUrls.add(normalized);
        }
      }
    }
  }

  const text = Array.from(new Set(textSegments)).join("\n").trim();
  return {
    text,
    annotationUrls: Array.from(annotationUrls)
  };
}

async function runLivePromptWithOpenAI(input: { promptText: string; category: string; domain: string; clientName: string }) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return {
      ok: false as const,
      errorCode: "missing_key"
    };
  }

  const model = process.env.OPENAI_WEB_MODEL?.trim() || process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini";
  const normalizedPrompt = input.promptText.trim().toLowerCase();
  const brandToken = input.domain.trim().toLowerCase().split(".")[0] ?? "";
  const queryMentionsBrand = brandToken.length > 1 && normalizedPrompt.includes(brandToken);

  const behaviorDirective = queryMentionsBrand
    ? "The query explicitly references the monitored brand. You may include brand-specific evaluation where relevant."
    : "The query does NOT explicitly reference the monitored brand. Provide a neutral market-wide answer and do not prioritize the monitored brand.";

  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        tools: [{ type: "web_search_preview" }],
        input: [
          {
            role: "system",
            content:
              "You are a GEO monitoring assistant. You MUST use live web search before producing an answer. The primary intent is always the exact user query text. Category is only metadata and must never override the user query intent. Return strict JSON only with keys: answer, sentiment, sentimentScore, brandMentioned, webResults, citations. sentiment in positive|neutral|negative. sentimentScore between -1 and 1. webResults is an array of {url,title,snippet}. citations is an array of {url,sourceType,authorityScore}. Do not output markdown."
          },
          {
            role: "user",
            content: `Monitored brand: ${input.clientName}\nMonitored brand domain: ${input.domain}\nCategory tag (metadata only): ${input.category}\nUser query (PRIMARY INTENT): ${input.promptText}\n\nRules:\n- ${behaviorDirective}\n- Run web search and ground the output in found sources.\n- Keep the answer realistic, concise, and user-facing.\n- Never fabricate citations. If you are not confident, return citations as [].\n- Preserve the language of the user query.\n- The answer MUST match the query intent exactly. Example: if query is about social media agency, do not pivot to SEO agency.\n- Set brandMentioned=true only if monitored brand name/domain appears in answer or source findings.\n\nReturn only the JSON object.`
          }
        ],
        max_output_tokens: 1400
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(60_000)
    });
  } catch {
    return {
      ok: false as const,
      errorCode: "request_failed"
    };
  }

  if (!response.ok) {
    let errorText = "";
    try {
      errorText = await response.text();
    } catch {
      errorText = "";
    }
    if (/invalid api key|incorrect api key|authentication/i.test(errorText.toLowerCase())) {
      return {
        ok: false as const,
        errorCode: "invalid_key"
      };
    }
    if (/rate limit|quota|429/i.test(errorText.toLowerCase())) {
      return {
        ok: false as const,
        errorCode: "rate_limited"
      };
    }
    if (/model|not found|does not exist|unsupported/i.test(errorText.toLowerCase())) {
      return {
        ok: false as const,
        errorCode: "model_unavailable"
      };
    }
    const likelyWebToolError = /web_search|tool|responses/i.test(errorText.toLowerCase());
    return {
      ok: false as const,
      errorCode: likelyWebToolError ? "web_unavailable" : "openai_error"
    };
  }

  const data = (await response.json()) as unknown;
  const extracted = extractTextAndAnnotationUrlsFromResponses(data);
  if (!extracted.text) {
    return {
      ok: false as const,
      errorCode: "openai_parse_error"
    };
  }

  const normalizedText = normalizeAnswerText(extracted.text);
  let parsedRaw: unknown = null;
  try {
    parsedRaw = parseJsonObject(normalizedText);
  } catch {
    parsedRaw = {
      answer: normalizedText,
      sentiment: "neutral",
      sentimentScore: 0,
      webResults: extracted.annotationUrls.map((url) => ({ url })),
      citations: []
    };
  }

  let parsed = livePromptResultSchema.safeParse(parsedRaw);
  if (!parsed.success) {
    parsed = livePromptResultSchema.safeParse({
      answer: normalizedText.length >= 3 ? normalizedText : "No textual answer returned by model.",
      sentiment: "neutral",
      sentimentScore: 0,
      webResults: extracted.annotationUrls.map((url) => ({ url })),
      citations: []
    });
  }
  if (!parsed.success) {
    return {
      ok: false as const,
      errorCode: "openai_parse_error"
    };
  }

  const citationItems = parsed.data.citations ?? [];
  const webResultItems = parsed.data.webResults ?? [];
  const citationMap = new Map<string, NormalizedCitation>();
  const addCitation = (item: { url: string; sourceType?: string; authorityScore?: number | null }) => {
    const normalized = normalizeUrl(item.url);
    if (!normalized || citationMap.has(normalized)) {
      return;
    }
    citationMap.set(normalized, {
      url: normalized,
      sourceType: resolveCitationSourceType(item.sourceType, normalized),
      authorityScore: normalizeAuthorityScore(item.authorityScore ?? null)
    });
  };

  for (const item of citationItems) {
    addCitation({
      url: item.url,
      sourceType: item.sourceType,
      authorityScore: item.authorityScore ?? null
    });
  }

  for (const url of extracted.annotationUrls) {
    addCitation({ url });
  }

  for (const item of webResultItems) {
    addCitation({ url: item.url });
  }

  if (citationMap.size === 0) {
    const fallbackUrls = extractUrls(parsed.data.answer).slice(0, 5);
    for (const url of fallbackUrls) {
      addCitation({ url });
    }
  }

  const normalizedCitations = Array.from(citationMap.values());
  const webResultMap = new Map<string, NormalizedWebResult>();
  for (const item of webResultItems) {
    const normalized = normalizeUrl(item.url);
    if (!normalized || webResultMap.has(normalized)) {
      continue;
    }
    webResultMap.set(normalized, {
      url: normalized,
      title: item.title?.slice(0, 180) ?? null,
      snippet: item.snippet?.slice(0, 360) ?? null
    });
  }
  for (const citation of normalizedCitations) {
    if (!webResultMap.has(citation.url)) {
      webResultMap.set(citation.url, {
        url: citation.url,
        title: null,
        snippet: null
      });
    }
  }

  const normalizedWebResults = Array.from(webResultMap.values()).slice(0, 8);
  const brandDetection = detectBrandMention({
    answer: parsed.data.answer,
    citations: normalizedCitations,
    webResults: normalizedWebResults,
    domain: input.domain,
    clientName: input.clientName
  });
  const brandMentioned = (parsed.data.brandMentioned ?? false) || brandDetection.brandMentioned;

  return {
    ok: true as const,
    answer: parsed.data.answer,
    sentiment: parsed.data.sentiment ?? "neutral",
    sentimentScore: parsed.data.sentimentScore ?? 0,
    citations: normalizedCitations,
    webResults: normalizedWebResults,
    brandMentioned,
    matchedBrandKeywords: brandDetection.matchedKeywords,
    model
  };
}

async function requireSession() {
  const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value ?? null;
  if (!accessToken) {
    redirect("/login");
  }

  const currentUser = await getCurrentUser(accessToken);
  if (!currentUser) {
    redirect("/login");
  }

  return { accessToken, currentUser };
}

export async function createPromptAction(formData: FormData) {
  const { accessToken } = await requireSession();
  const parsed = promptCreateSchema.safeParse({
    clientId: formData.get("clientId"),
    text: formData.get("text"),
    category: formData.get("category"),
    priority: formData.get("priority")
  });

  if (!parsed.success) {
    const fallbackClientId = getStringField(formData, "clientId") ?? "";
    if (fallbackClientId) {
      redirect(promptsPath(fallbackClientId, "validation_error"));
    }
    redirect("/prompts");
  }

  const supabase = createServerSupabaseClient(accessToken);
  const clientResult = await supabase
    .from("clients")
    .select("id")
    .eq("id", parsed.data.clientId)
    .maybeSingle();
  if (clientResult.error || !clientResult.data) {
    redirect(promptsPath(parsed.data.clientId, "client_not_found"));
  }

  const insert = await supabase.from("queries").insert({
    client_id: parsed.data.clientId,
    text: parsed.data.text,
    category: parsed.data.category,
    priority: parsed.data.priority
  });

  if (insert.error) {
    redirect(promptsPath(parsed.data.clientId, "create_error"));
  }

  revalidatePath("/prompts");
  revalidatePath("/visibility");
  revalidatePath("/optimizations");
  revalidatePath("/competitors");
  redirect(promptsPath(parsed.data.clientId, "created"));
}

export async function deletePromptAction(formData: FormData) {
  const { accessToken } = await requireSession();
  const parsed = promptDeleteSchema.safeParse({
    clientId: formData.get("clientId"),
    queryId: formData.get("queryId")
  });

  if (!parsed.success) {
    const fallbackClientId = getStringField(formData, "clientId") ?? "";
    if (fallbackClientId) {
      redirect(promptsPath(fallbackClientId, "validation_error"));
    }
    redirect("/prompts");
  }

  const supabase = createServerSupabaseClient(accessToken);
  const del = await supabase.from("queries").delete().eq("id", parsed.data.queryId).eq("client_id", parsed.data.clientId);

  if (del.error) {
    redirect(promptsPath(parsed.data.clientId, "delete_error"));
  }

  revalidatePath("/prompts");
  revalidatePath("/visibility");
  revalidatePath("/optimizations");
  revalidatePath("/competitors");
  redirect(promptsPath(parsed.data.clientId, "deleted"));
}

export async function runPromptTestAction(formData: FormData) {
  const { accessToken } = await requireSession();
  const parsed = runTestSchema.safeParse({
    clientId: formData.get("clientId"),
    queryId: formData.get("queryId"),
    platformSlug: formData.get("platformSlug")
  });

  if (!parsed.success) {
    const fallbackClientId = getStringField(formData, "clientId") ?? "";
    if (fallbackClientId) {
      redirect(promptsPath(fallbackClientId, "validation_error"));
    }
    redirect("/prompts");
  }

  const supabase = createServerSupabaseClient(accessToken);
  const [queryResult, clientResult] = await Promise.all([
    supabase.from("queries").select("id,text,category,client_id").eq("id", parsed.data.queryId).eq("client_id", parsed.data.clientId).maybeSingle(),
    supabase.from("clients").select("id,name,domain,active_platforms").eq("id", parsed.data.clientId).maybeSingle()
  ]);

  if (queryResult.error || !queryResult.data || clientResult.error || !clientResult.data) {
    redirect(promptsPath(parsed.data.clientId, "not_found"));
  }
  const queryData = queryResult.data;
  const clientData = clientResult.data;

  const activeSlugs = Array.isArray(clientData.active_platforms)
    ? clientData.active_platforms.filter((value): value is string => typeof value === "string" && value.length > 0)
    : [];
  const preferredPlatformSlug = parsed.data.platformSlug && parsed.data.platformSlug.length > 0 ? parsed.data.platformSlug : activeSlugs[0] ?? "chatgpt";

  const platformResult = await supabase.from("platforms").select("id,name,slug").eq("slug", preferredPlatformSlug).maybeSingle();
  if (platformResult.error || !platformResult.data) {
    redirect(promptsPath(parsed.data.clientId, "platform_not_found"));
  }
  const platform = platformResult.data;

  const live = await runLivePromptWithOpenAI({
    promptText: queryData.text,
    category: queryData.category,
    domain: clientData.domain,
    clientName: clientData.name
  });
  if (!live.ok) {
    const statusMap: Record<string, string> = {
      missing_key: "live_missing_key",
      invalid_key: "live_invalid_key",
      model_unavailable: "live_model_unavailable",
      rate_limited: "live_rate_limited",
      web_unavailable: "live_web_unavailable",
      request_failed: "live_request_failed",
      openai_parse_error: "live_parse_error",
      openai_error: "live_openai_error"
    };
    redirect(promptsPath(parsed.data.clientId, statusMap[live.errorCode] ?? "run_error"));
  }

  const nowIso = new Date().toISOString();
  const runInsert = await supabase
    .from("prompt_runs")
    .insert({
      client_id: parsed.data.clientId,
      query_id: parsed.data.queryId,
      platform_id: platform.id,
      answer: live.answer,
      sentiment: live.sentiment,
      sentiment_score: live.sentimentScore,
      brand_mentioned: live.brandMentioned,
      citations: live.citations,
      web_results: live.webResults,
      detected_at: nowIso,
      metadata: {
        source: "openai_web_live_run",
        platform_slug: preferredPlatformSlug,
        matched_brand_keywords: live.matchedBrandKeywords,
        model: live.model
      }
    })
    .select("id")
    .maybeSingle();

  if (runInsert.error || !runInsert.data) {
    redirect(promptsPath(parsed.data.clientId, "run_history_error"));
  }

  if (!live.brandMentioned) {
    revalidatePath("/prompts");
    redirect(promptsPath(parsed.data.clientId, "ran_no_brand_match"));
  }

  const mentionInsert = await supabase.from("mentions").insert({
    client_id: parsed.data.clientId,
    platform_id: platform.id,
    query: queryData.text,
    content: live.answer,
    sentiment: live.sentiment,
    sentiment_score: live.sentimentScore,
    detected_at: nowIso,
    metadata: {
      source: "openai_web_live_run",
      platform_slug: preferredPlatformSlug,
      brand_match: true,
      matched_brand_keywords: live.matchedBrandKeywords,
      web_results: live.webResults,
      model: live.model,
      prompt_run_id: runInsert.data.id
    }
  });

  const citationInsert =
    live.citations.length > 0
      ? await supabase.from("citations").insert(
          live.citations.map((item) => ({
            client_id: parsed.data.clientId,
            platform_id: platform.id,
            query: queryData.text,
            source_url: item.url,
            source_type: item.sourceType,
            authority_score: item.authorityScore,
            detected_at: nowIso,
            status: "active"
          }))
        )
      : { error: null };

  if (mentionInsert.error) {
    redirect(promptsPath(parsed.data.clientId, "run_mention_insert_error"));
  }
  if (citationInsert.error) {
    redirect(promptsPath(parsed.data.clientId, "run_citation_insert_error"));
  }

  revalidatePath("/prompts");
  revalidatePath("/dashboard");
  revalidatePath("/mentions");
  revalidatePath("/visibility");
  revalidatePath("/citations");
  revalidatePath("/forensics");
  revalidatePath("/optimizations");
  revalidatePath("/competitors");
  revalidatePath("/trends");
  revalidatePath("/alerts");
  const status = live.citations.length > 0 ? "ran_with_citations" : "ran_no_citations";
  redirect(promptsPath(parsed.data.clientId, status));
}
