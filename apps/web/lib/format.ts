import type { CheckResult, RiskClass, Severity } from "./types";

export const RISK_META: Record<
  RiskClass,
  {
    label: string;
    short: string;
    hex: string;
    text: string;
    border: string;
    surface: string;
    description: string;
  }
> = {
  "Low Risk": {
    label: "Low Risk",
    short: "LOW",
    hex: "#34d399",
    text: "text-emerald-300",
    border: "border-emerald-400/25",
    surface: "bg-emerald-400/[0.07]",
    description:
      "No significant malicious indicators were found in the checks that ran. This is not proof of safety.",
  },
  Suspicious: {
    label: "Suspicious",
    short: "SUSPICIOUS",
    hex: "#f5b74e",
    text: "text-amber-300",
    border: "border-amber-400/30",
    surface: "bg-amber-400/[0.07]",
    description: "At least one meaningful indicator needs further investigation.",
  },
  "High Risk": {
    label: "High Risk",
    short: "HIGH",
    hex: "#fb923c",
    text: "text-orange-300",
    border: "border-orange-400/30",
    surface: "bg-orange-400/[0.08]",
    description: "Multiple significant indicators were supported by evidence.",
  },
  "Confirmed Malicious": {
    label: "Confirmed Malicious",
    short: "CONFIRMED",
    hex: "#f87171",
    text: "text-red-300",
    border: "border-red-400/30",
    surface: "bg-red-400/[0.08]",
    description:
      "An authoritative threat-intelligence source or sufficiently validated evidence confirms malicious activity.",
  },
  Inconclusive: {
    label: "Inconclusive",
    short: "UNKNOWN",
    hex: "#94a3b8",
    text: "text-slate-300",
    border: "border-slate-400/25",
    surface: "bg-slate-400/[0.07]",
    description:
      "Evidence is insufficient, key sources were unavailable, or relevant checks could not run.",
  },
};

export const SEVERITY_META: Record<Severity, { label: string; hex: string; rank: number }> = {
  critical: { label: "Critical", hex: "#f87171", rank: 4 },
  high: { label: "High", hex: "#fb923c", rank: 3 },
  medium: { label: "Medium", hex: "#f5b74e", rank: 2 },
  low: { label: "Low", hex: "#7dd3fc", rank: 1 },
  info: { label: "Info", hex: "#64748b", rank: 0 },
};

export const CATEGORY_LABELS: Record<string, string> = {
  url: "URL structure",
  domain: "Domain intelligence",
  dns: "DNS",
  web: "Website security",
  tls: "TLS & certificates",
  intel: "Threat intelligence",
  message: "Message analysis",
  correlation: "Correlation",
  risk: "Risk assessment",
  ai: "Explanation",
};

export const STATUS_META: Record<
  string,
  { label: string; className: string; dot: string }
> = {
  completed: { label: "Completed", className: "text-emerald-300/90", dot: "#34d399" },
  unavailable: { label: "Unavailable", className: "text-amber-300/90", dot: "#f5b74e" },
  error: { label: "Failed", className: "text-red-300/90", dot: "#f87171" },
  not_run: { label: "Not run", className: "text-slate-400", dot: "#64748b" },
  skipped_by_policy: { label: "Skipped", className: "text-slate-400", dot: "#64748b" },
};

export function formatPct(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${Math.round(value * 100)}%`;
}

export function formatScore(score: number): string {
  return `${Math.max(0, Math.min(100, Math.round(score)))}/100`;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const abs = Math.abs(diffSeconds);
  if (abs < 60) return formatter.format(diffSeconds, "second");
  if (abs < 3600) return formatter.format(Math.round(diffSeconds / 60), "minute");
  if (abs < 86400) return formatter.format(Math.round(diffSeconds / 3600), "hour");
  return formatter.format(Math.round(diffSeconds / 86400), "day");
}

export function formatDuration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

export function shortDigest(value: string | null | undefined, head = 10, tail = 8): string {
  if (!value) return "—";
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

export function truncate(value: string, max = 120): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

export function groupChecks(checks: CheckResult[]): { category: string; checks: CheckResult[] }[] {
  const order = ["url", "domain", "dns", "web", "tls", "intel", "message", "correlation", "ai", "risk"];
  const groups = new Map<string, CheckResult[]>();
  for (const check of checks) {
    if (check.category === "risk" || check.check_id === "ai.explanation") continue;
    const existing = groups.get(check.category) ?? [];
    existing.push(check);
    groups.set(check.category, existing);
  }
  return [...groups.entries()]
    .sort((a, b) => {
      const left = order.indexOf(a[0]);
      const right = order.indexOf(b[0]);
      return (left === -1 ? 99 : left) - (right === -1 ? 99 : right);
    })
    .map(([category, items]) => ({
      category,
      checks: items.sort((a, b) => a.id - b.id),
    }));
}

export function countFindings(checks: CheckResult[]): number {
  return checks.reduce((total, check) => total + check.findings.length, 0);
}

export function highestSeverity(checks: CheckResult[]): Severity {
  let best: Severity = "info";
  for (const check of checks) {
    for (const finding of check.findings) {
      if ((SEVERITY_META[finding.severity]?.rank ?? 0) > SEVERITY_META[best].rank) {
        best = finding.severity;
      }
    }
  }
  return best;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function evidenceEntries(evidence: Record<string, unknown>): [string, unknown][] {
  return Object.entries(evidence).filter(
    ([key]) => !["findings", "headers"].includes(key) && evidence[key] !== null,
  );
}

export function compactValue(value: unknown, max = 160): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return truncate(value, max);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "none";
    const items = value.map((item) => compactValue(item, 40));
    return truncate(items.join(", "), max);
  }
  if (isRecord(value)) {
    const items = Object.entries(value).map(([key, val]) => `${key}: ${compactValue(val, 50)}`);
    return truncate(items.join(" · "), max);
  }
  return truncate(String(value), max);
}

export function initiatorInitials(name: string | null, email: string | null): string {
  const source = name?.trim() || email?.trim() || "Demo";
  return source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
