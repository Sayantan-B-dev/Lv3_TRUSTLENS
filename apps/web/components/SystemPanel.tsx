"use client";

import type { SystemStatus } from "@/lib/types";
import {
  IconActivity,
  IconChain,
  IconCpu,
  IconDatabase,
  IconInfo,
  IconShield,
} from "./icons";

interface Props {
  status: SystemStatus | null;
}

function Row({
  label,
  value,
  tone = "muted",
}: {
  label: string;
  value: string;
  tone?: "ok" | "warn" | "muted";
}) {
  const color = tone === "ok" ? "text-emerald-300" : tone === "warn" ? "text-amber-300" : "text-muted";
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-[11px] text-faint">{label}</span>
      <span className={`max-w-[160px] truncate text-right font-mono text-[10px] ${color}`} title={value}>
        {value}
      </span>
    </div>
  );
}

export default function SystemPanel({ status }: Props) {
  if (!status) {
    return (
      <section className="panel px-4 py-5">
        <div className="h-3 w-24 animate-pulse rounded bg-raised" />
        <div className="mt-3 space-y-2">
          <div className="h-2.5 w-full animate-pulse rounded bg-raised" />
          <div className="h-2.5 w-2/3 animate-pulse rounded bg-raised" />
        </div>
      </section>
    );
  }

  const queue = status.queue;
  const chain = status.providers.chain;
  const workerLabel = status.worker.enabled
    ? status.worker.online
      ? `online · ${status.worker.processed_count} runs`
      : "waiting for heartbeat"
    : "disabled";

  return (
    <section className="panel overflow-hidden" aria-labelledby="system-title">
      <div className="panel-head !py-3.5">
        <div>
          <p className="eyebrow">Service status</p>
          <h2 id="system-title" className="mt-1 text-[13px] font-medium text-ink">
            Runtime &amp; providers
          </h2>
        </div>
        <span className="chip border-line/70 text-faint">{status.environment}</span>
      </div>
      <div className="divide-y divide-line/50 px-4 py-2">
        <div>
          <div className="flex items-center gap-1.5 pt-1 text-[9px] uppercase tracking-[0.12em] text-faint">
            <IconActivity size={10} /> worker
          </div>
          <Row label="status" value={workerLabel} tone={status.worker.online ? "ok" : "warn"} />
          <Row label="queue" value={`${queue.queued ?? 0} queued · ${queue.running ?? 0} running`} />
          <Row label="failed jobs" value={String(queue.failed ?? 0)} tone={(queue.failed ?? 0) > 0 ? "warn" : "muted"} />
        </div>
        <div className="pt-1">
          <div className="flex items-center gap-1.5 pt-1 text-[9px] uppercase tracking-[0.12em] text-faint">
            <IconCpu size={10} /> intelligence
          </div>
          <Row label="URLhaus" value={status.providers.urlhaus.enabled ? "enabled" : "disabled"} tone={status.providers.urlhaus.enabled ? "ok" : "muted"} />
          <Row label="crt.sh (CT)" value={status.providers.crt_sh.enabled ? "enabled" : "disabled"} tone={status.providers.crt_sh.enabled ? "ok" : "muted"} />
          <Row
            label="AI layer"
            value={`${status.providers.ai.mode}${status.providers.ai.configured ? " · key set" : ""}`}
            tone={status.providers.ai.mode === "deterministic" ? "muted" : "ok"}
          />
          <Row label="ruleset" value={status.ruleset.version} />
        </div>
        <div className="pt-1">
          <div className="flex items-center gap-1.5 pt-1 text-[9px] uppercase tracking-[0.12em] text-faint">
            <IconChain size={10} /> integrity
          </div>
          <Row
            label="EVM registry"
            value={chain.configured ? `chain ${chain.chain_id}` : "not configured"}
            tone={chain.configured ? "ok" : "warn"}
          />
          <Row label="signer" value={chain.signer_configured ? "local key set" : "script only"} />
        </div>
        <div className="pt-1 pb-1">
          <div className="flex items-center gap-1.5 pt-1 text-[9px] uppercase tracking-[0.12em] text-faint">
            <IconDatabase size={10} /> storage
          </div>
          <Row label="database" value={status.database} />
          <Row label="anonymous retention" value={`${status.limits.anonymous_retention_days} days`} />
          <Row label="signed-in retention" value={`${status.limits.user_retention_days} days`} />
        </div>
      </div>
      <div className="flex items-start gap-2 border-t border-line px-4 py-3 text-[10px] leading-relaxed text-faint">
        <IconShield size={12} className="mt-0.5 shrink-0 text-accent/60" />
        <span>Passive inspection only. No exploitation, no active scanning, no browser rendering.</span>
      </div>
    </section>
  );
}
