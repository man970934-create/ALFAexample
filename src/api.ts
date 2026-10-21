import type {
  Analysis,
  Company,
  Feed,
  Filters,
  Insight,
  Message,
  Role,
} from "./types";
export const mocksEnabled = import.meta.env.VITE_ENABLE_MOCKS !== "false";
const base = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
async function request<T>(
  path: string,
  signal?: AbortSignal,
  body?: unknown,
): Promise<T> {
  const response = await fetch(
    new URL(`${base}${path}`, window.location.origin),
    {
      signal,
      credentials: "same-origin",
      ...(body === undefined
        ? {}
        : {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }),
    },
  );
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new ApiError(
      response.status,
      error?.error?.code || "HTTP_ERROR",
      error?.error?.message ||
        "Не удалось получить данные. Попробуйте ещё раз.",
    );
  }
  return response.json();
}
const companyPath = (id: string) => `/companies/${encodeURIComponent(id)}`;
const insightPath = (id: string, insightId: string) =>
  `${companyPath(id)}/insights/${encodeURIComponent(insightId)}`;
export const api = {
  me: (signal?: AbortSignal) =>
    request<{ name: string; title: string }>("/me", signal),
  companies: (signal?: AbortSignal) => request<Company[]>("/companies", signal),
  profile: (id: string, signal?: AbortSignal) =>
    request<Company>(`${companyPath(id)}/profile`, signal),
  feed: (id: string, filters: Filters, signal?: AbortSignal) =>
    request<Feed>(
      `${companyPath(id)}/feed?${new URLSearchParams({ ...filters })}`,
      signal,
    ),
  insight: (
    id: string,
    insightId: string,
    role: Role,
    scenario: string,
    signal?: AbortSignal,
  ) =>
    request<Insight>(
      `${insightPath(id, insightId)}?${new URLSearchParams({ role, scenario })}`,
      signal,
    ),
  analyses: (id: string, scenario: string) =>
    request<Analysis>(`${companyPath(id)}/analyses`, undefined, { scenario }),
  analysis: (id: string, signal?: AbortSignal) =>
    request<Analysis>(`/analyses/${encodeURIComponent(id)}`, signal),
  messages: (id: string, insightId: string, role: Role, signal?: AbortSignal) =>
    request<Message[]>(
      `${insightPath(id, insightId)}/messages?role=${role}`,
      signal,
    ),
  ask: (
    id: string,
    insightId: string,
    role: Role,
    question: string,
    requestId: string,
    simulateError: boolean,
  ) =>
    request<Message[]>(`${insightPath(id, insightId)}/questions`, undefined, {
      role,
      question,
      requestId,
      simulateError,
    }),
  feedback: (id: string, insightId: string, useful: boolean) =>
    request<{ saved: boolean }>(
      `${insightPath(id, insightId)}/feedback`,
      undefined,
      { useful },
    ),
};
