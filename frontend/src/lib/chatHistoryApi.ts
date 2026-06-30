/**
 * chatHistoryApi.ts
 * Typed API client for chat history endpoints on the FastAPI backend.
 */

export type ApiFetch = (path: string, options?: RequestInit) => Promise<Response>;

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface ChatSessionSummary {
  session_id: string;
  title: string;
  grade: number;
  message_count: number;
  updated_at: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  created_at?: string;
  detected_topic?: string | null;
  response_mode?: string | null;
  follow_up_suggestions?: string[];
  visual_card?: Record<string, unknown> | null;
  practice_question?: Record<string, unknown> | null;
}

export interface ChatSessionDetail {
  session_id: string;
  title: string;
  messages: ChatMessage[];
}

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

/**
 * Thin wrapper around `fetch` that parses JSON and throws on non-2xx responses.
 * Attempts to surface the backend `detail` field when available.
 */
async function fetchJson<T>(
  apiFetch: ApiFetch,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await apiFetch(path, init);

  if (!response.ok) {
    let detail: string | undefined;
    try {
      const body = (await response.json()) as { detail?: string };
      detail = body.detail;
    } catch {
      // Body may not be JSON — fall through to status-based message.
    }
    throw new Error(detail ?? `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/**
 * Fetch the list of all chat sessions for the current user.
 *
 * `GET /chat/history`
 */
export async function getHistory(apiFetch: ApiFetch): Promise<ChatSessionSummary[]> {
  return fetchJson<ChatSessionSummary[]>(apiFetch, "/chat/history");
}

/**
 * Fetch the full message history for a single session.
 *
 * `GET /chat/history/{sessionId}`
 */
export async function getSession(
  apiFetch: ApiFetch,
  sessionId: string,
): Promise<ChatSessionDetail> {
  return fetchJson<ChatSessionDetail>(
    apiFetch,
    `/chat/history/${encodeURIComponent(sessionId)}`,
  );
}

/**
 * Permanently delete a chat session and all its messages.
 *
 * `DELETE /chat/history/{sessionId}`
 */
export async function deleteSession(
  apiFetch: ApiFetch,
  sessionId: string,
): Promise<void> {
  await fetchJson<unknown>(
    apiFetch,
    `/chat/history/${encodeURIComponent(sessionId)}`,
    { method: "DELETE" },
  );
}

/**
 * Create a new empty chat session and return its generated ID.
 * Returns null if the history API is unavailable.
 *
 * `POST /chat/history/new`
 */
export async function createSession(
  apiFetch: ApiFetch,
): Promise<{ session_id: string } | null> {
  try {
    return await fetchJson<{ session_id: string }>(
      apiFetch,
      "/chat/history/new",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      },
    );
  } catch {
    return null;
  }
}

/**
 * Check whether a session exists without throwing on 404.
 *
 * Returns `true` if the session can be fetched, `false` otherwise.
 */
export async function sessionExists(
  apiFetch: ApiFetch,
  sessionId: string,
): Promise<boolean> {
  try {
    await getSession(apiFetch, sessionId);
    return true;
  } catch {
    return false;
  }
}
