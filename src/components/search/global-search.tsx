"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { searchGlobalAction, type GlobalSearchResult } from "@/app/(dashboard)/actions/global-search";
import { queryKeys } from "@/lib/query/keys";
import { cn } from "@/lib/utils";

type GlobalSearchProps = {
  clientId: string | null;
};

function kindLabel(kind: GlobalSearchResult["kind"]) {
  if (kind === "mention") return "Mention";
  if (kind === "citation") return "Citation";
  return "Query";
}

export function GlobalSearch({ clientId }: GlobalSearchProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const normalizedQuery = query.trim();
  const normalizedDebouncedQuery = debouncedQuery.trim();

  const searchQuery = useQuery({
    queryKey: queryKeys.globalSearch(clientId, normalizedDebouncedQuery),
    enabled: normalizedDebouncedQuery.length >= 2,
    staleTime: 45_000,
    queryFn: () =>
      searchGlobalAction({
        term: normalizedDebouncedQuery,
        clientId,
        limit: 15
      })
  });

  const results = useMemo<GlobalSearchResult[]>(() => {
    if (!searchQuery.data?.ok) {
      return [];
    }
    return searchQuery.data.results;
  }, [searchQuery.data]);

  const error = useMemo(() => {
    if (!searchQuery.data || searchQuery.data.ok) {
      return null;
    }
    return searchQuery.data.error;
  }, [searchQuery.data]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, 260);

    return () => window.clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => {
    if (normalizedDebouncedQuery.length < 2) {
      setOpen(false);
      return;
    }

    if (searchQuery.isFetching || searchQuery.data) {
      setOpen(true);
    }
  }, [normalizedDebouncedQuery, searchQuery.data, searchQuery.isFetching]);

  return (
    <div className="relative w-[340px]" ref={wrapperRef}>
      <div className="flex min-h-11 items-center gap-2 rounded-xl border border-surface-border bg-white px-3 py-2">
        {searchQuery.isFetching ? <Loader2 className="h-4 w-4 animate-spin text-text-secondary" /> : <Search className="h-4 w-4 text-text-secondary" />}
        <label className="sr-only" htmlFor="global-search">
          Global search
        </label>
        <input
          autoComplete="off"
          className="w-full bg-transparent text-sm text-ink placeholder:text-text-secondary focus:outline-none"
          id="global-search"
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => {
            if (normalizedQuery.length >= 2) {
              setOpen(true);
            }
          }}
          placeholder="Search mentions, citations, queries"
          type="text"
          value={query}
        />
      </div>

      {open ? (
        <div className="absolute left-0 right-0 z-40 mt-2 rounded-xl border border-surface-border bg-white p-2 shadow-[0_14px_26px_rgba(17,19,24,0.12)]">
          {searchQuery.isFetching ? (
            <div className="space-y-1 px-2.5 py-2">
              <p className="text-xs font-semibold text-ink">Searching...</p>
              <p className="text-[11px] text-text-secondary">Scanning mentions, citations, and queries.</p>
            </div>
          ) : error ? (
            <p className="px-2.5 py-2 text-xs text-red-700">{error}</p>
          ) : results.length === 0 ? (
            <p className="px-2.5 py-2 text-xs text-text-secondary">No results found.</p>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              {results.map((result) => (
                <Link
                  className="mt-1 block rounded-lg border border-transparent px-2.5 py-2 hover:border-surface-border hover:bg-brand-soft/60"
                  href={result.href}
                  key={`${result.kind}-${result.id}`}
                  onClick={() => setOpen(false)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-semibold text-ink">{result.title}</p>
                    <span
                      className={cn(
                        "rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]",
                        result.kind === "mention"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : result.kind === "citation"
                            ? "border-sky-200 bg-sky-50 text-sky-700"
                            : "border-violet-200 bg-violet-50 text-violet-700"
                      )}
                    >
                      {kindLabel(result.kind)}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[11px] text-text-secondary">{result.subtitle}</p>
                  <p className="mt-1 text-[10px] text-text-secondary">{result.meta}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
