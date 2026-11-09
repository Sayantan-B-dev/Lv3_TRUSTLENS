"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { animate, stagger } from "animejs";
import type { AIExplanation, CheckResult, Severity } from "@/lib/types";
import {
  CATEGORY_LABELS,
  SEVERITY_META,
  STATUS_META,
  compactValue,
  evidenceEntries,
  formatDuration,
  groupChecks,
  highestSeverity,
  isRecord,
  truncate,
} from "@/lib/format";
import {
  IconAlert,
  IconCheck,
  IconChevron,
  IconInfo,
  IconSpark,
} from "./icons";

interface Props {
  investigationId: string;
  checks: CheckResult[];
  explanation: AIExplanation | null;
  onFeedback: (kind: string) => void;
  feedbackBusy: boolean;
}

type Filter = "all" | "findings" | "issues";

const CATEGORY_TAG: Record<string, string> = {
  url: "observed",
  dns: "observed",
  web: "observed",
  tls: "observed",
  intel: "source",
  domain: "heuristic",
  message: "heuristic",
  correlation: "observed",
};

export default function Evidence({
  investigationId,
  checks,
  explanation,
  onFeedback,
  feedbackBusy,
}: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [raw, setRaw] = useState<Set<string>>(new Set());
  const [feedbackGiven, setFeedbackGiven] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const initialised = useRef(false);

  const visible = useMemo(
    () =>
      checks.filter(
        (check) =>
          check.category !== "risk" &&
          check.check_id !== "ai.explanation" &&
          (filter === "all"
            ? true
            : filter === "findings"
              ? check.findings.length > 0
              : check.status === "unavailable" || check.status === "error"),
      ),
    [checks, filter],
  );
  const groups = useMemo(() => groupChecks(visible), [visible]);

  useEffect(() => {
    setFeedbackGiven(null);
    initialised.current = false;
    setOpen(new Set());
  }, [investigationId]);

  useEffect(() => {
    if (initialised.current) return;
    const first = checks.find((check) => check.findings.length > 0);
    if (first) {
      setOpen(new Set([first.check_id]));
    }
    initialised.current = true;
  }, [checks]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rows = Array.from(root.querySelectorAll<HTMLElement>(".reveal"));
    if (rows.length === 0) return;
    const animation = animate(rows, {
      opacity: [0, 1],
      translateY: [6, 0],
      duration: 380,
      delay: stagger(38),
      ease: "outQuad",
    });
    return () => {
      animation.pause();
    };
  }, [filter, groups.length]);

  const toggle = (id: string) => {
    setOpen((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleRaw = (id: string) => {
    setRaw((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const aiMode = explanation?.mode ?? "deterministic-fallback";
  const aiLabel =
    aiMode === "deterministic-fallback"
      ? "Rules-only explanation"
      : aiMode === "mock"
        ? "Mock explanation"
        : "AI interpretation";

  return (
    <section className="panel overflow-hidden" aria-labelledby="evidence-title">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Evidence</p>
          <h2 id="evidence-title" className="mt-1 text-[14px] font-medium text-ink">
            What the checks observed
          </h2>
        </div>
        <div className="segmented" role="group" aria-label="Evidence filter">
          {(["all", "findings", "issues"] as Filter[]).map((option) => (
            <button
              key={option}
              type="button"
              data-active={filter === option}
              className="segment"
              onClick={() => setFilter(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div ref={containerRef}>
        {explanation && (
          <div className="border-b border-line bg-gradient-to-b from-accent/[0.035] to-transparent px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-center gap-2">
              <IconSpark size={14} className="text-accent" />
              <p className="eyebrow !text-accent/80">Interpretation</p>
              <span className="chip border-accent/20 bg-accent/[0.06] text-accent/90">{aiLabel}</span>
              {explanation.model && explanation.model !== "rules-only" && (
                <span className="font-mono text-[9.5px] text-faint">{explanation.model}</span>
              )}
            </div>
            <p className="mt-2.5 text-[13px] leading-relaxed text-ink/90">{explanation.summary}</p>

            {explanation.why?.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {explanation.why.map((claim, index) => (
                  <li key={`${claim.claim}-${index}`} className="flex gap-2 text-[12px] leading-relaxed text-muted">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-accent/70" />
                    <span>
                      {claim.claim}
                      <span className="ml-1.5 inline-flex flex-wrap gap-1">
                        {claim.evidence_ids.map((id) => (
                          <span key={id} className="rounded border border-line px-1 py-0.5 font-mono text-[8.5px] text-faint">
                            {id}
                          </span>
                        ))}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {explanation.next_steps?.length > 0 && (
              <div className="mt-3 rounded-lg border border-line bg-raised/50 px-3 py-2.5">
                <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-faint">Suggested actions</p>
                <ul className="mt-1.5 space-y-1">
                  {explanation.next_steps.map((step) => (
                    <li key={step} className="text-[11.5px] leading-relaxed text-muted">
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="mt-2.5 text-[10.5px] leading-relaxed text-faint">
              {explanation.note ??
                "AI interpretation of deterministic evidence. The final risk classification is set by the rules engine."}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[10.5px] text-faint">
                {feedbackGiven ? "Feedback recorded." : "Was this assessment useful?"}
              </span>
              {[
                ["helpful", "Helpful"],
                ["false_positive", "False positive"],
                ["missed_threat", "Missed threat"],
              ].map(([kind, label]) => (
                <button
                  key={kind}
                  type="button"
                  disabled={feedbackBusy || feedbackGiven !== null}
                  onClick={() => {
                    setFeedbackGiven(kind);
                    onFeedback(kind);
                  }}
                  className={`rounded-full border px-2 py-0.5 text-[10px] transition-colors disabled:opacity-50 ${
                    feedbackGiven === kind
                      ? "border-accent/40 bg-accent/10 text-accent"
                      : "border-line text-faint hover:border-line-strong hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {groups.length === 0 ? (
          <div className="px-5 py-8 text-center text-[12px] text-faint">
            No checks match this filter. Try “all” to see every observed check.
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.category}>
              <div className="flex items-center justify-between border-t border-line/60 bg-raised/25 px-5 py-2 first:border-t-0 sm:px-6">
                <span className="font-mono text-[9.5px] uppercase tracking-[0.13em] text-faint">
                  {CATEGORY_LABELS[group.category] ?? group.category}
                </span>
                <span className="font-mono text-[9px] text-faint">
                  {group.checks.length} check{group.checks.length === 1 ? "" : "s"}
                </span>
              </div>

              {group.checks.map((check) => {
                const expanded = open.has(check.check_id);
                const severity = highestSeverity([check]) as Severity;
                const severityMeta = SEVERITY_META[severity];
                const status = STATUS_META[check.status] ?? STATUS_META.not_run;
                const matches = Array.isArray(check.evidence.matches)
                  ? check.evidence.matches.filter(isRecord)
                  : [];
                return (
                  <article key={check.check_id} className="evidence-row reveal">
                    <button
                      type="button"
                      onClick={() => toggle(check.check_id)}
                      aria-expanded={expanded}
                      className="flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-raised/40 sm:px-6"
                    >
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: severityMeta.hex }}
                        title={`${severityMeta.label} severity`}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-[12.5px] font-medium text-ink">{check.title}</span>
                          {check.findings.length > 0 && (
                            <span className="rounded bg-elevated px-1.5 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.08em] text-muted">
                              {check.findings.length} finding{check.findings.length === 1 ? "" : "s"}
                            </span>
                          )}
                          {CATEGORY_TAG[check.category] && (
                            <span className="font-mono text-[8.5px] uppercase tracking-[0.08em] text-faint">
                              {CATEGORY_TAG[check.category]}
                            </span>
                          )}
                        </span>
                        <span className="mt-1 block truncate text-[11.5px] text-muted">
                          {truncate(check.summary || "No summary recorded.", 150)}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2 pt-0.5">
                        <span className={`hidden font-mono text-[9px] uppercase tracking-[0.08em] sm:inline ${status.className}`}>
                          {status.label}
                        </span>
                        <IconChevron
                          size={14}
                          className={`text-faint transition-transform ${expanded ? "rotate-180" : ""}`}
                        />
                      </span>
                    </button>

                    {expanded && (
                      <div className="px-5 pb-4 sm:px-6">
                        <div className="rounded-xl border border-line/80 bg-canvas/35 p-3.5">
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[9px] uppercase tracking-[0.08em] text-faint">
                            <span>{check.status}</span>
                            <span>{check.source}</span>
                            <span>{formatDuration(check.duration_ms)}</span>
                            {check.source_timestamp && <span>{check.source_timestamp.slice(0, 19)}Z</span>}
                          </div>

                          {check.findings.length > 0 && (
                            <div className="mt-3 space-y-3">
                              {check.findings.map((finding) => (
                                <div key={`${check.check_id}-${finding.rule_id}`} className="rounded-lg border border-line/70 bg-raised/40 p-3">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span
                                      className="rounded px-1.5 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.08em]"
                                      style={{
                                        color: SEVERITY_META[finding.severity]?.hex ?? "#94a3b8",
                                        backgroundColor: `${SEVERITY_META[finding.severity]?.hex ?? "#94a3b8"}14`,
                                      }}
                                    >
                                      {finding.severity}
                                    </span>
                                    <span className="text-[12px] font-medium text-ink">{finding.title}</span>
                                    {finding.authoritative && (
                                      <span className="rounded border border-red-400/30 px-1.5 py-0.5 font-mono text-[8px] uppercase text-red-300">
                                        authoritative
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">{finding.summary}</p>
                                  {(finding.impact || finding.remediation) && (
                                    <dl className="mt-2 space-y-1.5 text-[11px] leading-relaxed">
                                      {finding.impact && (
                                        <div className="flex gap-2">
                                          <dt className="w-16 shrink-0 font-mono text-[8.5px] uppercase tracking-[0.08em] text-faint">impact</dt>
                                          <dd className="text-muted">{finding.impact}</dd>
                                        </div>
                                      )}
                                      {finding.remediation && (
                                        <div className="flex gap-2">
                                          <dt className="w-16 shrink-0 font-mono text-[8.5px] uppercase tracking-[0.08em] text-faint">action</dt>
                                          <dd className="text-accent/80">{finding.remediation}</dd>
                                        </div>
                                      )}
                                    </dl>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {matches.length > 0 && (
                            <div className="mt-3">
                              <p className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-faint">
                                Correlated indicators
                              </p>
                              <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {matches.slice(0, 12).map((match, index) => (
                                  <span key={index} className="chip border-line/70 py-0.5 text-[9px] normal-case tracking-normal">
                                    <span className="font-mono text-faint">{String(match.type)}</span>
                                    <span className="max-w-[180px] truncate text-muted">{String(match.value)}</span>
                                    <span className="text-accent/80">×{String(match.investigations)}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {evidenceEntries(check.evidence).length > 0 && (
                            <dl className="mt-3 grid gap-x-4 gap-y-1.5 border-t border-line/60 pt-3 sm:grid-cols-2">
                              {evidenceEntries(check.evidence)
                                .slice(0, 14)
                                .map(([key, value]) => (
                                  <div key={key} className="flex min-w-0 gap-2 text-[10.5px] leading-relaxed">
                                    <dt className="w-[104px] shrink-0 truncate font-mono text-[9px] uppercase tracking-[0.06em] text-faint">
                                      {key.replaceAll("_", " ")}
                                    </dt>
                                    <dd className="min-w-0 break-words text-muted">{compactValue(value, 180)}</dd>
                                  </div>
                                ))}
                            </dl>
                          )}

                          {check.limitations.length > 0 && (
                            <div className="mt-3 flex gap-2 border-t border-line/60 pt-3">
                              <IconInfo size={12} className="mt-0.5 shrink-0 text-faint" />
                              <ul className="space-y-1 text-[10.5px] leading-relaxed text-faint">
                                {check.limitations.slice(0, 4).map((limitation) => (
                                  <li key={limitation}>{limitation}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => toggleRaw(check.check_id)}
                            className="mt-3 font-mono text-[9px] uppercase tracking-[0.1em] text-faint transition-colors hover:text-muted"
                            aria-expanded={raw.has(check.check_id)}
                          >
                            {raw.has(check.check_id) ? "Hide raw evidence" : "View raw evidence"}
                          </button>
                          {raw.has(check.check_id) && (
                            <pre className="mt-2 max-h-[320px] overflow-auto rounded-lg border border-line bg-canvas p-3 font-mono text-[10px] leading-relaxed text-muted">
                              {JSON.stringify(check.evidence, null, 2).slice(0, 14000)}
                            </pre>
                          )}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ))
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-5 py-3 text-[10px] text-faint sm:px-6">
        <span className="inline-flex items-center gap-1.5">
          <IconCheck size={11} className="text-emerald-300/70" /> observed
        </span>
        <span className="inline-flex items-center gap-1.5">
          <IconAlert size={11} className="text-amber-300/70" /> unavailable is not clean
        </span>
        <span className="inline-flex items-center gap-1.5">
          <IconSpark size={11} className="text-accent/70" /> interpretation is separated from evidence
        </span>
      </div>
    </section>
  );
}
