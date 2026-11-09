export type RiskClass =
  | "Low Risk"
  | "Suspicious"
  | "High Risk"
  | "Confirmed Malicious"
  | "Inconclusive";

export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type CheckStatus = "completed" | "unavailable" | "error" | "not_run" | "skipped_by_policy";
export type InputType = "url" | "message";
export type InvestigationMode = "automatic" | "manual";

export interface Finding {
  rule_id: string;
  severity: Severity;
  title: string;
  summary: string;
  evidence?: Record<string, unknown>;
  impact?: string;
  remediation?: string;
  limitations?: string[];
  authoritative?: boolean;
}

export interface CheckResult {
  id: number;
  check_id: string;
  category: string;
  status: CheckStatus;
  severity: Severity;
  title: string;
  summary: string;
  evidence: Record<string, unknown>;
  findings: Finding[];
  source: string;
  source_timestamp: string | null;
  limitations: string[];
  impact: string | null;
  remediation: string | null;
  duration_ms: number;
}

export interface Indicator {
  type: string;
  value: string;
  confidence: number;
  provenance: string;
  first_seen: string | null;
}

export interface AIExplanation {
  summary: string;
  why: { claim: string; evidence_ids: string[] }[];
  next_steps: string[];
  limitations: string[];
  confidence_note: string;
  mode?: string;
  model?: string;
  note?: string;
}

export interface ReportSummary {
  id: string;
  investigation_id: string;
  version: number;
  canonical_version: string;
  digest: string;
  report_ref: string;
  status: "created" | "committed" | "verified" | "failed";
  chain_id: number | null;
  contract_address: string | null;
  tx_hash: string | null;
  block_number: number | null;
  committed_at: string | null;
  created_at: string;
  last_error: string | null;
  payload?: Record<string, unknown>;
}

export interface InvestigationSummary {
  id: string;
  input_type: InputType;
  display_value: string;
  mode: InvestigationMode;
  status: "draft" | "queued" | "running" | "completed" | "failed";
  risk_classification: RiskClass | null;
  score: number;
  confidence: number | null;
  coverage: number | null;
  ruleset_version: string;
  summary: string | null;
  error: string | null;
  checks_total: number;
  checks_completed: number;
  checks_requested: string[];
  ai_provider: string | null;
  ai_model: string | null;
  ai_used: boolean;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  expires_at: string;
  ai_explanation: AIExplanation | null;
  indicator_count: number;
  report_count: number;
}

export interface InvestigationDetail extends InvestigationSummary {
  checks: CheckResult[];
  indicators: Indicator[];
  reports: ReportSummary[];
}

export interface SubmitResponse {
  investigation: InvestigationSummary;
  queued: boolean;
  paused: boolean;
  message: string;
}

export interface HistoryResponse {
  items: InvestigationSummary[];
  total: number;
  limit: number;
  offset: number;
}

export interface Me {
  authenticated: boolean;
  mode: "user" | "anonymous";
  email: string | null;
  name: string | null;
  oauth_available: boolean;
  anonymous_allowed: boolean;
}

export interface AutomationSettings {
  mode: InvestigationMode;
  paused: boolean;
  modules: Record<string, boolean>;
  updated_at: string | null;
  note: string;
}

export interface SystemStatus {
  app: string;
  environment: string;
  database: string;
  worker: {
    enabled: boolean;
    online: boolean;
    status: string;
    last_seen_seconds_ago: number | null;
    processed_count: number;
  };
  queue: Record<string, number>;
  providers: {
    urlhaus: { enabled: boolean; key_configured: boolean };
    crt_sh: { enabled: boolean };
    ai: { mode: string; model: string; configured: boolean };
    oauth_google: { configured: boolean };
    chain: {
      configured: boolean;
      chain_id: number;
      contract_address: string | null;
      signer_configured: boolean;
      explorer_base: string | null;
    };
  };
  ruleset: { version: string; active: boolean };
  limits: {
    max_input_chars: number;
    anonymous_retention_days: number;
    user_retention_days: number;
  };
}

export interface CheckCatalogEntry {
  label: string;
  category: string;
  description: string;
}

export interface MetaInfo {
  product: string;
  objective: string;
  risk_classes: { name: RiskClass; definition: string }[];
  checks: Record<string, CheckCatalogEntry>;
  defaults: { url: string[]; message: string[] };
  privacy: string;
  limitations: string[];
}

export interface VerificationResult {
  digest_consistent: boolean;
  recomputed_digest: string;
  stored_digest: string;
  chain: {
    status: string;
    match: boolean | null;
    reason: string;
    chain_id: number | null;
    contract_address: string | null;
    on_chain_digest?: string | null;
  };
  explanation: string;
  verified_at: string;
}

export interface Toast {
  id: number;
  message: string;
  tone: "info" | "success" | "error";
}
