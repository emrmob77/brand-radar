import Link from "next/link";
import { DashboardHeader } from "@/components/layout/geo-shell";

const helpSections = [
  {
    id: "getting-started",
    title: "Getting Started",
    points: [
      "Complete onboarding from /activation to configure agency profile and initial client.",
      "Set platform tracking and seed one first query to activate visibility metrics.",
      "Use the export button on each page to download focused analysis snapshots."
    ]
  },
  {
    id: "visibility-mentions",
    title: "Visibility and Mentions",
    points: [
      "AI Visibility page compares platform-level share of voice and trend lines.",
      "Mentions page supports advanced filters for platform, sentiment, risk, and date range.",
      "Live mention stream includes infinite scroll and real-time updates."
    ]
  },
  {
    id: "forensics-alerts",
    title: "Forensics and Alerts",
    points: [
      "Citation Forensics highlights authority, lost citations, and source opportunities.",
      "Alerts center lets you configure thresholds and monitor high-risk signal shifts.",
      "Hallucination workbench tracks incorrect outputs and remediation status."
    ]
  },
  {
    id: "workspace-admin",
    title: "Workspace Admin",
    points: [
      "Use White-Label settings for logo, colors, custom domain, and branded invitations.",
      "Team settings controls user roles and per-client permissions.",
      "Profile and settings pages are available from the avatar menu."
    ]
  }
];

export default function HelpPage() {
  return (
    <div className="mx-auto w-full max-w-[1320px]">
      <DashboardHeader
        title="Help Center"
        description="Contextual guidance for onboarding, analytics workflows, configuration, and troubleshooting."
      />

      <section className="surface-panel p-5">
        <h2 className="text-lg font-bold text-ink">Quick Links</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {helpSections.map((section) => (
            <a
              className="focus-ring inline-flex min-h-11 items-center rounded-xl border border-surface-border bg-white px-3 py-2 text-xs font-semibold text-ink hover:bg-brand-soft"
              href={`#${section.id}`}
              key={section.id}
            >
              {section.title}
            </a>
          ))}
          <Link
            className="focus-ring inline-flex min-h-11 items-center rounded-xl border border-surface-border bg-white px-3 py-2 text-xs font-semibold text-ink hover:bg-brand-soft"
            href="/settings"
          >
            Go Settings
          </Link>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {helpSections.map((section) => (
          <article className="surface-panel p-5" id={section.id} key={section.id}>
            <h3 className="text-base font-bold text-ink">{section.title}</h3>
            <ul className="mt-3 space-y-2">
              {section.points.map((point) => (
                <li className="rounded-lg border border-surface-border bg-white px-3 py-2 text-sm text-text-secondary" key={point}>
                  {point}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}
