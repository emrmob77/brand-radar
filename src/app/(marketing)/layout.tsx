import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/site-shell";

export const metadata: Metadata = {
  title: {
    default: "Brand Radar",
    template: "%s | Brand Radar"
  },
  description: "Brand Radar helps enterprise teams monitor AI visibility, citation quality, and reputation risk in real time."
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <MarketingShell>{children}</MarketingShell>;
}
