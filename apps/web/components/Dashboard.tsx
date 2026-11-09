"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  AIExplanation,
  AutomationSettings,
  InvestigationDetail,
  InvestigationMode,
  InvestigationSummary,
  Me,
  MetaInfo,
  SystemStatus,
  Toast,
  VerificationResult,
} from "@/lib/types";
import { api, ApiError } from "@/lib/api";
import Header from "./Header";
import Composer from "./Composer";
import ScanState from "./ScanState";
import RiskPanel from "./RiskPanel";
import Evidence from "./Evidence";
import ReportPanel from "./ReportPanel";
import History from "./History";
import AutomationPanel from "./AutomationPanel";
import SystemPanel from "./SystemPanel";
import {
  IconAlert,
  IconCheck,
  IconInfo,
  IconRefresh,
  IconShield,
  IconSpark,
  IconX,
  Logo,
} from "./icons";

function describeError(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export default function Dashboard() {
  const [booting, setBooting] = useState(true);
  const [bootError, setBootError] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [meta, setMeta] = useState<MetaInfo | null>(null);
  const [automation, setAutomation] = useState<AutomationSettings | null>(null);
  const [history, setHistory] = useState<InvestigationSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<InvestigationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [tab, setTab] = useState<"url" | "message">("url");
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const authHandled = useRef(false);

  const toast = useCallback((message: string, tone: Toast["tone"] = "info") => {
    const id = Date.now() + Math.random();
    setToasts((previous) => [...previous, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((previous) => previous.filter((item) => item.id !== id));
    }, 6200);
  }, []);

  const loadCore = useCallback(async () => {
    setBootError(null);
    try {
      const session = await api.me();
      setMe(session);
      const [statusResult, metaResult, automationResult, historyResult] = await Promise.all([
        api.status(),
        api.meta(),
        api.automation(),
        api.history(10, 0),
      ]);
      setStatus(statusResult);
      setMeta(metaResult);
      setAutomation(automationResult);
      setHistory(historyResult.items);
      setTotal(historyResult.total);
    } catch (caught) {
      setBootError(describeError(caught));
    } finally {
      setBooting(false);
    }
  }, []);

  useEffect(() => {
    void loadCore();
  }, [loadCore]);

  useEffect(() => {
    if (authHandled.current) return;
    authHandled.current = true;
    const params = new URLSearchParams(window.location.search);
    const auth = params.get("auth");
    if (!auth) return;
    const reason = params.get("reason");
    if (auth === "ok") {
      toast("Signed in with Google.", "success");
      void loadCore();
    } else {
      toast(`Google sign-in failed${reason ? ` (${reason})` : ""}. Continuing in demo mode.`, "error");
    }
    window.history.replaceState({}, "", window.location.pathname);
  }, [loadCore, toast]);

  const refreshStatus = useCallback(async () => {
    try {
      setStatus(await api.status());
    } catch {
      /* status is informational; keep the last known value */
    }
  }, []);

  const refreshHistory = useCallback(async () => {
    try {
      const result = await api.history(10, 0);
      setHistory(result.items);
      setTotal(result.total);
    } catch {
      /* history refresh is non-critical */
    }
  }, []);

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setSelectedId(id);
    setError(null);
    try {
      const result = await api.investigation(id);
      setDetail(result);
      setVerification(null);
      return result;
    } catch (caught) {
      setError(describeError(caught));
      return null;
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = detail?.id;
    const state = detail?.status;
    if (!id || (state !== "queued" && state !== "running")) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const next = await api.investigation(id);
        if (cancelled) return;
        setDetail(next);
        if (next.status === "completed" || next.status === "failed") {
          void refreshHistory();
          void refreshStatus();
        }
      } catch {
        /* transient polling error — the next tick retries */
      }
    };
    const timer = window.setInterval(tick, 1300);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [detail?.id, detail?.status, refreshHistory, refreshStatus]);

  const enabledChecks = useMemo(() => {
    if (!automation) return undefined;
    const keys = Object.keys(automation.modules).filter((key) => automation.modules[key] !== false);
    return keys.length > 0 ? keys : undefined;
  }, [automation]);

  const handleSubmit = async () => {
    if (!automation) {
      setError("Automation settings are still loading.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await api.submit({
        input: value,
        input_type: tab,
        mode: automation.mode,
        checks: enabledChecks,
      });
      setValue("");
      toast(response.message, response.queued ? "success" : "info");
      setDetail(null);
      setSelectedId(response.investigation.id);
      await loadDetail(response.investigation.id);
      await refreshHistory();
      await refreshStatus();
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setSubmitting(false);
    }
  };

  const handleModeChange = async (mode: InvestigationMode) => {
    if (!automation) return;
    const previous = automation;
    setAutomation({ ...automation, mode });
    try {
      setAutomation(await api.updateAutomation({ mode }));
    } catch (caught) {
      setAutomation(previous);
      setError(describeError(caught));
    }
  };

  const handleTogglePause = async () => {
    if (!automation) return;
    const previous = automation;
    const paused = !automation.paused;
    setAutomation({ ...automation, paused });
    try {
      setAutomation(await api.updateAutomation({ paused }));
      toast(paused ? "Automation paused. Submissions will be saved." : "Automation resumed.", "info");
    } catch (caught) {
      setAutomation(previous);
      setError(describeError(caught));
    }
  };

  const handleToggleModule = async (key: string, enabled: boolean) => {
    if (!automation) return;
    const previous = automation;
    setAutomation({ ...automation, modules: { ...automation.modules, [key]: enabled } });
    try {
      setAutomation(await api.updateAutomation({ modules: { [key]: enabled } }));
    } catch (caught) {
      setAutomation(previous);
      setError(describeError(caught));
    }
  };

  const handleRun = async () => {
    if (!detail) return;
    setActionBusy("run");
    setError(null);
    try {
      await api.run(detail.id, enabledChecks);
      setDetail({ ...detail, status: "queued", error: null });
      toast("Investigation queued. Evidence will appear as checks complete.", "success");
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setActionBusy(null);
    }
  };

  const handleCreateReport = async () => {
    if (!detail) return;
    setActionBusy("report");
    try {
      const report = await api.createReport(detail.id);
      await loadDetail(detail.id);
      toast(`Integrity report v${report.version} created. Digest computed from canonical JSON.`, "success");
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setActionBusy(null);
    }
  };

  const handleCommit = async () => {
    const report = detail?.reports[0];
    if (!detail || !report) return;
    setActionBusy("commit");
    try {
      const committed = await api.commitReport(report.id);
      await loadDetail(detail.id);
      toast(`Digest committed on chain ${committed.chain_id}.`, "success");
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setActionBusy(null);
    }
  };

  const handleVerify = async () => {
    const report = detail?.reports[0];
    if (!detail || !report) return;
    setActionBusy("verify");
    try {
      const result = await api.verifyReport(report.id);
      setVerification(result);
      await loadDetail(detail.id);
      setVerification(result);
      if (result.chain.match) {
        toast("Digest matches the on-chain commitment.", "success");
      } else if (result.chain.status === "unavailable") {
        toast("Local digest verified. The chain registry is unavailable.", "info");
      } else {
        toast("Verification did not match. Treat this report as untrusted.", "error");
      }
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setActionBusy(null);
    }
  };

  const handleDelete = async () => {
    if (!detail) return;
    if (!window.confirm("Delete this investigation, its evidence and its reports?")) return;
    setActionBusy("delete");
    try {
      await api.remove(detail.id);
      setDetail(null);
      setSelectedId(null);
      setVerification(null);
      await refreshHistory();
      toast("Investigation deleted.", "info");
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setActionBusy(null);
    }
  };

  const handleFeedback = async (kind: string) => {
    if (!detail) return;
    setActionBusy("feedback");
    try {
      await api.feedback(detail.id, kind);
      toast("Feedback recorded for review. It cannot change the risk rules automatically.", "success");
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setActionBusy(null);
    }
  };

  const handleLoadMore = async () => {
    setHistoryLoading(true);
    try {
      const result = await api.history(10, history.length);
      setHistory((previous) => [...previous, ...result.items]);
      setTotal(result.total);
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await api.logout();
    } finally {
      window.location.reload();
    }
  };

  if (booting) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="page-grid" aria-hidden />
        <span className="relative z-10 text-accent">
          <Logo size={40} />
        </span>
        <p className="relative z-10 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
          preparing the lens
        </p>
      </div>
    );
  }

  if (bootError && !me) {
    return (
      <div className="relative flex min-h-screen items-center justify-center px-4">
        <div className="page-grid" aria-hidden />
        <div className="panel relative z-10 w-full max-w-md p-7 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-400/[0.06] text-amber-300">
            <IconAlert size={20} />
          </span>
          <h1 className="mt-4 text-[19px] font-semibold text-ink">Cannot reach TrustLens</h1>
          <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{bootError}</p>
          <p className="mt-3 rounded-lg border border-line bg-raised/60 px-3 py-2 font-mono text-[10px] text-faint">
            Start the API on http://127.0.0.1:8000
          </p>
          <button
            type="button"
            className="btn btn-primary mt-5 w-full"
            onClick={() => {
              setBooting(true);
              void loadCore();
            }}
          >
            <IconRefresh size={14} />
            Retry connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-grid" aria-hidden />
      <Header
        me={me}
        status={status}
        automation={automation}
        busy={submitting || actionBusy !== null}
        onSignIn={() => window.location.assign(api.signInUrl)}
        onSignOut={() => void handleSignOut()}
        onTogglePause={() => void handleTogglePause()}
      />

      <main className="relative z-10 mx-auto max-w-[1440px] px-4 pb-14 pt-5 sm:px-6 lg:px-8">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_352px]">
          <div className="min-w-0 space-y-5">
            <Composer
              tab={tab}
              onTabChange={setTab}
              value={value}
              onValueChange={setValue}
              mode={automation?.mode ?? "automatic"}
              onModeChange={(mode) => void handleModeChange(mode)}
              paused={automation?.paused ?? false}
              modules={automation?.modules ?? {}}
              catalog={meta?.checks ?? null}
              onSubmit={() => void handleSubmit()}
              onToggleModule={(key, enabled) => void handleToggleModule(key, enabled)}
              submitting={submitting}
            />

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-400/25 bg-red-400/[0.06] px-4 py-3" role="alert">
                <IconAlert size={15} className="mt-0.5 shrink-0 text-red-300" />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-red-200">Action could not be completed</p>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-red-200/70">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="btn-quiet rounded p-1"
                  aria-label="Dismiss error"
                >
                  <IconX size={13} />
                </button>
              </div>
            )}

            {automation?.paused && (
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-400/25 bg-amber-400/[0.05] px-4 py-2.5">
                <IconInfo size={14} className="mt-0.5 shrink-0 text-amber-300" />
                <p className="text-[11.5px] leading-relaxed text-amber-100/80">
                  Automation is paused. New submissions are saved without running checks. You can
                  run them manually from the result panel.
                </p>
              </div>
            )}

            {detailLoading && !detail ? (
              <section className="panel h-[280px] animate-pulse p-6">
                <div className="h-3 w-28 rounded bg-raised" />
                <div className="mt-4 h-7 w-2/3 rounded bg-raised" />
                <div className="mt-3 h-3 w-1/2 rounded bg-raised" />
                <div className="mt-8 grid grid-cols-3 gap-2">
                  <div className="h-14 rounded-lg bg-raised" />
                  <div className="h-14 rounded-lg bg-raised" />
                  <div className="h-14 rounded-lg bg-raised" />
                </div>
              </section>
            ) : detail ? (
              <div className="space-y-5">
                {detail.status === "queued" || detail.status === "running" ? (
                  <ScanState detail={detail} catalog={meta?.checks ?? null} />
                ) : (
                  <>
                    {detail.status === "draft" && (
                      <div className="flex items-start gap-2.5 rounded-xl border border-line bg-raised/40 px-4 py-2.5">
                        <IconInfo size={14} className="mt-0.5 shrink-0 text-signal" />
                        <p className="text-[11.5px] leading-relaxed text-muted">
                          Saved without running checks. Review the enabled modules, then press
                          <span className="text-ink"> Run enabled checks</span>.
                        </p>
                      </div>
                    )}
                    {detail.error && (
                      <div className="flex items-start gap-2.5 rounded-xl border border-red-400/25 bg-red-400/[0.05] px-4 py-2.5">
                        <IconAlert size={14} className="mt-0.5 shrink-0 text-red-300" />
                        <p className="text-[11.5px] leading-relaxed text-red-200/80">{detail.error}</p>
                      </div>
                    )}
                    <RiskPanel
                      detail={detail}
                      onExport={() => window.location.assign(api.exportUrl(detail.id))}
                      onRun={() => void handleRun()}
                      onDelete={() => void handleDelete()}
                      onGenerateReport={() => void handleCreateReport()}
                      actionBusy={actionBusy}
                    />
                    {detail.checks.length > 0 && (
                      <Evidence
                        investigationId={detail.id}
                        checks={detail.checks}
                        explanation={detail.ai_explanation as AIExplanation | null}
                        onFeedback={(kind) => void handleFeedback(kind)}
                        feedbackBusy={actionBusy === "feedback"}
                      />
                    )}
                    {detail.status === "completed" && (
                      <ReportPanel
                        detail={detail}
                        verification={verification}
                        chainConfigured={status?.providers.chain.configured ?? false}
                        explorerBase={status?.providers.chain.explorer_base ?? null}
                        actionBusy={actionBusy}
                        onCreate={() => void handleCreateReport()}
                        onCommit={() => void handleCommit()}
                        onVerify={() => void handleVerify()}
                      />
                    )}
                  </>
                )}
              </div>
            ) : (
              <EmptyState />
            )}

            <History
              items={history}
              total={total}
              selectedId={selectedId}
              loading={historyLoading}
              onSelect={(id) => void loadDetail(id)}
              onLoadMore={() => void handleLoadMore()}
              onRefresh={() => void refreshHistory()}
            />
          </div>

          <aside className="space-y-5 xl:sticky xl:top-[84px] xl:self-start">
            {automation && (
              <AutomationPanel
                settings={automation}
                catalog={meta?.checks ?? null}
                busy={false}
                onModeChange={(mode) => void handleModeChange(mode)}
                onTogglePause={() => void handleTogglePause()}
                onToggleModule={(key, enabled) => void handleToggleModule(key, enabled)}
              />
            )}
            <SystemPanel status={status} />
            <GuideCard
              retentionDays={
                me?.authenticated
                  ? status?.limits.user_retention_days
                  : status?.limits.anonymous_retention_days
              }
            />
          </aside>
        </div>

        <footer className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-line/70 pt-5 text-[10.5px] text-faint sm:flex-row sm:items-center">
          <p className="flex items-center gap-2">
            <IconShield size={12} className="text-accent/60" />
            TrustLens performs passive checks only. Evidence coverage is always shown.
          </p>
          <p className="font-mono uppercase tracking-[0.12em]">
            {meta?.product ?? "TrustLens"} · rules {status?.ruleset.version ?? "v1"} ·{" "}
            {me?.authenticated ? "signed in" : "anonymous demo"}
          </p>
        </footer>
      </main>

      <div
        className="fixed bottom-4 right-4 z-50 flex w-[min(370px,calc(100vw-2rem))] flex-col gap-2"
        aria-live="polite"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            className={`panel flex items-start gap-2.5 px-3.5 py-3 shadow-2xl ${
              item.tone === "success"
                ? "border-emerald-400/25"
                : item.tone === "error"
                  ? "border-red-400/25"
                  : "border-line"
            }`}
          >
            <span
              className={`mt-0.5 shrink-0 ${
                item.tone === "success"
                  ? "text-emerald-300"
                  : item.tone === "error"
                    ? "text-red-300"
                    : "text-signal"
              }`}
            >
              {item.tone === "success" ? <IconCheck size={13} /> : item.tone === "error" ? <IconAlert size={13} /> : <IconInfo size={13} />}
            </span>
            <p className="min-w-0 flex-1 text-[11.5px] leading-relaxed text-ink/90">{item.message}</p>
            <button
              type="button"
              onClick={() => setToasts((previous) => previous.filter((toastItem) => toastItem.id !== item.id))}
              className="btn-quiet rounded p-0.5"
              aria-label="Dismiss notification"
            >
              <IconX size={11} />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

