"use client";

import {
  AlertTriangle,
  Bell,
  Bot,
  CalendarRange,
  ChartNoAxesCombined,
  ChevronDown,
  FileSearch,
  Gauge,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  Sparkles,
  UserCircle2,
  Users,
  X
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { NotificationBell } from "@/components/alerts/notification-bell";
import { mainNavigation, NavIcon, NavItem, systemNavigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";

const iconMap: Record<NavIcon, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  visibility: Gauge,
  mentions: Bot,
  competitors: ChartNoAxesCombined,
  optimizations: Sparkles,
  trends: CalendarRange,
  clients: Users,
  citations: FileSearch,
  forensics: FileSearch,
  alerts: Bell,
  hallucinations: AlertTriangle,
  settings: Settings
};

const allNavigation: NavItem[] = [...mainNavigation, ...systemNavigation];

export type ClientSummary = {
  id: string;
  name: string;
  domain?: string | null;
};

type AppShellProps = {
  children: React.ReactNode;
  hideSidebar?: boolean;
  clients?: ClientSummary[];
  accessToken?: string | null;
};

type DashboardHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

type NavigationGroupProps = {
  title: string;
  items: NavItem[];
  pathname: string;
  selectedClientId: string | null;
};

function NavigationGroup({ title, items, pathname, selectedClientId }: NavigationGroupProps) {
  return (
    <section>
      <p className="px-1.5 text-[9px] font-mono uppercase tracking-[0.18em] text-text-secondary md:text-center xl:text-left">
        <span className="md:hidden xl:inline">{title}</span>
      </p>
      <ul className="mt-1.5 space-y-1">
        {items.map((item) => {
          const Icon = iconMap[item.icon];
          const active = pathname === item.href;
          const href = selectedClientId ? `${item.href}?clientId=${encodeURIComponent(selectedClientId)}` : item.href;

          return (
            <li key={item.href}>
              <Link
                className={cn(
                  "group relative flex items-center gap-2.5 rounded-xl border px-2.5 py-2 transition-all focus-ring md:justify-center md:px-2 xl:justify-start xl:px-2.5",
                  active
                    ? "border-brand/25 bg-brand text-white shadow-[0_8px_20px_rgba(17,19,24,0.22)]"
                    : "border-transparent bg-white/40 text-text-secondary hover:border-surface-border hover:bg-white hover:text-ink"
                )}
                href={href}
                title={item.label}
              >
                <span className={cn("grid h-6 w-6 place-items-center rounded-md", active ? "bg-white/12" : "bg-brand-soft")}>
                  <Icon className={cn("h-3 w-3", active ? "text-white" : "text-ink")} />
                </span>
                <div className="min-w-0 md:hidden xl:block">
                  <p className="truncate text-[13px] font-semibold leading-tight">{item.label}</p>
                  <p className={cn("truncate text-[11px] leading-tight", active ? "text-white/75" : "text-text-secondary")}>{item.hint}</p>
                </div>
                <span
                  className={cn(
                    "pointer-events-none absolute left-[calc(100%+0.55rem)] top-1/2 z-20 hidden -translate-y-1/2 whitespace-nowrap rounded-md border px-2 py-1 text-[11px] font-semibold opacity-0 transition-opacity md:block md:group-hover:opacity-100 xl:hidden",
                    active
                      ? "border-brand bg-brand text-white"
                      : "border-surface-border bg-white text-ink shadow-[0_8px_16px_rgba(17,19,24,0.1)]"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function SidebarContent({ pathname, selectedClientId }: { pathname: string; selectedClientId: string | null }) {
  return (
    <div className="flex min-h-full flex-col bg-sidebar-bg">
      <div className="border-b border-surface-border px-4 py-4">
        <div className="rounded-2xl border border-surface-border bg-white p-3">
          <div className="flex items-center gap-2.5 md:justify-center xl:justify-start">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-white">
              <ChartNoAxesCombined className="h-3.5 w-3.5" />
            </div>
            <div className="md:hidden xl:block">
              <p className="text-[9px] font-mono uppercase tracking-[0.18em] text-text-secondary">Brand Radar</p>
              <p className="mt-0.5 text-[13px] font-semibold text-ink">Enterprise GEO</p>
            </div>
          </div>
          <p className="mt-2.5 rounded-lg border border-surface-border bg-brand-soft px-2.5 py-1 text-[10px] text-text-secondary md:hidden xl:block">
            Control Center
          </p>
        </div>
      </div>

      <nav aria-label="Main" className="min-h-0 flex-1 overflow-y-auto px-2.5 py-3">
        <NavigationGroup items={mainNavigation} pathname={pathname} selectedClientId={selectedClientId} title="Workspace" />
        <div className="mt-5">
          <NavigationGroup items={systemNavigation} pathname={pathname} selectedClientId={selectedClientId} title="System" />
        </div>
      </nav>

      <div className="border-t border-surface-border px-4 py-3.5">
        <div className="rounded-xl border border-surface-border bg-white p-2.5">
          <div className="flex items-center gap-2.5 md:justify-center xl:justify-start">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-soft text-xs font-bold text-ink">EA</div>
            <div className="min-w-0 flex-1 md:hidden xl:block">
              <p className="truncate text-[13px] font-semibold text-ink">Emrah A.</p>
              <p className="truncate text-[11px] text-text-secondary">admin@brandradar.ai</p>
            </div>
            <button aria-label="Notifications" className="focus-ring rounded-lg p-1.5 text-text-secondary hover:bg-brand-soft hover:text-ink" type="button">
              <Bell className="h-3.5 w-3.5" />
            </button>
          </div>
          <form action="/auth/sign-out" className="mt-2 md:hidden xl:block" method="post">
            <button
              className="focus-ring inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-surface-border px-2.5 py-1.5 text-[11px] font-semibold text-text-secondary hover:bg-brand-soft hover:text-ink"
              type="submit"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </form>
        </div>

        <div className="mt-2.5 rounded-xl border border-surface-border bg-white px-2.5 py-2 md:hidden xl:block">
          <p className="text-[9px] font-mono uppercase tracking-[0.16em] text-text-secondary">Data Health</p>
          <div className="mt-1.5 flex items-center justify-between text-[11px]">
            <p className="font-semibold text-ink">Signals Online</p>
            <p className="font-semibold text-ink">98.2%</p>
          </div>
          <div className="mt-1.5 h-1 rounded-full bg-brand-soft">
            <div className="h-1 w-[98.2%] rounded-full bg-brand" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children, hideSidebar = false, clients = [], accessToken = null }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientMenuRef = useRef<HTMLDivElement | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [clientMenuOpen, setClientMenuOpen] = useState(false);
  const [clientQuery, setClientQuery] = useState("");

  const shouldShowSidebar = useMemo(() => !hideSidebar, [hideSidebar]);
  const activeItem = useMemo(() => allNavigation.find((item) => pathname === item.href), [pathname]);
  const availableClients = clients;
  const selectedClientId = searchParams.get("clientId");
  const selectedClient = useMemo(
    () => availableClients.find((client) => client.id === selectedClientId) ?? availableClients[0] ?? null,
    [availableClients, selectedClientId]
  );
  const filteredClients = useMemo(() => {
    const query = clientQuery.trim().toLowerCase();
    if (!query) {
      return availableClients;
    }

    return availableClients.filter((client) => {
      return client.name.toLowerCase().includes(query) || client.domain?.toLowerCase().includes(query);
    });
  }, [availableClients, clientQuery]);
  const profileHref = selectedClient?.id ? `/settings/profile?clientId=${encodeURIComponent(selectedClient.id)}` : "/settings/profile";

  useEffect(() => {
    if (!shouldShowSidebar || availableClients.length === 0) {
      return;
    }

    const isClientInList = availableClients.some((client) => client.id === selectedClientId);
    if (selectedClientId && isClientInList) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("clientId", availableClients[0]?.id ?? "");
    router.replace(`${pathname}?${params.toString()}`);
  }, [availableClients, pathname, router, searchParams, selectedClientId, shouldShowSidebar]);

  useEffect(() => {
    if (!clientMenuOpen) {
      return;
    }

    function handleOutsideClick(event: MouseEvent) {
      if (!clientMenuRef.current?.contains(event.target as Node)) {
        setClientMenuOpen(false);
      }
    }

    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, [clientMenuOpen]);

  function selectClient(clientId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("clientId", clientId);
    router.push(`${pathname}?${params.toString()}`);
    setClientMenuOpen(false);
    setClientQuery("");
  }

  return (
    <div className="app-shell-bg flex min-h-screen bg-background-dark">
      {shouldShowSidebar && (
        <>
          <div
            className={cn(
              "fixed inset-0 z-30 bg-ink/45 transition-opacity md:hidden",
              mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
            )}
            onClick={() => setMobileOpen(false)}
          />

          <aside
            className={cn(
              "fixed inset-y-0 left-0 z-40 w-[272px] border-r border-surface-border bg-sidebar-bg transition-transform md:sticky md:top-0 md:h-screen md:w-[90px] md:translate-x-0 xl:w-[272px]",
              mobileOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <div className="flex items-center justify-end border-b border-surface-border px-3 py-2 md:hidden">
              <button aria-label="Close navigation" className="focus-ring rounded-lg p-2 text-text-secondary hover:bg-white" onClick={() => setMobileOpen(false)} type="button">
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent pathname={pathname} selectedClientId={selectedClient?.id ?? null} />
          </aside>
        </>
      )}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {shouldShowSidebar && (
          <header className="glass-header sticky top-0 z-20 flex h-[72px] items-center justify-between gap-3 px-4 md:px-8">
            <div className="flex items-center gap-3">
              <button
                aria-label="Open navigation"
                className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-xl border border-surface-border bg-white text-text-secondary hover:text-ink md:hidden"
                onClick={() => setMobileOpen(true)}
                type="button"
              >
                <Menu className="h-4 w-4" />
              </button>

              <div className="hidden md:block">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-secondary">Workspace</p>
                <p className="mt-0.5 text-sm font-semibold text-ink">{activeItem?.label ?? "Dashboard"}</p>
              </div>

              <div className="relative hidden lg:block" ref={clientMenuRef}>
                <button
                  className="focus-ring inline-flex min-w-[210px] items-center justify-between gap-2 rounded-xl border border-surface-border bg-white px-3 py-2 text-xs font-semibold text-ink hover:bg-brand-soft"
                  onClick={() => setClientMenuOpen((prev) => !prev)}
                  type="button"
                >
                  <span className="truncate">{selectedClient?.name ?? "Select Client"}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-text-secondary" />
                </button>

                {clientMenuOpen ? (
                  <div className="absolute left-0 z-30 mt-2 w-[300px] rounded-xl border border-surface-border bg-white p-2 shadow-[0_14px_26px_rgba(17,19,24,0.12)]">
                    <label className="sr-only" htmlFor="client-selector-search">
                      Search clients
                    </label>
                    <div className="flex items-center gap-2 rounded-lg border border-surface-border px-2.5 py-2">
                      <Search className="h-3.5 w-3.5 text-text-secondary" />
                      <input
                        className="w-full bg-transparent text-xs text-ink placeholder:text-text-secondary focus:outline-none"
                        id="client-selector-search"
                        onChange={(event) => setClientQuery(event.target.value)}
                        placeholder="Search client by name or domain"
                        type="text"
                        value={clientQuery}
                      />
                    </div>
                    <div className="mt-2 max-h-56 overflow-y-auto">
                      {filteredClients.length === 0 ? (
                        <p className="px-2.5 py-2 text-xs text-text-secondary">No matching client found.</p>
                      ) : (
                        filteredClients.map((client) => {
                          const active = client.id === selectedClient?.id;

                          return (
                            <button
                              className={cn(
                                "mt-1 block w-full rounded-lg px-2.5 py-2 text-left",
                                active ? "bg-brand-soft" : "hover:bg-brand-soft/70"
                              )}
                              key={client.id}
                              onClick={() => selectClient(client.id)}
                              type="button"
                            >
                              <p className="truncate text-xs font-semibold text-ink">{client.name}</p>
                              <p className="truncate text-[11px] text-text-secondary">{client.domain ?? "No domain"}</p>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="hidden items-center gap-2 rounded-xl border border-surface-border bg-white px-3 py-2 lg:flex">
                <Search className="h-4 w-4 text-text-secondary" />
                <label className="sr-only" htmlFor="global-search">
                  Search
                </label>
                <input
                  className="w-60 bg-transparent text-sm text-ink placeholder:text-text-secondary focus:outline-none"
                  id="global-search"
                  placeholder="Search clients, mentions, alerts"
                  type="text"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <NotificationBell accessToken={accessToken} clientId={selectedClient?.id ?? null} />
              <button className="focus-ring inline-flex items-center gap-1.5 rounded-xl border border-surface-border bg-white px-3 py-2 text-xs font-semibold text-ink hover:bg-brand-soft" type="button">
                <CalendarRange className="h-3.5 w-3.5 text-text-secondary" />
                This Month
                <ChevronDown className="h-3.5 w-3.5 text-text-secondary" />
              </button>
              <details className="group relative">
                <summary className="focus-ring inline-flex list-none items-center gap-2 rounded-xl border border-surface-border bg-white px-2.5 py-2 text-xs font-semibold text-ink hover:bg-brand-soft">
                  <span className="grid h-6 w-6 place-items-center rounded-lg bg-brand-soft text-[11px] font-bold text-ink">EA</span>
                  <span className="hidden sm:inline">Emrah A.</span>
                  <ChevronDown className="h-3.5 w-3.5 text-text-secondary" />
                </summary>
                <div className="absolute right-0 z-30 mt-2 w-52 rounded-xl border border-surface-border bg-white p-2 shadow-[0_14px_26px_rgba(17,19,24,0.12)]">
                  <div className="rounded-lg border border-surface-border bg-brand-soft px-2.5 py-2">
                    <p className="text-[11px] font-semibold text-ink">Emrah A.</p>
                    <p className="text-[10px] text-text-secondary">admin@brandradar.ai</p>
                  </div>
                  <Link className="mt-2 inline-flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-ink hover:bg-brand-soft" href={profileHref}>
                    <UserCircle2 className="h-3.5 w-3.5 text-text-secondary" />
                    Profile
                  </Link>
                  <form action="/auth/sign-out" method="post">
                    <button
                      className="inline-flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-critical hover:bg-critical/10"
                      type="submit"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign out
                    </button>
                  </form>
                </div>
              </details>
            </div>
          </header>
        )}

        <main className="flex-1 overflow-y-auto px-4 pb-10 pt-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}

export function DashboardHeader({ title, description, actions }: DashboardHeaderProps) {
  return (
    <section className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-secondary">Brand Radar Intelligence</p>
        <h1 className="mt-2 text-[1.9rem] font-semibold leading-tight text-ink md:text-[2.4rem]">{title}</h1>
        {description ? <p className="mt-2 text-sm leading-relaxed text-text-secondary">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </section>
  );
}
