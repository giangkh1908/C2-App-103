/**
 * chatHistoryApi.ts
 * Typed API client for chat history endpoints on the FastAPI backend.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

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
  input: RequestInfo,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, init);

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
export async function getHistory(): Promise<ChatSessionSummary[]> {
  return fetchJson<ChatSessionSummary[]>(`${API_BASE_URL}/chat/history`);
}

/**
 * Fetch the full message history for a single session.
 *
 * `GET /chat/history/{sessionId}`
 */
export async function getSession(
  sessionId: string,
): Promise<ChatSessionDetail> {
  return fetchJson<ChatSessionDetail>(
    `${API_BASE_URL}/chat/history/${encodeURIComponent(sessionId)}`,
  );
}

/**
 * Permanently delete a chat session and all its messages.
 *
 * `DELETE /chat/history/{sessionId}`
 */
export async function deleteSession(sessionId: string): Promise<void> {
  await fetchJson<unknown>(
    `${API_BASE_URL}/chat/history/${encodeURIComponent(sessionId)}`,
    { method: "DELETE" },
  );
}

/**
 * Create a new empty chat session and return its generated ID.
 * Returns null if the history API is unavailable.
 *
 * `POST /chat/history/new`
 */
export async function createSession(): Promise<{ session_id: string } | null> {
  try {
    return await fetchJson<{ session_id: string }>(
      `${API_BASE_URL}/chat/history/new`,
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
export async function sessionExists(sessionId: string): Promise<boolean> {
  try {
    await getSession(sessionId);
    return true;
  } catch {
    return false;
  }
}