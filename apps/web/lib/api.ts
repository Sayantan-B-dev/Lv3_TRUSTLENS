import type {
  AutomationSettings,
  HistoryResponse,
  InvestigationDetail,
  InvestigationMode,
  Me,
  MetaInfo,
  ReportSummary,
  SubmitResponse,
  SystemStatus,
  VerificationResult,
} from "./types";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/v1${path}`, {
      credentials: "include",
      cache: "no-store",
      headers: init?.body ? { "Content-Type": "application/json", ...(init?.headers ?? {}) } : init?.headers,
      ...init,
    });
  } catch {
    throw new ApiError("Cannot reach the TrustLens API. Is the backend running?", 0);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      (payload && typeof payload === "object" && "error" in payload
        ? (payload as { error?: { message?: string } }).error?.message
        : null) ?? `Request failed with HTTP ${response.status}.`;
    throw new ApiError(message, response.status);
  }
  return payload as T;
}

export const api = {
  me: () => request<Me>("/auth/me"),
  status: () => request<SystemStatus>("/system/status"),
  meta: () => request<MetaInfo>("/meta"),
  automation: () => request<AutomationSettings>("/automation"),
  updateAutomation: (patch: {
    mode?: InvestigationMode;
    paused?: boolean;
    modules?: Record<string, boolean>;
  }) =>
    request<AutomationSettings>("/automation", {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  history: (limit = 10, offset = 0) =>
    request<HistoryResponse>(`/investigations?limit=${limit}&offset=${offset}`),
  investigation: (id: string) => request<InvestigationDetail>(`/investigations/${id}`),
  submit: (body: {
    input: string;
    input_type: "url" | "message";
    mode?: InvestigationMode;
    checks?: string[];
  }) =>
    request<SubmitResponse>("/investigations", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  run: (id: string, checks?: string[]) =>
    request<{ queued: boolean }>(`/investigations/${id}/run`, {
      method: "POST",
      body: JSON.stringify({ checks }),
    }),
  remove: (id: string) =>
    request<void>(`/investigations/${id}`, {
      method: "DELETE",
    }),
  feedback: (id: string, kind: string, comment?: string) =>
    request<{ id: string }>(`/investigations/${id}/feedback`, {
      method: "POST",
      body: JSON.stringify({ kind, comment }),
    }),
  createReport: (investigationId: string) =>
    request<ReportSummary>("/threat-reports", {
      method: "POST",
      body: JSON.stringify({ investigation_id: investigationId }),
    }),
  commitReport: (id: string) =>
    request<ReportSummary>(`/threat-reports/${id}/commit`, { method: "POST" }),
  verifyReport: (id: string) =>
    request<VerificationResult>(`/threat-reports/${id}/verify`, { method: "POST" }),
  logout: () => request<{ authenticated: boolean }>("/auth/logout", { method: "POST" }),
  exportUrl: (id: string) => `/api/v1/investigations/${id}/export`,
  signInUrl: "/api/v1/auth/google/start",
};
