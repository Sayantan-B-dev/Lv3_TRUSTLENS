"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import type { CheckCatalogEntry, CheckResult, InvestigationDetail } from "@/lib/types";
import { IconAlert, IconCheck, IconClock, IconSpinner } from "./icons";

interface Props {
  detail: InvestigationDetail;
  catalog: Record<string, CheckCatalogEntry> | null;
}

const DEFAULT_ORDER = [
  "message.heuristics",
  "url.structure",
  "domain.heuristics",
  "dns",
  "redirects",
  "threat_intel",
  "tls",
  "headers",
  "ct",
  "correlation",
  "ai",
];

const FALLBACK_LABELS: Record<string, string> = {
  "message.heuristics": "Message patterns",
  "url.structure": "URL structure",
  "domain.heuristics": "Domain heuristics",
  dns: "DNS records",
  redirects: "Redirect chain",
  threat_intel: "Threat intelligence",
  tls: "TLS & certificate",
  headers: "Website security",
  ct: "Certificate transparency",
  correlation: "IOC correlation",
  ai: "Evidence explanation",
};

function baseId(checkId: string): string {
  return checkId.split(":")[0];
}

function statusFor(checks: CheckResult[], key: string): CheckResult | undefined {
  return checks.find((check) => baseId(check.check_id) === key);
}

export default function ScanState({ detail, catalog }: Props) {
  const sweepRef = useRef<SVGGElement | null>(null);
  const [seconds, setSeconds] = useState(0);
  const startedAt = detail.started_at ?? detail.created_at;

  useEffect(() => {
    const started = new Date(startedAt).getTime();
    const update = () => setSeconds(Math.max(0, Math.round((Date.now() - started) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [startedAt]);

  useEffect(() => {
    if (!sweepRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const animation = animate(sweepRef.current, {
      rotate: [0, 360],
      duration: 2800,
      ease: "linear",
      loop: true,
    });
    return () => {
      animation.pause();
    };
  }, []);

  const requested = (detail.checks_requested.length
    ? detail.checks_requested
    : DEFAULT_ORDER
  ).filter((key) => key !== "ai" || detail.checks_requested.includes("ai"));
  const ordered = [
    ...(detail.input_type === "message" ? ["message.heuristics"] : []),
    ...DEFAULT_ORDER.filter((key) => key !== "message.heuristics" && requested.includes(key)),
  ];
  const unique = [...new Set(ordered)];

  return (
    <section className="panel overflow-hidden">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Live investigation</p>
          <h2 className="mt-1 text-[15px] font-medium text-ink">
            {detail.status === "queued" ? "Queued for a safe passive sweep" : "Collecting evidence"}
          </h2>
        </div>
        <span className="chip border-accent/25 bg-accent/[0.06] text-accent">
          <IconSpinner size={11} />
          {detail.status}
        </span>
      </div>

      <div className="grid gap-6 px-5 py-6 sm:grid-cols-[220px_minmax(0,1fr)] sm:px-6">
        <div className="mx-auto flex w-[200px] flex-col items-center">
          <svg viewBox="0 0 220 220" className="h-[200px] w-[200px]" role="img" aria-label="Passive investigation in progress">
            <defs>
              <linearGradient id="sweepGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#4fd1c5" stopOpacity="0.42" />
                <stop offset="100%" stopColor="#4fd1c5" stopOpacity="0" />
              </linearGradient>
            </defs>
            <circle cx="110" cy="110" r="86" fill="none" stroke="#1a2735" />
            <circle cx="110" cy="110" r="64" fill="none" stroke="#1a2735" />
            <circle cx="110" cy="110" r="42" fill="none" stroke="#1a2735" />
            <circle cx="110" cy="110" r="86" fill="none" stroke="#4fd1c5" strokeOpacity="0.16" strokeDasharray="2 10" />
            <path d="M110 16v14M110 190v14M16 110h14M190 110h14" stroke="#293b4e" strokeLinecap="round" />
            <circle cx="110" cy="110" r="3" fill="#4fd1c5" />
            <g ref={sweepRef} className="scan-ring">
              <path d="M110 110 L110 24 A86 86 0 0 1 172 48 Z" fill="url(#sweepGradient)" />
              <path d="M110 110 L110 24" stroke="#4fd1c5" strokeWidth="1.4" strokeLinecap="round" />
            </g>
          </svg>
          <div className="mt-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
            <IconClock size={12} />
            {seconds}s elapsed
          </div>
        </div>

        <div className="min-w-0">
          <div className="rounded-lg border border-line bg-raised/50 px-3.5 py-2.5">
            <p className="eyebrow">Target</p>
            <p className="mt-1 truncate text-[13px] text-ink">{detail.display_value}</p>
          </div>

          <ul className="mt-3 grid gap-1 sm:grid-cols-2" aria-live="polite">
            {unique.map((key) => {
              const check = statusFor(detail.checks, key);
              const label = catalog?.[key]?.label ?? FALLBACK_LABELS[key] ?? key;
              const status = check?.status ?? "not_run";
              const failed = status === "unavailable" || status === "error";
              return (
                <li key={key} className="flex items-center gap-2 py-1 text-[12px]">
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                      status === "completed"
                        ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                        : failed
                          ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
                          : "border-line text-faint"
                    }`}
                  >
                    {status === "completed" ? (
                      <IconCheck size={10} />
                    ) : failed ? (
                      <IconAlert size={10} />
                    ) : (
                      <span className={`h-1.5 w-1.5 rounded-full ${detail.status === "running" ? "status-dot bg-accent" : "bg-line-strong"}`} />
                    )}
                  </span>
                  <span className={status === "completed" ? "text-muted" : "text-faint"}>{label}</span>
                  {failed && <span className="ml-auto font-mono text-[9px] uppercase text-amber-300/80">{status}</span>}
                </li>
              );
            })}
          </ul>

          <p className="mt-4 text-[11px] leading-relaxed text-faint">
            Checks are passive. TrustLens never opens the target in your browser, executes scripts
            or submits forms. Evidence appears here as each check completes.
          </p>
        </div>
      </div>
    </section>
  );
}
