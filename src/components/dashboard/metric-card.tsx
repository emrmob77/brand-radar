type MetricCardProps = {
  title: string;
  value: string;
  change: string;
  positive?: boolean;
};

export function MetricCard({ title, value, change, positive = true }: MetricCardProps) {
  return (
    <article className="rounded border border-surface-border bg-surface-dark p-5">
      <h3 className="text-xs uppercase tracking-wide text-text-secondary">{title}</h3>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="font-mono text-2xl font-bold text-white">{value}</p>
        <span className={positive ? "text-xs font-mono text-success" : "text-xs font-mono text-critical"}>
          {change}
        </span>
      </div>
    </article>
  );
}
