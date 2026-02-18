export default function DashboardLoading() {
  return (
    <div className="mx-auto w-full max-w-[1320px] animate-pulse space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="h-5 w-48 rounded bg-brand-soft/70" />
          <div className="h-4 w-72 rounded bg-brand-soft/50" />
        </div>
        <div className="h-10 w-32 rounded-xl bg-brand-soft/60" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="h-28 rounded-2xl border border-surface-border bg-white" />
        <div className="h-28 rounded-2xl border border-surface-border bg-white" />
        <div className="h-28 rounded-2xl border border-surface-border bg-white" />
        <div className="h-28 rounded-2xl border border-surface-border bg-white" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="h-[360px] rounded-2xl border border-surface-border bg-white xl:col-span-2" />
        <div className="h-[360px] rounded-2xl border border-surface-border bg-white" />
      </div>
    </div>
  );
}
