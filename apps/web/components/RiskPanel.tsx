"use client";

import { useEffect, useRef } from "react";
import { animate } from "animejs";
import type { InvestigationDetail, RiskClass } from "@/lib/types";
import { RISK_META, formatPct, formatScore } from "@/lib/format";
import {
  IconDownload,
  IconPlay,
  IconShield,
  IconSpark,
  IconTrash,
} from "./icons";

interface Props {
  detail: InvestigationDetail;
  onExport: () => void;
  onRun: () => void;
  onDelete: () => void;
  onGenerateReport: () => void;
  actionBusy: string | null;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export default function RiskPanel({ detail, onExport, onRun, onDelete, onGenerateReport, actionBusy }: Props) {
  const summaryRef = useRef<HTMLDivElement | null>(null);
  const riskCheck = detail.checks.find((check) => check.check_id === "risk.assessment");
  const actions = asStringArray(riskCheck?.evidence?.recommended_actions);
  const risk = (detail.risk_classification ?? "Inconclusive") as RiskClass;
  const meta = RISK_META[risk];
  const score = Math.max(0, Math.min(100, detail.score));
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  const canReport = detail.status === "completed";
  const isDraft = detail.status === "draft" || detail.status === "failed";

  useEffect(() => {
    if (!summaryRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const animation = animate(summaryRef.current, {
      opacity: [0, 1],
      translateY: [7, 0],
      duration: 480,
      ease: "outQuad",
    });
    return () => {
      animation.pause();
    };
  }, [detail.id]);

  return (
    <section className={`panel overflow-hidden border ${meta.border}`}>
      <div className={`relative px-5 py-5 sm:px-6 ${meta.surface}`}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="eyebrow">Deterministic assessment</p>
            <div className="mt-2 flex flex-wrap items-center gap-2.5">
              <span className={`h-2 w-2 rounded-full`} style={{ backgroundColor: meta.hex }} />
              <h2 className={`text-[24px] font-semibold tracking-[-0.02em] ${meta.text}`}>{meta.label}</h2>
              <span className="chip border-line/80 text-faint">ruleset {detail.ruleset_version}</span>
            </div>
            <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-muted">{meta.description}</p>
          </div>

          <div className="flex shrink-0 items-center gap-4">
            <div className="relative h-[104px] w-[104px]">
              <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                <circle cx="60" cy="60" r={radius} fill="none" stroke="#1a2735" strokeWidth="7" />
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke={meta.hex}
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  style={{ transition: "stroke-dashoffset 950ms cubic-bezier(.16,1,.3,1)" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="mono text-[22px] font-semibold leading-none text-ink">{score}</span>
                <span className="mt-1 font-mono text-[8px] uppercase tracking-[0.14em] text-faint">
                  risk score
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <Stat label="Confidence" value={formatPct(detail.confidence)} />
          <Stat label="Coverage" value={formatPct(detail.coverage)} />
          <Stat label="Checks" value={`${detail.checks_completed}/${detail.checks_total}`} />
        </div>
      </div>

      <div ref={summaryRef} className="px-5 py-5 sm:px-6">
        <p className="text-[13px] leading-relaxed text-ink/90">{detail.summary ?? "No summary yet."}</p>
        {detail.score > 0 && (
          <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
            weighted score {formatScore(detail.score)} · AI does not set this classification
          </p>
        )}

        {actions.length > 0 && (
          <div className="mt-4 rounded-xl border border-line bg-raised/55 p-3.5">
            <p className="eyebrow">Recommended next actions</p>
            <ul className="mt-2.5 space-y-1.5">
              {actions.slice(0, 5).map((action) => (
                <li key={action} className="flex gap-2 text-[12px] leading-relaxed text-muted">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-accent/80" />
                  {action}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {isDraft && (
            <button type="button" onClick={onRun} className="btn btn-primary" disabled={actionBusy !== null}>
              <IconPlay size={14} />
              {actionBusy === "run" ? "Queueing…" : "Run enabled checks"}
            </button>
          )}
          {canReport && (
            <button
              type="button"
              onClick={onGenerateReport}
              className="btn btn-ghost"
              disabled={actionBusy !== null}
            >
              <IconSpark size={14} />
              {detail.reports.length ? "New report version" : "Create integrity report"}
            </button>
          )}
          <button type="button" onClick={onExport} className="btn btn-ghost">
            <IconDownload size={14} />
            Export JSON
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="btn btn-quiet ml-auto px-2 text-[12px] text-faint hover:text-red-300"
            disabled={actionBusy !== null}
          >
            <IconTrash size={13} />
            Delete
          </button>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-lg border border-line/80 px-3 py-2.5 text-[11px] leading-relaxed text-faint">
          <IconShield size={13} className="mt-0.5 shrink-0 text-accent/70" />
          <span>
            A clean result is not proof of safety. TrustLens runs passive checks only and reports the
            coverage it actually achieved.
          </span>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line/70 bg-canvas/30 px-3 py-2">
      <p className="font-mono text-[9px] uppercase tracking-[0.13em] text-faint">{label}</p>
      <p className="mono mt-1 text-[15px] font-medium text-ink">{value}</p>
    </div>
  );
}
