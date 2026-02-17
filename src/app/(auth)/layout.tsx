export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const brandName = process.env.NEXT_PUBLIC_BRAND_NAME?.trim() || "Brand Radar";
  const brandLogoUrl = process.env.NEXT_PUBLIC_BRAND_LOGO_URL?.trim();

  return (
    <main className="grid min-h-screen place-items-center bg-background-dark px-4 py-8">
      <div className="grid-pattern absolute inset-0" />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
          {brandLogoUrl ? (
            <div
              aria-label={`${brandName} logo`}
              className="h-10 w-10 rounded-lg bg-white bg-contain bg-center bg-no-repeat"
              role="img"
              style={{ backgroundImage: `url(${brandLogoUrl})` }}
            />
          ) : (
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand text-sm font-bold text-white">
              {brandName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-text-secondary">Secure Workspace</p>
            <p className="text-sm font-semibold text-white">{brandName}</p>
          </div>
        </div>
        {children}
      </div>
    </main>
  );
}
