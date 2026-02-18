import Link from "next/link";
import { Check } from "lucide-react";

type Plan = {
  name: string;
  price: string;
  description: string;
  cta: string;
  href: string;
  features: string[];
  featured?: boolean;
};

const plans: Plan[] = [
  {
    name: "Starter",
    price: "$99",
    description: "For focused teams validating GEO workflows.",
    cta: "Start Starter",
    href: "/register",
    features: ["1 client workspace", "Daily mention scan", "Basic citation checks", "Email alerts"]
  },
  {
    name: "Growth",
    price: "$299",
    description: "For agencies and in-house teams with active monitoring.",
    cta: "Choose Growth",
    href: "/register",
    featured: true,
    features: ["Up to 5 clients", "Real-time signal feed", "Competitor benchmark", "Weekly executive digest"]
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For regulated sectors and global organizations.",
    cta: "Contact Sales",
    href: "/contact",
    features: ["Unlimited entities", "SLA-backed onboarding", "Custom policy controls", "Dedicated analyst support"]
  }
];

const matrix = [
  { feature: "Visibility trend tracking", starter: true, growth: true, enterprise: true },
  { feature: "Citation forensics", starter: false, growth: true, enterprise: true },
  { feature: "Hallucination workbench", starter: false, growth: true, enterprise: true },
  { feature: "Team role controls", starter: false, growth: true, enterprise: true },
  { feature: "White-label workspace", starter: false, growth: false, enterprise: true }
] as const;

function AvailabilityCell({ enabled }: { enabled: boolean }) {
  return enabled ? (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white">
      <Check className="h-3.5 w-3.5" />
    </span>
  ) : (
    <span className="text-sm font-semibold text-text-secondary">-</span>
  );
}

export default function PricingPage() {
  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 pb-16 pt-8 md:pt-12 lg:px-6">
      <section className="rounded-3xl border border-surface-border bg-white p-6 sm:p-8">
        <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-text-secondary">Pricing</p>
        <h1 className="mt-3 text-3xl font-semibold text-ink sm:text-4xl">Simple tiers for growing GEO programs.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-secondary">
          Start with a focused setup and scale to multi-brand governance when your answer-engine operations mature.
        </p>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <article
            className={`surface-panel rounded-2xl p-5 sm:p-6 ${plan.featured ? "border-brand bg-[#f8f8fb]" : ""}`}
            key={plan.name}
          >
            <p className="text-sm font-semibold text-ink">{plan.name}</p>
            <p className="mt-2 text-3xl font-semibold text-ink">{plan.price}</p>
            <p className="mt-2 text-sm text-text-secondary">{plan.description}</p>

            <ul className="mt-5 space-y-2.5 text-sm text-text-secondary">
              {plan.features.map((feature) => (
                <li className="flex items-start gap-2" key={feature}>
                  <span className="mt-[0.15rem] inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-soft text-ink">
                    <Check className="h-3 w-3" />
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              className={`focus-ring mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold ${
                plan.featured
                  ? "bg-brand text-white hover:bg-brand-600"
                  : "border border-surface-border bg-white text-ink hover:bg-brand-soft"
              }`}
              href={plan.href}
            >
              {plan.cta}
            </Link>
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-3xl border border-surface-border bg-white p-4 sm:p-6">
        <h2 className="text-xl font-semibold text-ink">Feature Matrix</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">Capability</th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">Starter</th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">Growth</th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => (
                <tr className="border-b border-surface-border/70" key={row.feature}>
                  <td className="px-3 py-3 text-sm font-medium text-ink">{row.feature}</td>
                  <td className="px-3 py-3">
                    <AvailabilityCell enabled={row.starter} />
                  </td>
                  <td className="px-3 py-3">
                    <AvailabilityCell enabled={row.growth} />
                  </td>
                  <td className="px-3 py-3">
                    <AvailabilityCell enabled={row.enterprise} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
