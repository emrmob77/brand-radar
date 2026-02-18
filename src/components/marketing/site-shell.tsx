import Link from "next/link";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" }
] as const;

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[22rem] bg-[radial-gradient(circle_at_top,_rgba(17,19,24,0.12),_rgba(245,245,246,0)_68%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,_rgba(17,19,24,0.04)_0%,_rgba(17,19,24,0)_42%,_rgba(37,99,235,0.08)_100%)]" />

      <header className="glass-header sticky top-0 z-40">
        <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between px-4 py-3 lg:px-6">
          <Link className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl px-2" href="/">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-xs font-bold tracking-[0.12em] text-white">BR</span>
            <span className="text-sm font-semibold text-ink">Brand Radar</span>
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link
                className="focus-ring inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-text-secondary transition hover:bg-white hover:text-ink"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              className="focus-ring inline-flex min-h-11 items-center rounded-xl border border-surface-border bg-white px-3 text-sm font-semibold text-ink hover:bg-brand-soft"
              href="/login"
            >
              Login
            </Link>
            <Link className="focus-ring inline-flex min-h-11 items-center rounded-xl bg-brand px-3 text-sm font-semibold text-white hover:bg-brand-600" href="/register">
              Start Free
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">{children}</main>

      <footer className="relative z-10 border-t border-surface-border bg-white/70">
        <div className="mx-auto grid w-full max-w-[1320px] gap-8 px-4 py-10 lg:grid-cols-3 lg:px-6">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-text-secondary">Brand Radar</p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-text-secondary">
              Enterprise intelligence platform for AI visibility, citation quality, and reputation risk management.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold text-ink">Product</p>
              <ul className="mt-3 space-y-2 text-text-secondary">
                <li>
                  <Link className="hover:text-ink" href="/features">
                    Features
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-ink" href="/pricing">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-ink" href="/dashboard">
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-ink">Company</p>
              <ul className="mt-3 space-y-2 text-text-secondary">
                <li>
                  <Link className="hover:text-ink" href="/about">
                    About
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-ink" href="/contact">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-ink" href="/login">
                    Sign in
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-surface-border bg-white p-4">
            <p className="text-xs font-semibold text-ink">Ready to operationalize GEO?</p>
            <p className="mt-2 text-sm text-text-secondary">Get your first visibility benchmark in under 10 minutes.</p>
            <Link className="focus-ring mt-4 inline-flex min-h-11 items-center rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-600" href="/register">
              Create Workspace
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
