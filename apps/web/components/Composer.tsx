"use client";

import { useState } from "react";
import type {
  CheckCatalogEntry,
  InputType,
  InvestigationMode,
} from "@/lib/types";
import { IconArrow, IconChevron, IconLink, IconLock, IconMessage, IconScan } from "./icons";

interface Props {
  tab: InputType;
  onTabChange: (tab: InputType) => void;
  value: string;
  onValueChange: (value: string) => void;
  mode: InvestigationMode;
  onModeChange: (mode: InvestigationMode) => void;
  paused: boolean;
  modules: Record<string, boolean>;
  catalog: Record<string, CheckCatalogEntry> | null;
  onSubmit: () => void;
  onToggleModule: (key: string, enabled: boolean) => void;
  submitting: boolean;
}

const SAMPLES = [
  {
    label: "Benign site",
    kind: "url" as const,
    value: "https://example.com",
  },
  {
    label: "Lookalike domain",
    kind: "url" as const,
    value: "https://paypal-secure-login.example/verify/account",
  },
  {
    label: "Scam message",
    kind: "message" as const,
    value:
      "URGENT: Your bank account is suspended. Verify your identity within 24 hours and share the OTP sent to your phone, or pay the Rs 499 processing fee via gift card. Support team: support@bank-secure.example. Do not tell anyone.",
  },
];

const FALLBACK_CHECKS: Record<string, CheckCatalogEntry> = {
  "url.structure": { label: "URL structure", category: "url", description: "Normalise and inspect." },
  "domain.heuristics": { label: "Domain heuristics", category: "domain", description: "Lookalike analysis." },
  dns: { label: "DNS records", category: "dns", description: "Public DNS metadata." },
  redirects: { label: "Redirect chain", category: "web", description: "Safe redirect analysis." },
  threat_intel: { label: "Threat intelligence", category: "intel", description: "URLhaus reputation." },
  tls: { label: "TLS & certificate", category: "tls", description: "Chain and trust analysis." },
  headers: { label: "Website security", category: "web", description: "Passive headers." },
  ct: { label: "Certificate Transparency", category: "tls", description: "crt.sh records." },
  correlation: { label: "IOC correlation", category: "correlation", description: "Prior indicators." },
  ai: { label: "Explanation", category: "ai", description: "Evidence-grounded explanation." },
};

const MODULE_ORDER = [
  "url.structure",
  "domain.heuristics",
  "dns",
  "redirects",
  "tls",
  "headers",
  "threat_intel",
  "ct",
  "correlation",
  "ai",
];

