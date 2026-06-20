/**
 * useChatStream.ts
 *
 * Hook xử lý streaming chat qua SSE endpoint `/chat/stream`.
 *
 * Event flow từ backend:
 *   status → { message: string }        – thông báo trạng thái
 *   token  → { text: string }           – từng chunk text
 *   done   → ChatTurnResponse JSON      – full payload khi xong
 *   error  → { message: string }        – lỗi server
 */

import { useCallback, useRef } from 'react';
import type { ChatTurnResponse } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StreamCallbacks {
  /** Gọi khi nhận event `status` */
  onStatus?: (message: string) => void;
  /** Gọi mỗi khi nhận thêm token text mới (incremental) */
  onToken: (chunk: string) => void;
  /** Gọi khi stream kết thúc thành công với full payload */
  onDone: (response: ChatTurnResponse) => void;
  /** Gọi khi có lỗi (network hoặc server) */
  onError: (message: string) => void;
}

export interface StreamRequest {
  session_id: string | null;
  grade: number;
  message: string;
  selected_topic: string | null;
}

// ─── SSE parser ───────────────────────────────────────────────────────────────

interface SSEFrame {
  event: string;
  data: string;
}

/**
 * Parse raw SSE text chunk thành các frame hoàn chỉnh.
 * Buffer để xử lý khi chunk bị chia nhỏ giữa frame.
 */
function parseSSEChunk(buffer: string, newText: string): [SSEFrame[], string] {
  const combined = buffer + newText;
  const frames: SSEFrame[] = [];
  // SSE frames được phân tách bằng double newline
  const parts = combined.split('\n\n');
  // Phần cuối có thể là frame chưa hoàn chỉnh
  const remaining = parts.pop() ?? '';

  for (const part of parts) {
    const lines = part.split('\n');
    let event = 'message';
    let data = '';

    for (const line of lines) {
      if (line.startsWith('event: ')) {
        event = line.slice(7).trim();
      } else if (line.startsWith('data: ')) {
        data = line.slice(6).trim();
      }
    }

    if (data) {
      frames.push({ event, data });
    }
  }

  return [frames, remaining];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useChatStream(
  apiFetch: (path: string, options?: RequestInit) => Promise<Response>,
) {
  const abortRef = useRef<AbortController | null>(null);

  /**
   * Gửi request streaming và xử lý từng SSE event.
   * Tự động abort request trước đó nếu đang chạy.
   */
  const sendStream = useCallback(
    async (request: StreamRequest, callbacks: StreamCallbacks): Promise<void> => {
      // Abort request trước nếu còn đang chạy
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      let response: Response;
      try {
        response = await apiFetch('/chat/stream', {
          method: 'POST',
          body: JSON.stringify(request),
          signal: controller.signal,
          // Override Content-Type vì apiFetch đã set, nhưng cần giữ
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        callbacks.onError('Không thể kết nối đến server. Bạn kiểm tra mạng và thử lại nhé.');
        return;
      }

      if (!response.ok) {
        callbacks.onError(`Lỗi server (${response.status}). Bạn thử hỏi lại nhé.`);
        return;
      }

      if (!response.body) {
        callbacks.onError('Server không hỗ trợ streaming. Bạn thử lại sau nhé.');
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          let frames: SSEFrame[];
          [frames, buffer] = parseSSEChunk(buffer, text);

          for (const frame of frames) {
            switch (frame.event) {
              case 'status': {
                try {
                  const parsed = JSON.parse(frame.data) as { message: string };
                  callbacks.onStatus?.(parsed.message);
                } catch {
                  // ignore malformed status
                }
                break;
              }

              case 'token': {
                try {
                  // Backend escapes \n → "\\n" trong data field
                  const raw = frame.data.replace(/\\n/g, '\n');
                  const parsed = JSON.parse(raw) as { text: string };
                  callbacks.onToken(parsed.text);
                } catch {
                  // ignore malformed token
                }
                break;
              }

              case 'done': {
                try {
                  const raw = frame.data.replace(/\\n/g, '\n');
                  const payload = JSON.parse(raw) as ChatTurnResponse;
                  callbacks.onDone(payload);
                } catch {
                  callbacks.onError('Nhận dữ liệu lỗi từ server.');
                }
                break;
              }

              case 'error': {
                try {
                  const parsed = JSON.parse(frame.data) as { message: string };
                  callbacks.onError(parsed.message);
                } catch {
                  callbacks.onError('Có lỗi không xác định xảy ra.');
                }
                break;
              }

              default:
                break;
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          callbacks.onError('Kết nối bị gián đoạn. Bạn thử hỏi lại nhé.');
        }
      } finally {
        reader.releaseLock();
      }
    },
    [apiFetch],
  );

  /** Hủy stream đang chạy (nếu có). */
  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  return { sendStream, abort };
}