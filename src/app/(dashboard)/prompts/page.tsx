import { cookies } from "next/headers";
import Link from "next/link";
import { Bot, Building2, FileSearch, Gauge, Search, Sparkles } from "lucide-react";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/session";
import { createPromptAction, deletePromptAction, runPromptTestAction } from "@/app/(dashboard)/prompts/actions";
import { DashboardHeader } from "@/components/layout/geo-shell";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type PromptRow = {
  id: string;
  text: string;
  category: string;
  priority: "low" | "medium" | "high";
  created_at: string;
};

type ClientRow = {
  id: string;
  name: string;
  domain: string;
  active_platforms: string[];
};

type PromptRunCitation = {
  url: string;
  sourceType: string;
  authorityScore: number | null;
};

type PromptRunPreview = {
  id: string;
  query: string;
  answer: string;
  detectedAt: string;
  platform: string;
  brandMentioned: boolean;
  citations: PromptRunCitation[];
};

type RunCitationPreview = {
  id: string;
  query: string;
  sourceUrl: string;
  sourceType: string;
  authorityScore: number | null;
  detectedAt: string;
  platform: string;
  brandMentioned: boolean;
};

type PromptsPageProps = {
  searchParams?: {
    clientId?: string;
    status?: string;
  };
};

type StatusTone = "success" | "error";

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(dateString));
}

function getStatusMessage(status: string | undefined) {
  if (!status) return null;

  const statusMap: Record<string, { text: string; tone: StatusTone }> = {
    created: { text: "Prompt created.", tone: "success" },
    deleted: { text: "Prompt removed.", tone: "success" },
    ran: { text: "Live run completed.", tone: "success" },
    ran_with_citations: { text: "Live run completed. Mention and citation records were stored.", tone: "success" },
    ran_no_citations: { text: "Live run completed. Mention stored, but no citation URL was detected in response.", tone: "success" },
    ran_no_brand_match: { text: "Live web run completed and recorded. Brand was not found, so mentions/citations tables were not updated.", tone: "success" },
    validation_error: { text: "Please check your input and try again.", tone: "error" },
    client_not_found: { text: "Client not found.", tone: "error" },
    platform_not_found: { text: "Selected platform is not available.", tone: "error" },
    not_found: { text: "Prompt or client record not found.", tone: "error" },
    live_missing_key: { text: "OPENAI_API_KEY is missing. Add it to .env.local to run live prompts.", tone: "error" },
    live_invalid_key: { text: "OPENAI_API_KEY is invalid. Check the key value and organization/project access.", tone: "error" },
    live_model_unavailable: { text: "Selected model does not support this request. Set OPENAI_WEB_MODEL to a supported model.", tone: "error" },
    live_rate_limited: { text: "OpenAI rate/quota limit reached. Retry shortly or check usage limits.", tone: "error" },
    live_web_unavailable: { text: "Web-enabled OpenAI response failed. Check model support for web_search_preview.", tone: "error" },
    live_request_failed: { text: "OpenAI request failed (network/timeout). Retry and check outbound network access.", tone: "error" },
    live_parse_error: { text: "Model response could not be parsed into expected structure.", tone: "error" },
    live_openai_error: { text: "OpenAI returned an error. Check API settings and model permissions.", tone: "error" },
    run_mention_insert_error: { text: "Mention insert failed. Check DB/RLS permissions for mentions table.", tone: "error" },
    run_citation_insert_error: { text: "Citation insert failed. Check DB/RLS permissions for citations table.", tone: "error" },
    run_history_error: { text: "Live run output could not be recorded. Check prompt_runs table/RLS permissions.", tone: "error" },
    create_error: { text: "Prompt could not be created.", tone: "error" },
    delete_error: { text: "Prompt could not be deleted.", tone: "error" },
    run_error: { text: "Live run failed. Check API key, web-enabled model access, or network.", tone: "error" }
  };

  return statusMap[status] ?? null;
}

function getPriorityStyles(priority: PromptRow["priority"]) {
  if (priority === "high") {
    return "border-[#f0c8c4] bg-[#fdf2f1] text-[#8e2e28]";
  }

  if (priority === "low") {
    return "border-[#d4e8d7] bg-[#f2faf4] text-[#1f6b40]";
  }

  return "border-[#d9dadd] bg-[#f6f7f8] text-ink";
}

function getWordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function parseRunCitations(value: unknown): PromptRunCitation[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }
      const row = item as Record<string, unknown>;
      if (typeof row.url !== "string") {
        return null;
      }

      return {
        url: row.url,
        sourceType: typeof row.sourceType === "string" ? row.sourceType : "other",
        authorityScore: typeof row.authorityScore === "number" ? row.authorityScore : null
      } satisfies PromptRunCitation;
    })
    .filter((item): item is PromptRunCitation => item !== null);
}

async function getPageData(selectedClientId: string | null) {
  const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value ?? null;
  if (!accessToken) {
    return {
      clients: [] as ClientRow[],
      selectedClientId: null as string | null,
      prompts: [] as PromptRow[],
      runs: [] as PromptRunPreview[]
    };
  }

  const supabase = createServerSupabaseClient(accessToken);
  const clientsResult = await supabase.from("clients").select("id,name,domain,active_platforms").order("created_at", { ascending: false });
  const clients = ((clientsResult.data ?? []) as ClientRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    domain: row.domain,
    active_platforms: Array.isArray(row.active_platforms)
      ? row.active_platforms.filter((item): item is string => typeof item === "string")
      : []
  }));
  const resolvedClientId = selectedClientId && clients.some((client) => client.id === selectedClientId) ? selectedClientId : clients[0]?.id ?? null;

  if (!resolvedClientId) {
    return {
      clients,
      selectedClientId: null,
      prompts: [],
      runs: []
    };
  }

  const [promptResult, runsResult] = await Promise.all([
    supabase.from("queries").select("id,text,category,priority,created_at").eq("client_id", resolvedClientId).order("created_at", { ascending: false }),
    supabase
      .from("prompt_runs")
      .select("id,answer,brand_mentioned,citations,detected_at,platforms(name),queries(text)")
      .eq("client_id", resolvedClientId)
      .order("detected_at", { ascending: false })
      .limit(12)
  ]);

  const runs: PromptRunPreview[] = (runsResult.data ?? []).map((row) => {
    const queryRelation = Array.isArray(row.queries) ? row.queries[0] : row.queries;
    const platformRelation = Array.isArray(row.platforms) ? row.platforms[0] : row.platforms;
    return {
      id: row.id,
      query: queryRelation?.text ?? "Unknown query",
      answer: row.answer,
      detectedAt: row.detected_at,
      platform: platformRelation?.name ?? "Unknown",
      brandMentioned: row.brand_mentioned ?? false,
      citations: parseRunCitations(row.citations)
    };
  });

  return {
    clients,
    selectedClientId: resolvedClientId,
    prompts: (promptResult.data ?? []) as PromptRow[],
    runs
  };
}

