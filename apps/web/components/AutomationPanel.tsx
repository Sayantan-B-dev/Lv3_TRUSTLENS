"use client";

import type {
  AutomationSettings,
  CheckCatalogEntry,
  InvestigationMode,
  RiskClass,
} from "@/lib/types";
import { RISK_META } from "@/lib/format";
import { IconInfo, IconPause, IconPlay } from "./icons";

interface Props {
  settings: AutomationSettings;
  catalog: Record<string, CheckCatalogEntry> | null;
  busy: boolean;
  onModeChange: (mode: InvestigationMode) => void;
  onTogglePause: () => void;
  onToggleModule: (key: string, enabled: boolean) => void;
}

const ORDER = [
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

const RISK_ORDER: RiskClass[] = [
  "Low Risk",
  "Suspicious",
  "High Risk",
  "Confirmed Malicious",
  "Inconclusive",
];

export default function AutomationPanel({
  settings,
  catalog,
  busy,
  onModeChange,
  onTogglePause,
  onToggleModule,
}: Props) {
  const entries = catalog ? Object.entries(catalog) : [];
  const ordered = ORDER.map((key) => [key, catalog?.[key]] as const).filter(
    ([key]) => !catalog || key in catalog,
  );
  const extra = entries.filter(([key]) => !ORDER.includes(key));

  return (
    <section className="panel overflow-hidden" aria-labelledby="automation-title">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Automation</p>
          <h2 id="automation-title" className="mt-1 text-[14px] font-medium text-ink">
            Investigation controls
          </h2>
        </div>
        <span
          className={`chip ${
            settings.paused
              ? "border-amber-400/30 text-amber-300"
              : "border-emerald-400/25 text-emerald-300"
          }`}
        >
          {settings.paused ? "paused" : "live"}
        </span>
      </div>

      <div className="px-4 py-4">
        <div className="segmented w-full" role="group" aria-label="Automation mode">
          {(["automatic", "manual"] as InvestigationMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              data-active={settings.mode === mode}
              className="segment flex-1 py-1.5 text-center"
              onClick={() => onModeChange(mode)}
              disabled={busy}
            >
              {mode}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[10.5px] leading-relaxed text-faint">
          {settings.mode === "automatic"
            ? "New submissions queue all enabled safe passive checks immediately."
            : "New submissions are saved; you decide when checks run."}
        </p>

        <button
          type="button"
          onClick={onTogglePause}
          disabled={busy}
          role="switch"
          aria-checked={settings.paused}
          className={`mt-3 flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
            settings.paused
              ? "border-amber-400/30 bg-amber-400/[0.06]"
              : "border-line bg-raised/40 hover:border-line-strong"
          }`}
        >
          <span className="flex items-center gap-2 text-[12px] text-ink">
            {settings.paused ? <IconPlay size={14} /> : <IconPause size={14} />}
            {settings.paused ? "Resume automation" : "Pause automation"}
          </span>
          <span
            className={`flex h-4 w-7 items-center rounded-full p-0.5 transition-colors ${
              settings.paused ? "bg-amber-400/80" : "bg-line-strong"
            }`}
          >
            <span
              className={`h-3 w-3 rounded-full bg-canvas transition-transform ${
                settings.paused ? "translate-x-3" : "translate-x-0"
              }`}
            />
          </span>
        </button>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Checks</p>
            <span className="font-mono text-[9px] text-faint">
              {Object.values(settings.modules).filter(Boolean).length}/{Object.keys(settings.modules).length}
            </span>
          </div>
          <ul className="mt-2 space-y-0.5">
            {[...ordered, ...extra].map(([key, entry]) => {
              const enabled = settings.modules[key] !== false;
              return (
                <li key={key}>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    disabled={busy}
                    onClick={() => onToggleModule(key, !enabled)}
                    className="group flex w-full items-start gap-2.5 rounded-lg px-1.5 py-1.5 text-left transition-colors hover:bg-raised/60"
                  >
                    <span
                      className={`mt-0.5 flex h-3.5 w-6 shrink-0 items-center rounded-full p-0.5 transition-colors ${
                        enabled ? "bg-accent/75" : "bg-line-strong"
                      }`}
                    >
                      <span
                        className={`h-2.5 w-2.5 rounded-full bg-canvas transition-transform ${
                          enabled ? "translate-x-2.5" : "translate-x-0"
                        }`}
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-[11.5px] ${enabled ? "text-muted" : "text-faint line-through"}`}>
                        {entry?.label ?? key}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="mt-3 flex gap-1.5 rounded-lg border border-line/70 bg-raised/30 px-2.5 py-2 text-[10px] leading-relaxed text-faint">
          <IconInfo size={11} className="mt-0.5 shrink-0" />
          {settings.note}
        </p>

        <details className="mt-4 border-t border-line pt-3">
          <summary className="flex cursor-pointer items-center justify-between text-[11px] text-muted">
            Risk classification legend
            <span className="font-mono text-[9px] text-faint">5 classes</span>
          </summary>
          <ul className="mt-2 space-y-2">
            {RISK_ORDER.map((risk) => {
              const meta = RISK_META[risk];
              return (
                <li key={risk} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: meta.hex }} />
                  <div>
                    <p className={`text-[11px] ${meta.text}`}>{risk}</p>
                    <p className="text-[10px] leading-relaxed text-faint">{meta.description}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </details>
      </div>
    </section>
  );
}