export default function Composer({
  tab,
  onTabChange,
  value,
  onValueChange,
  mode,
  onModeChange,
  paused,
  modules,
  catalog,
  onSubmit,
  onToggleModule,
  submitting,
}: Props) {
  const [advanced, setAdvanced] = useState(false);
  const catalogue = catalog ?? FALLBACK_CHECKS;
  const enabledCount = MODULE_ORDER.filter((key) => modules[key] !== false).length;
  const charLimit = 20000;
  const tooLong = value.length > charLimit;

  return (
    <section className="panel overflow-hidden" aria-labelledby="composer-title">
      <div className="relative px-5 pb-5 pt-6 sm:px-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Investigation console</p>
            <h1 id="composer-title" className="mt-2 text-[26px] font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-[30px]">
              Look closer before you trust.
            </h1>
            <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-muted">
              Inspect a link, domain or message. TrustLens gathers passive evidence, explains
              what it found, and keeps the risk decision deterministic.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-line bg-raised px-2.5 py-1.5">
            <IconScan size={14} className="text-accent" />
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
              passive only
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="segmented" role="tablist" aria-label="Input type">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "url"}
              data-active={tab === "url"}
              className="segment flex items-center gap-1.5"
              onClick={() => onTabChange("url")}
            >
              <IconLink size={12} /> Link
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "message"}
              data-active={tab === "message"}
              className="segment flex items-center gap-1.5"
              onClick={() => onTabChange("message")}
            >
              <IconMessage size={12} /> Message
            </button>
          </div>

          <div className="segmented" role="group" aria-label="Investigation mode">
            {(["automatic", "manual"] as InvestigationMode[]).map((option) => (
              <button
                key={option}
                type="button"
                data-active={mode === option}
                className="segment"
                onClick={() => onModeChange(option)}
                title={
                  option === "automatic"
                    ? "Queue all enabled passive checks immediately on submit."
                    : "Save the submission and run checks only when you press Run."
                }
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <form
          className="mt-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!submitting && value.trim() && !tooLong) onSubmit();
          }}
        >
          <div className="relative">
            {tab === "url" ? (
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint">
                  <IconSearchIcon />
                </span>
                <input
                  aria-label="URL or domain to investigate"
                  className="field pl-11 pr-4"
                  placeholder="https://suspicious-login.example/verify"
                  value={value}
                  onChange={(event) => onValueChange(event.target.value)}
                  spellCheck={false}
                  autoComplete="off"
                  inputMode="url"
                />
              </div>
            ) : (
              <textarea
                aria-label="Message or email to analyse"
                className="field min-h-[132px] resize-y leading-relaxed"
                placeholder="Paste the suspicious email, SMS or chat message. Do not paste passwords, OTPs or private keys."
                value={value}
                onChange={(event) => onValueChange(event.target.value)}
                onKeyDown={(event) => {
                  if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && value.trim()) {
                    event.preventDefault();
                    onSubmit();
                  }
                }}
                spellCheck={false}
              />
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-faint">Samples</span>
              {SAMPLES.map((sample) => (
                <button
                  key={sample.label}
                  type="button"
                  onClick={() => {
                    onTabChange(sample.kind);
                    onValueChange(sample.value);
                  }}
                  className="rounded-full border border-line px-2.5 py-1 text-[11px] text-muted transition-colors hover:border-line-strong hover:text-ink"
                >
                  {sample.label}
                </button>
              ))}
            </div>
            <span className="mono text-[11px] text-faint">
              {value.length.toLocaleString()}/{charLimit.toLocaleString()}
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-faint">
              <span className="inline-flex items-center gap-1.5">
                <IconLock size={12} />
                Never paste passwords, OTPs or seed phrases.
              </span>
              <span className="hidden h-3 w-px bg-line sm:block" />
              <span>
                {paused
                  ? "Automation is paused — submissions are saved for a manual run."
                  : mode === "automatic"
                    ? "Automatic: safe passive checks start on submit."
                    : "Manual: checks start only when you press Run."}
              </span>
            </div>
            <button
              type="submit"
              className="btn btn-primary min-w-[148px]"
              disabled={submitting || !value.trim() || tooLong}
            >
              {submitting ? (
                "Queueing…"
              ) : (
                <>
                  {mode === "manual" && !paused ? "Save & review" : "Investigate"}
                  <IconArrow size={15} />
                </>
              )}
            </button>
          </div>
          {tooLong && (
            <p className="mt-2 text-[11px] text-red-300">
              Input exceeds the {charLimit.toLocaleString()} character limit.
            </p>
          )}
        </form>
      </div>

      <div className="border-t border-line bg-raised/35 px-5 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => setAdvanced((open) => !open)}
          aria-expanded={advanced}
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <span className="flex items-center gap-2">
            <span className="eyebrow">Checks</span>
            <span className="text-[11px] text-muted">
              {enabledCount} of {MODULE_ORDER.length} enabled
            </span>
            <span className="flex flex-wrap gap-1">
              {MODULE_ORDER.filter((key) => modules[key] !== false)
                .slice(0, 4)
                .map((key) => (
                  <span key={key} className="chip border-line/70 px-2 py-0.5 text-[9px] text-faint">
                    {catalogue[key]?.label ?? key}
                  </span>
                ))}
              {enabledCount > 4 && (
                <span className="chip border-line/70 px-2 py-0.5 text-[9px] text-faint">
                  +{enabledCount - 4}
                </span>
              )}
            </span>
          </span>
          <IconChevron
            size={14}
            className={`text-faint transition-transform ${advanced ? "rotate-180" : ""}`}
          />
        </button>

        {advanced && (
          <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {MODULE_ORDER.map((key) => {
              const enabled = modules[key] !== false;
              const entry = catalogue[key];
              return (
                <button
                  key={key}
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  onClick={() => onToggleModule(key, !enabled)}
                  className="flex items-start gap-2.5 rounded-lg border border-transparent px-2 py-1.5 text-left transition-colors hover:border-line hover:bg-elevated/60"
                >
                  <span
                    className={`mt-0.5 flex h-3.5 w-6 shrink-0 items-center rounded-full p-0.5 transition-colors ${
                      enabled ? "bg-accent/80" : "bg-line-strong"
                    }`}
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full bg-canvas transition-transform ${
                        enabled ? "translate-x-2.5" : "translate-x-0"
                      }`}
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[12px] text-ink">{entry?.label ?? key}</span>
                    <span className="block truncate text-[10.5px] text-faint">{entry?.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function IconSearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" strokeLinecap="round" />
    </svg>
  );
}
