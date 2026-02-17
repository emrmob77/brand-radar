"use client";

import { formatDistanceToNow } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import {
  type AlertItem,
  type AlertRuleCondition,
  type AlertRuleItem,
  type AlertRuleMetric,
  createAlertRuleAction,
  evaluateAlertRulesAction,
  markAlertsAsReadAction
} from "@/app/(dashboard)/actions/alerts";

type AlertsCenterProps = {
  clientId: string | null;
  initialAlerts: AlertItem[];
  initialRules: AlertRuleItem[];
};

function severityClass(severity: AlertItem["severity"]) {
  if (severity === "critical") return "border-red-200 bg-red-50 text-red-700";
  if (severity === "warning") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-sky-200 bg-sky-50 text-sky-700";
}

export function AlertsCenter({ clientId, initialAlerts, initialRules }: AlertsCenterProps) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [rules, setRules] = useState(initialRules);
  const [form, setForm] = useState({
    name: "",
    metric: "mentions" as AlertRuleMetric,
    condition: "above" as AlertRuleCondition,
    threshold: "10"
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sortedAlerts = useMemo(
    () => [...alerts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [alerts]
  );

  useEffect(() => {
    const unreadIds = alerts.filter((alert) => !alert.read).map((alert) => alert.id);
    if (unreadIds.length === 0) {
      return;
    }

    setAlerts((prev) => prev.map((alert) => (unreadIds.includes(alert.id) ? { ...alert, read: true } : alert)));
    void markAlertsAsReadAction(unreadIds);
  }, [alerts]);

  async function onCreateRule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!clientId) {
      setError("Select a client first.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);

    const thresholdValue = Number(form.threshold);
    const result = await createAlertRuleAction({
      clientId,
      name: form.name,
      metric: form.metric,
      condition: form.condition,
      threshold: Number.isFinite(thresholdValue) ? thresholdValue : 0
    });
    setSubmitting(false);

    if (!result.ok || !result.rule) {
      setError(result.error ?? "Could not create alert rule.");
      return;
    }

    setRules((prev) => [result.rule, ...prev]);
    setForm((prev) => ({ ...prev, name: "", threshold: "10" }));
    setMessage("Alert rule created.");
  }

  async function onRunEvaluation() {
    if (!clientId) {
      setError("Select a client first.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);
    const result = await evaluateAlertRulesAction(clientId);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error ?? "Rule evaluation failed.");
      return;
    }

    setMessage(`Rules evaluated: ${result.evaluated}, alerts created: ${result.created}.`);
  }

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
      <article className="surface-panel p-5 xl:col-span-3">
        <h2 className="text-lg font-bold text-ink">Alerts Feed</h2>
        <p className="mt-1 text-sm text-text-secondary">Sorted by timestamp and marked as read when viewed.</p>
        <div className="mt-4 space-y-3">
          {sortedAlerts.length === 0 ? (
            <p className="rounded-xl border border-surface-border bg-slate-50 px-4 py-3 text-sm text-text-secondary">No alerts generated yet.</p>
          ) : (
            sortedAlerts.map((alert) => (
              <article className="rounded-xl border border-surface-border bg-white p-3" key={alert.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">{alert.title}</p>
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] ${severityClass(alert.severity)}`}>
                    {alert.severity}
                  </span>
                </div>
                <p className="mt-1 text-sm text-text-secondary">{alert.message}</p>
                <p className="mt-2 text-[11px] text-text-secondary">{formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}</p>
              </article>
            ))
          )}
        </div>
      </article>

      <article className="surface-panel p-5 xl:col-span-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-ink">Rule Management</h2>
          <button
            className="focus-ring rounded-xl border border-surface-border bg-white px-3 py-2 text-xs font-semibold text-ink hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitting}
            onClick={() => {
              void onRunEvaluation();
            }}
            type="button"
          >
            Run Checks
          </button>
        </div>

        <form className="mt-4 space-y-3" onSubmit={onCreateRule}>
          <div>
            <label className="mb-1 block text-xs font-semibold text-text-secondary" htmlFor="rule-name">
              Rule Name
            </label>
            <input
              className="focus-ring w-full rounded-xl border border-surface-border bg-white px-3 py-2 text-sm"
              id="rule-name"
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Example: Sentiment drop monitor"
              required
              type="text"
              value={form.name}
            />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-text-secondary" htmlFor="rule-metric">
                Metric
              </label>
              <select
                className="focus-ring w-full rounded-xl border border-surface-border bg-white px-3 py-2 text-sm"
                id="rule-metric"
                onChange={(event) => setForm((prev) => ({ ...prev, metric: event.target.value as AlertRuleMetric }))}
                value={form.metric}
              >
                <option value="mentions">Mentions</option>
                <option value="sentiment">Sentiment</option>
                <option value="citations">Citations</option>
                <option value="hallucinations">Hallucinations</option>
                <option value="competitor_movement">Competitor Movement</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-text-secondary" htmlFor="rule-condition">
                Condition
              </label>
              <select
                className="focus-ring w-full rounded-xl border border-surface-border bg-white px-3 py-2 text-sm"
                id="rule-condition"
                onChange={(event) => setForm((prev) => ({ ...prev, condition: event.target.value as AlertRuleCondition }))}
                value={form.condition}
              >
                <option value="above">Above</option>
                <option value="below">Below</option>
                <option value="equals">Equals</option>
                <option value="changes_by">Changes By (%)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-text-secondary" htmlFor="rule-threshold">
              Threshold
            </label>
            <input
              className="focus-ring w-full rounded-xl border border-surface-border bg-white px-3 py-2 text-sm"
              id="rule-threshold"
              min="0"
              onChange={(event) => setForm((prev) => ({ ...prev, threshold: event.target.value }))}
              required
              step="0.1"
              type="number"
              value={form.threshold}
            />
          </div>

          <button
            className="focus-ring w-full rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitting}
            type="submit"
          >
            {submitting ? "Saving..." : "Create Rule"}
          </button>
        </form>

        {error ? <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p> : null}
        {message ? <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{message}</p> : null}

        <div className="mt-4 space-y-2">
          {rules.length === 0 ? (
            <p className="text-sm text-text-secondary">No rules defined for this client.</p>
          ) : (
            rules.map((rule) => (
              <article className="rounded-xl border border-surface-border bg-white px-3 py-2 text-xs" key={rule.id}>
                <p className="font-semibold text-ink">{rule.name}</p>
                <p className="mt-0.5 text-text-secondary">
                  {rule.metric} {rule.condition} {rule.threshold}
                </p>
              </article>
            ))
          )}
        </div>
      </article>
    </section>
  );
}