export default async function PromptsPage({ searchParams }: PromptsPageProps) {
  const selectedClientId = typeof searchParams?.clientId === "string" ? searchParams.clientId : null;
  const status = typeof searchParams?.status === "string" ? searchParams.status : undefined;
  const statusMessage = getStatusMessage(status);
  const data = await getPageData(selectedClientId);
  const selectedClient = data.selectedClientId ? data.clients.find((item) => item.id === data.selectedClientId) ?? null : null;
  const defaultPlatformSlug = selectedClient?.active_platforms[0] ?? "chatgpt";
  const runPlatformOptions = selectedClient?.active_platforms.length ? selectedClient.active_platforms : [defaultPlatformSlug];
  const promptCount = data.prompts.length;
  const mentionCount = data.runs.length;
  const citationCount = data.runs.reduce((sum, run) => sum + run.citations.length, 0);
  const activePlatformCount = runPlatformOptions.length;
  const mentionsHref = data.selectedClientId ? `/mentions?clientId=${encodeURIComponent(data.selectedClientId)}` : "/mentions";
  const citationsHref = data.selectedClientId ? `/citations?clientId=${encodeURIComponent(data.selectedClientId)}` : "/citations";
  const runCitations: RunCitationPreview[] = data.runs
    .flatMap((run) =>
      run.citations.map((citation, index) => ({
        id: `${run.id}-${index}`,
        query: run.query,
        sourceUrl: citation.url,
        sourceType: citation.sourceType,
        authorityScore: citation.authorityScore,
        detectedAt: run.detectedAt,
        platform: run.platform,
        brandMentioned: run.brandMentioned
      }))
    )
    .slice(0, 10);

  return (
    <div className="mx-auto w-full max-w-[1320px]">
      <DashboardHeader
        description="Build client prompt sets, execute live model runs, and inspect full mention and citation output without losing detail."
        title="Prompt Intelligence Studio"
        actions={
          <>
            <Link
              className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl border border-surface-border bg-white px-3 text-xs font-semibold text-ink hover:bg-brand-soft"
              href={mentionsHref}
            >
              <Bot className="h-4 w-4 text-text-secondary" />
              Mention Feed
            </Link>
            <Link
              className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl border border-surface-border bg-white px-3 text-xs font-semibold text-ink hover:bg-brand-soft"
              href={citationsHref}
            >
              <FileSearch className="h-4 w-4 text-text-secondary" />
              Citation Feed
            </Link>
          </>
        }
      />

      {statusMessage ? (
        <section
          className={`surface-panel mt-4 rounded-xl border px-4 py-3 text-sm ${
            statusMessage.tone === "success"
              ? "border-success/30 bg-success/10 text-success"
              : "border-critical/30 bg-critical/10 text-critical"
          }`}
        >
          {statusMessage.text}
        </section>
      ) : null}

      {data.clients.length === 0 ? (
        <section className="surface-panel mt-4 p-6 md:p-8">
          <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-text-secondary">No Client Scope</p>
          <h2 className="mt-3 text-2xl font-semibold text-ink">Create a client to start prompt operations.</h2>
          <p className="mt-2 max-w-2xl text-sm text-text-secondary">
            Prompt sets, model runs, mention outputs, and citation extraction are all tied to a client workspace.
          </p>
          <Link className="focus-ring mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-600" href="/clients/new">
            <Building2 className="h-4 w-4" />
            Create Client
          </Link>
        </section>
      ) : (
        <>
          <section className="surface-panel mt-4 overflow-hidden rounded-2xl border border-surface-border bg-brand text-white">
            <div className="bg-gradient-to-r from-[#171a20] via-[#1f2430] to-[#101319] px-4 py-5 md:px-6 md:py-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-2xl">
                  <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/70">Execution Scope</p>
                  <h2 className="mt-2 text-xl font-semibold leading-tight text-white md:text-2xl">
                    {selectedClient?.name ?? "Select a client"}
                  </h2>
                  <p className="mt-2 text-sm text-white/75">
                    Live prompt response and citation capture are currently running for <span className="font-semibold text-white">{selectedClient?.domain ?? "no domain"}</span>.
                  </p>
                </div>
                <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:grid-cols-4">
                  <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-2">
                    <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-white/70">Prompts</p>
                    <p className="mt-1 text-lg font-semibold text-white">{promptCount}</p>
                  </div>
                  <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-2">
                    <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-white/70">Runs</p>
                    <p className="mt-1 text-lg font-semibold text-white">{mentionCount}</p>
                  </div>
                  <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-2">
                    <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-white/70">Citations</p>
                    <p className="mt-1 text-lg font-semibold text-white">{citationCount}</p>
                  </div>
                  <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-2">
                    <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-white/70">Platforms</p>
                    <p className="mt-1 text-lg font-semibold text-white">{activePlatformCount}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-nowrap gap-2 overflow-x-auto pb-1">
                {data.clients.map((client) => {
                  const active = client.id === data.selectedClientId;
                  return (
                    <Link
                      className={`focus-ring inline-flex min-h-11 shrink-0 items-center rounded-xl border px-3 text-xs font-semibold transition-colors ${
                        active
                          ? "border-white/25 bg-white text-ink"
                          : "border-white/18 bg-white/10 text-white hover:bg-white/20"
                      }`}
                      href={`/prompts?clientId=${encodeURIComponent(client.id)}`}
                      key={client.id}
                    >
                      {client.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="mt-5 grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1.22fr)_minmax(0,1fr)]">
            <div className="space-y-4">
              {data.selectedClientId ? (
                <article className="surface-panel p-4 md:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="text-base font-semibold text-ink">Create Prompt</h2>
                      <p className="mt-1 text-xs text-text-secondary">Define search intent, category, and execution priority.</p>
                    </div>
                    <span className="inline-flex min-h-8 items-center gap-1 rounded-full border border-surface-border bg-brand-soft px-2.5 text-[11px] font-semibold text-ink">
                      <Search className="h-3.5 w-3.5" />
                      Query Builder
                    </span>
                  </div>
                  <form action={createPromptAction} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1.2fr_0.8fr_0.52fr_auto] md:items-end">
                    <input name="clientId" type="hidden" value={data.selectedClientId} />
                    <label className="text-xs text-text-secondary">
                      Prompt Text
                      <input
                        className="focus-ring mt-1 block min-h-11 w-full rounded-xl border border-surface-border bg-white px-3 text-sm text-ink"
                        name="text"
                        placeholder="e.g. best SEO agency for enterprise SaaS"
                        required
                        type="text"
                      />
                    </label>
                    <label className="text-xs text-text-secondary">
                      Category
                      <input
                        className="focus-ring mt-1 block min-h-11 w-full rounded-xl border border-surface-border bg-white px-3 text-sm text-ink"
                        name="category"
                        placeholder="SEO Agency"
                        required
                        type="text"
                      />
                    </label>
                    <label className="text-xs text-text-secondary">
                      Priority
                      <select className="focus-ring mt-1 block min-h-11 w-full rounded-xl border border-surface-border bg-white px-3 text-sm text-ink" defaultValue="medium" name="priority">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </label>
                    <button className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-600" type="submit">
                      <Sparkles className="h-4 w-4" />
                      Add Prompt
                    </button>
                  </form>
                </article>
              ) : null}

              <article className="surface-panel overflow-hidden">
                <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
                  <h2 className="text-base font-semibold text-ink">Prompt Queue</h2>
                  <span className="text-xs font-semibold text-text-secondary">{promptCount} total</span>
                </div>

                {data.prompts.length === 0 ? (
                  <div className="px-4 py-5 text-sm text-text-secondary">No prompts yet. Add your first prompt above.</div>
                ) : (
                  <div className="max-h-[780px] space-y-2 overflow-y-auto p-3">
                    {data.prompts.map((prompt) => (
                      <article className="rounded-xl border border-surface-border bg-white p-3.5" key={prompt.id}>
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="max-w-3xl text-sm font-semibold leading-relaxed text-ink">{prompt.text}</p>
                          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${getPriorityStyles(prompt.priority)}`}>
                            {prompt.priority}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-text-secondary">
                          <span className="rounded-md border border-surface-border bg-brand-soft px-2 py-1">{prompt.category}</span>
                          <span>{formatDate(prompt.created_at)}</span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <form action={runPromptTestAction} className="flex flex-wrap items-center gap-2">
                            <input name="clientId" type="hidden" value={data.selectedClientId ?? ""} />
                            <input name="queryId" type="hidden" value={prompt.id} />
                            <select
                              className="focus-ring min-h-11 rounded-lg border border-surface-border bg-white px-2.5 text-xs font-semibold text-ink"
                              defaultValue={defaultPlatformSlug}
                              name="platformSlug"
                            >
                              {runPlatformOptions.map((slug) => (
                                <option key={slug} value={slug}>
                                  {slug}
                                </option>
                              ))}
                            </select>
                            <button className="focus-ring inline-flex min-h-11 items-center rounded-lg bg-brand px-3 text-xs font-semibold text-white hover:bg-brand-600" type="submit">
                              Run Live
                            </button>
                          </form>

                          <form action={deletePromptAction}>
                            <input name="clientId" type="hidden" value={data.selectedClientId ?? ""} />
                            <input name="queryId" type="hidden" value={prompt.id} />
                            <button className="focus-ring inline-flex min-h-11 items-center rounded-lg border border-critical/30 bg-critical/10 px-3 text-xs font-semibold text-critical hover:bg-critical/20" type="submit">
                              Remove
                            </button>
                          </form>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </article>
            </div>

            <div className="space-y-4">
              <article className="surface-panel p-4 md:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-ink">Recent Run Output</h3>
                    <p className="mt-1 text-xs text-text-secondary">Every Run Live result appears here, even when brand match is false.</p>
                  </div>
                  <span className="inline-flex min-h-8 items-center gap-1 rounded-full border border-surface-border bg-brand-soft px-2.5 text-[11px] font-semibold text-ink">
                    <Gauge className="h-3.5 w-3.5" />
                    Live
                  </span>
                </div>

                {data.runs.length === 0 ? (
                  <p className="mt-3 rounded-xl border border-surface-border bg-white px-3 py-4 text-sm text-text-secondary">
                    No run output yet. Trigger <span className="font-semibold text-ink">Run Live</span> from a prompt card.
                  </p>
                ) : (
                  <ul className="mt-3 max-h-[380px] space-y-2 overflow-y-auto pr-1">
                    {data.runs.map((row) => (
                      <li className="rounded-xl border border-surface-border bg-white px-3 py-3" key={row.id}>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-text-secondary">
                          <span className="rounded-md border border-surface-border bg-brand-soft px-2 py-1 font-semibold text-ink">{row.platform}</span>
                          <span>{formatDate(row.detectedAt)}</span>
                          <span>{getWordCount(row.answer)} words</span>
                          <span className={`rounded-md border px-2 py-1 font-semibold ${row.brandMentioned ? "border-[#d4e8d7] bg-[#f2faf4] text-[#1f6b40]" : "border-[#f0c8c4] bg-[#fdf2f1] text-[#8e2e28]"}`}>
                            {row.brandMentioned ? "Brand matched" : "No brand match"}
                          </span>
                        </div>
                        <p className="mt-2 text-xs font-semibold text-ink">{row.query}</p>
                        <p className="mt-2 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-text-secondary">{row.answer}</p>
                      </li>
                    ))}
                  </ul>
                )}

                <Link className="focus-ring mt-3 inline-flex min-h-11 items-center rounded-lg border border-surface-border bg-white px-3 text-xs font-semibold text-ink hover:bg-brand-soft" href={mentionsHref}>
                  Open full mention analytics
                </Link>
              </article>

              <article className="surface-panel p-4 md:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-ink">Recent Citation Output (Run)</h3>
                    <p className="mt-1 text-xs text-text-secondary">Citation candidates extracted from latest run payloads.</p>
                  </div>
                  <span className="inline-flex min-h-8 items-center gap-1 rounded-full border border-surface-border bg-brand-soft px-2.5 text-[11px] font-semibold text-ink">
                    <FileSearch className="h-3.5 w-3.5" />
                    Source Scan
                  </span>
                </div>

                {runCitations.length === 0 ? (
                  <p className="mt-3 rounded-xl border border-surface-border bg-white px-3 py-4 text-sm text-text-secondary">
                    No citation URL detected in recent runs.
                  </p>
                ) : (
                  <ul className="mt-3 max-h-[380px] space-y-2 overflow-y-auto pr-1">
                    {runCitations.map((row) => (
                      <li className="rounded-xl border border-surface-border bg-white px-3 py-3" key={row.id}>
                        <p className="text-xs font-semibold text-ink">{row.query}</p>
                        <a className="mt-1 block break-all text-[12px] font-medium text-secondary hover:underline" href={row.sourceUrl} rel="noreferrer" target="_blank">
                          {row.sourceUrl}
                        </a>
                        <p className="mt-2 text-[11px] text-text-secondary">
                          {row.platform} | Type {row.sourceType} | Authority {row.authorityScore ?? "N/A"} | {formatDate(row.detectedAt)}
                        </p>
                        <p className={`mt-1 text-[11px] font-semibold ${row.brandMentioned ? "text-[#1f6b40]" : "text-[#8e2e28]"}`}>
                          {row.brandMentioned ? "Brand matched run" : "No brand match run"}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}

                <Link className="focus-ring mt-3 inline-flex min-h-11 items-center rounded-lg border border-surface-border bg-white px-3 text-xs font-semibold text-ink hover:bg-brand-soft" href={citationsHref}>
                  Open full citation analytics
                </Link>
              </article>

              <article className="surface-panel p-4">
                <div className="flex items-start gap-2">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-soft">
                    <Bot className="h-4 w-4 text-ink" />
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold text-ink">Execution Notes</h4>
                    <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                      Generic prompts should return neutral market output. Brand-focused output is expected only when the prompt contains the brand token or domain.
                    </p>
                  </div>
                </div>
              </article>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
