export type NavIcon =
  | "dashboard"
  | "visibility"
  | "mentions"
  | "competitors"
  | "optimizations"
  | "trends"
  | "clients"
  | "forensics"
  | "alerts"
  | "hallucinations"
  | "settings";

export type NavItem = {
  href: string;
  label: string;
  icon: NavIcon;
  hint: string;
};

export const mainNavigation: NavItem[] = [
  { href: "/", label: "Dashboard", icon: "dashboard", hint: "Executive summary" },
  { href: "/visibility", label: "AI Visibility", icon: "visibility", hint: "Platform share" },
  { href: "/mentions", label: "Brand Mentions", icon: "mentions", hint: "Live sentiment" },
  { href: "/competitors", label: "Competitors", icon: "competitors", hint: "Market pressure" },
  { href: "/optimizations", label: "Optimizations", icon: "optimizations", hint: "Action board" },
  { href: "/trends", label: "Historical Trends", icon: "trends", hint: "Time analysis" },
  { href: "/clients", label: "Clients", icon: "clients", hint: "Portfolio health" },
  { href: "/forensics", label: "Citation Forensics", icon: "forensics", hint: "Source quality" }
];

export const systemNavigation: NavItem[] = [
  { href: "/alerts", label: "Alerts", icon: "alerts", hint: "Rule monitor" },
  { href: "/hallucinations", label: "Hallucinations", icon: "hallucinations", hint: "Risk control" },
  { href: "/settings", label: "Settings", icon: "settings", hint: "Workspace config" }
];
