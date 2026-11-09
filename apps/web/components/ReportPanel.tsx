"use client";

import { useEffect, useState } from "react";
import type { InvestigationDetail, VerificationResult } from "@/lib/types";
import { formatDateTime, shortDigest } from "@/lib/format";
import {
  IconChain,
  IconCheck,
  IconCopy,
  IconExternal,
  IconInfo,
  IconShield,
  IconSpark,
} from "./icons";

interface Props {
  detail: InvestigationDetail;
  verification: VerificationResult | null;
  chainConfigured: boolean;
  explorerBase: string | null;
  actionBusy: string | null;
  onCreate: () => void;
  onCommit: () => void;
  onVerify: () => void;
}

export default function ReportPanel({
  detail,
  verification,
  chainConfigured,
  explorerBase,
  actionBusy,
  onCreate,
  onCommit,
  onVerify,
}: Props) {
  const [copied, setCopied] = useState(false);
  const report = detail.reports[0] ?? null;

  useEffect(() => {
    setCopied(false);
  }, [report?.id]);

  const copyDigest = async () => {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(report.digest);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const txUrl =
    report?.tx_hash && explorerBase
      ? `${explorerBase.replace(/\/$/, "")}/tx/${report.tx_hash}`
      : null;

  return (
    <section className="panel overflow-hidden" aria-labelledby="report-title">
      <div className="panel-head">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-raised text-accent/90">
            <IconChain size={14} />
          </span>
          <div>
            <p className="eyebrow">Report integrity</p>
            <h2 id="report-title" className="mt-0.5 text-[14px] font-medium text-ink">
              Tamper-evident commitment
            </h2>
          </div>
        </div>
        <span
          className={`chip ${
            report?.status === "verified"
              ? "border-emerald-400/30 text-emerald-300"
              : report?.status === "committed"
                ? "border-accent/25 text-accent"
                : "text-faint"
          }`}
        >
          {report?.status ?? "not created"}
        </span>
      </div>

      <div className="px-5 py-4 sm:px-6">
        {!report ? (
          <div>
            <p className="text-[12px] leading-relaxed text-muted">
              Create a sanitised report and compute a SHA-256 digest of its canonical JSON. Raw
              message bodies, emails and personal data are never written on-chain.
            </p>
            <button
              type="button"
              onClick={onCreate}
              disabled={actionBusy !== null}
              className="btn btn-primary mt-3"
            >
              <IconSpark size={14} />
              {actionBusy === "report" ? "Creating…" : "Create integrity report"}
            </button>
          </div>
        ) : (
          <>
            <dl className="grid gap-2.5 sm:grid-cols-2">
              <div className="rounded-lg border border-line bg-raised/45 p-3">
                <dt className="font-mono text-[9px] uppercase tracking-[0.1em] text-faint">SHA-256 digest</dt>
                <dd className="mt-1 flex items-center gap-1.5">
                  <code className="mono min-w-0 truncate text-[11px] text-ink" title={report.digest}>
                    {shortDigest(report.digest, 12, 10)}
                  </code>
                  <button
                    type="button"
                    onClick={copyDigest}
                    className="btn-quiet shrink-0 rounded p-0.5"
                    title="Copy full digest"
                    aria-label="Copy full digest"
                  >
                    <IconCopy size={12} />
                  </button>
                  {copied && <span className="font-mono text-[8.5px] text-accent">copied</span>}
                </dd>
              </div>
              <div className="rounded-lg border border-line bg-raised/45 p-3">
                <dt className="font-mono text-[9px] uppercase tracking-[0.1em] text-faint">Report reference</dt>
                <dd className="mono mt-1 truncate text-[11px] text-ink" title={report.report_ref}>
                  {shortDigest(report.report_ref, 12, 8)}
                </dd>
              </div>
              <div className="rounded-lg border border-line bg-raised/45 p-3">
                <dt className="font-mono text-[9px] uppercase tracking-[0.1em] text-faint">Canonical schema</dt>
                <dd className="mono mt-1 text-[11px] text-muted">
                  {report.canonical_version} · v{report.version}
                </dd>
              </div>
              <div className="rounded-lg border border-line bg-raised/45 p-3">
                <dt className="font-mono text-[9px] uppercase tracking-[0.1em] text-faint">Created</dt>
                <dd className="mt-1 text-[11px] text-muted">{formatDateTime(report.created_at)}</dd>
              </div>
            </dl>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onCommit}
                disabled={actionBusy !== null || !chainConfigured || report.status === "committed" || report.status === "verified"}
                className="btn btn-ghost"
                title={
                  chainConfigured
                    ? "Register the digest on the configured EVM registry."
                    : "Deploy the local registry and set CHAIN_CONTRACT_ADDRESS to enable this."
                }
              >
                <IconChain size={13} />
                {actionBusy === "commit"
                  ? "Committing…"
                  : report.status === "committed" || report.status === "verified"
                    ? "Committed on-chain"
                    : "Commit on-chain"}
              </button>
              <button
                type="button"
                onClick={onVerify}
                disabled={actionBusy !== null}
                className="btn btn-ghost"
              >
                <IconShield size={13} />
                {actionBusy === "verify" ? "Verifying…" : "Verify independently"}
              </button>
              {!chainConfigured && (
                <span className="text-[10px] text-faint">
                  Registry offline — digest integrity can still be checked locally.
                </span>
              )}
            </div>

            {report.tx_hash && (
              <div className="mt-3 rounded-lg border border-line bg-raised/40 px-3 py-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-faint">On-chain record</p>
                  {txUrl && (
                    <a
                      href={txUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 font-mono text-[9px] text-accent hover:text-accent-soft"
                    >
                      explorer <IconExternal size={10} />
                    </a>
                  )}
                </div>
                <div className="mt-1.5 grid gap-1 text-[10.5px] text-muted sm:grid-cols-2">
                  <p className="truncate">
                    <span className="text-faint">tx </span>
                    <code className="mono text-ink">{shortDigest(report.tx_hash, 12, 8)}</code>
                  </p>
                  <p>
                    <span className="text-faint">chain </span>
                    <span className="mono text-ink">{report.chain_id}</span>
                    <span className="text-faint"> · block </span>
                    <span className="mono text-ink">{report.block_number}</span>
                  </p>
                </div>
              </div>
            )}

            {verification && (
              <div
                className={`mt-3 rounded-lg border p-3 ${
                  verification.chain.match
                    ? "border-emerald-400/25 bg-emerald-400/[0.06]"
                    : verification.chain.status === "unavailable"
                      ? "border-amber-400/25 bg-amber-400/[0.05]"
                      : "border-red-400/25 bg-red-400/[0.05]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <IconCheck
                    size={13}
                    className={verification.chain.match ? "text-emerald-300" : "text-amber-300"}
                  />
                  <p className="text-[11.5px] font-medium text-ink">
                    {verification.chain.match
                      ? "Digest matches the on-chain commitment"
                      : verification.chain.status === "unavailable"
                        ? "Local digest verified; chain unavailable"
                        : "Verification did not match"}
                  </p>
                </div>
                <div className="mt-1.5 space-y-0.5 font-mono text-[9.5px] text-muted">
                  <p>digest consistent: {String(verification.digest_consistent)}</p>
                  <p>chain status: {verification.chain.status}</p>
                  {verification.chain.on_chain_digest && (
                    <p className="truncate">on-chain: {shortDigest(verification.chain.on_chain_digest, 16, 12)}</p>
                  )}
                  <p className="text-faint">checked {formatDateTime(verification.verified_at)}</p>
                </div>
                <p className="mt-2 flex gap-1.5 text-[10px] leading-relaxed text-faint">
                  <IconInfo size={11} className="mt-0.5 shrink-0" />
                  {verification.explanation}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
