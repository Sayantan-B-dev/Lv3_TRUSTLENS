"use client";

import type { InvestigationSummary } from "@/lib/types";
import { RISK_META, formatRelative, truncate } from "@/lib/format";
import { IconClock, IconRefresh } from "./icons";

interface Props {
  items: InvestigationSummary[];
  total: number;
  selectedId: string | null;
  loading: boolean;
  onSelect: (id: string) => void;
  onLoadMore: () => void;
  onRefresh: () => void;
}

export default function History({ items, total, selectedId, loading, onSelect, onLoadMore, onRefresh }: Props) {
  return (
    <section className="panel overflow-hidden" aria-labelledby="history-title">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Recent work</p>
          <h2 id="history-title" className="mt-1 text-[14px] font-medium text-ink">
            Investigation history
            <span className="ml-2 font-mono text-[10px] text-faint">{total}</span>
          </h2>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="btn-quiet rounded p-1.5"
          aria-label="Refresh history"
          title="Refresh history"
        >
          <IconRefresh size={14} />
        </button>
      </div>

      {items.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-[12px] text-faint">No investigations yet. Your first result will appear here.</p>
        </div>
      ) : (
        <ul>
          {items.map((item) => {
            const meta = item.risk_classification ? RISK_META[item.risk_classification] : null;
            const active = item.id === selectedId;
            return (
              <li key={item.id} className="border-b border-line/60 last:border-b-0">
                <button
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className={`flex w-full items-center gap-3 px-5 py-3 text-left transition-colors ${
                    active ? "bg-elevated/70" : "hover:bg-raised/50"
                  }`}
                  aria-current={active ? "true" : undefined}
                >
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: meta?.hex ?? "#475569" }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] text-ink">
                      {truncate(item.display_value, 72)}
                    </span>
                    <span className="mt-0.5 flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.08em] text-faint">
                      <span>{item.input_type}</span>
                      <span>·</span>
                      <span>{item.status}</span>
                      {item.ai_used && (
                        <>
                          <span>·</span>
                          <span className="text-signal/80">ai</span>
                        </>
                      )}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className={`block text-[10.5px] ${meta?.text ?? "text-faint"}`}>
                      {item.risk_classification ?? "—"}
                    </span>
                    <span className="mt-0.5 flex items-center justify-end gap-1 font-mono text-[9px] text-faint">
                      <IconClock size={9} />
                      {formatRelative(item.created_at)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {items.length < total && (
        <div className="border-t border-line px-5 py-3">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loading}
            className="w-full rounded-lg border border-line py-2 text-[11px] text-muted transition-colors hover:border-line-strong hover:text-ink disabled:opacity-50"
          >
            {loading ? "Loading…" : `Load more (${total - items.length} remaining)`}
          </button>
        </div>
      )}
    </section>
  );
}
