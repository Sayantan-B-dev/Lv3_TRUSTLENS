"use client";

import type { AutomationSettings, Me, SystemStatus } from "@/lib/types";
import { initiatorInitials } from "@/lib/format";
import { IconLogout, IconPause, IconPlay, IconUser, Logo } from "./icons";

interface Props {
  me: Me | null;
  status: SystemStatus | null;
  automation: AutomationSettings | null;
  busy: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  onTogglePause: () => void;
}

export default function Header({ me, status, automation, busy, onSignIn, onSignOut, onTogglePause }: Props) {
  const online = status?.worker.online ?? false;
  const queued = (status?.queue.queued ?? 0) + (status?.queue.running ?? 0);

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-canvas/82 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-accent/25 bg-accent/[0.07] text-accent">
            <Logo size={22} />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-[15px] font-semibold tracking-[-0.01em] text-ink">
                TrustLens
              </span>
              <span className="hidden rounded border border-line px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-faint sm:inline">
                v1.0
              </span>
            </div>
            <p className="hidden truncate text-[11px] text-faint md:block">
              Threat &amp; digital-trust intelligence
            </p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div
            className="hidden items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1.5 sm:flex"
            title={
              online
                ? "The background worker is processing the queue."
                : "The background worker has not reported recently."
            }
          >
            <span
              className={`status-dot h-1.5 w-1.5 rounded-full ${online ? "bg-emerald-400" : "bg-amber-400"}`}
            />
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
              {me === null && status === null ? "connecting" : online ? "engine online" : "worker idle"}
            </span>
            {queued > 0 && (
              <span className="rounded bg-elevated px-1.5 py-0.5 font-mono text-[9px] text-signal">
                {queued} queued
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onTogglePause}
            disabled={busy || !automation}
            className={`btn ${
              automation?.paused
                ? "border border-amber-400/30 bg-amber-400/10 text-amber-200 hover:bg-amber-400/15"
                : "btn-ghost"
            } px-2.5 sm:px-3`}
            aria-pressed={automation?.paused ?? false}
            title={
              automation?.paused
                ? "Automation is paused. Resume to queue new submissions automatically."
                : "Pause automatic investigations"
            }
          >
            {automation?.paused ? <IconPlay size={14} /> : <IconPause size={14} />}
            <span className="hidden sm:inline">{automation?.paused ? "Paused" : "Automation on"}</span>
          </button>

          {me?.authenticated ? (
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full border border-accent/25 bg-accent/10 font-mono text-[11px] font-medium text-accent-soft"
                title={me.email ?? me.name ?? "Signed in"}
              >
                {initiatorInitials(me.name, me.email) || <IconUser size={14} />}
              </div>
              <button
                type="button"
                onClick={onSignOut}
                className="btn-quiet rounded p-1.5"
                title="Sign out"
                aria-label="Sign out"
              >
                <IconLogout size={15} />
              </button>
            </div>
          ) : me?.oauth_available ? (
            <button type="button" onClick={onSignIn} className="btn btn-ghost px-3">
              <IconUser size={14} />
              <span className="hidden sm:inline">Sign in</span>
            </button>
          ) : (
            <span
              className="chip hidden sm:inline-flex"
              title="Google OAuth is not configured. This is a rate-limited anonymous demo session."
            >
              <span className="h-1 w-1 rounded-full bg-signal" />
              demo session
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