function EmptyState() {
  const facts = [
    {
      title: "Deterministic risk",
      body: "Five classifications set by a versioned rules engine — never by the model.",
    },
    {
      title: "Evidence, not vibes",
      body: "Each finding carries its source, impact, remediation and limitations.",
    },
    {
      title: "Verifiable reports",
      body: "Canonical JSON is hashed, then optionally committed to an EVM registry.",
    },
  ];
  return (
    <section className="panel relative overflow-hidden px-6 py-9 text-center sm:px-10 sm:py-11">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px hairline" />
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/20 bg-accent/[0.06] text-accent">
        <Logo size={30} />
      </span>
      <p className="eyebrow mt-4">Awaiting evidence</p>
      <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.02em] text-ink">
        Nothing under the lens yet
      </h2>
      <p className="mx-auto mt-2 max-w-md text-[12.5px] leading-relaxed text-muted">
        Submit a suspicious link or message above. The same pipeline works without any API keys,
        using deterministic analysis and a rules-only explanation.
      </p>
      <div className="mx-auto mt-6 grid max-w-2xl gap-2.5 text-left sm:grid-cols-3">
        {facts.map((fact) => (
          <div key={fact.title} className="rounded-xl border border-line bg-raised/40 p-3.5">
            <div className="flex items-center gap-1.5 text-accent/80">
              <IconSpark size={12} />
              <p className="text-[11px] font-medium text-ink">{fact.title}</p>
            </div>
            <p className="mt-1.5 text-[10.5px] leading-relaxed text-faint">{fact.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-mono text-[9.5px] uppercase tracking-[0.1em] text-faint">
        <span>no active scanning</span>
        <span>·</span>
        <span>no scripts executed</span>
        <span>·</span>
        <span>no secrets requested</span>
      </div>
    </section>
  );
}

function GuideCard({ retentionDays }: { retentionDays?: number }) {
  return (
    <section className="panel px-4 py-4">
      <details>
        <summary className="flex cursor-pointer items-center justify-between text-[11px] text-muted">
          <span className="flex items-center gap-1.5">
            <IconInfo size={12} className="text-accent/70" />
            How TrustLens works
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-faint">4 steps</span>
        </summary>
        <ol className="mt-3 space-y-2.5">
          {[
            "Normalise the input and validate it against SSRF policy.",
            "Collect passive evidence: DNS, redirects, TLS, headers, threat feeds and message indicators.",
            "Score the evidence with a versioned deterministic ruleset and show coverage.",
            "Explain the evidence separately, then optionally publish a verifiable digest.",
          ].map((step, index) => (
            <li key={step} className="flex gap-2.5">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-line font-mono text-[8.5px] text-faint">
                {index + 1}
              </span>
              <p className="text-[10.5px] leading-relaxed text-faint">{step}</p>
            </li>
          ))}
        </ol>
        <div className="mt-3 border-t border-line pt-3">
          <p className="text-[10px] leading-relaxed text-faint">
            <span className="text-muted">Not proof of safety.</span> A valid certificate, an empty
            threat feed or a low score means only that the completed checks found no significant
            malicious indicator. Retention: {retentionDays ?? 7} days. Message bodies are never sent
            to a blockchain.
          </p>
        </div>
      </details>
    </section>
  );
}
