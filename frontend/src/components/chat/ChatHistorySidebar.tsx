"use client";

/**
 * ChatHistorySidebar.tsx
 * Slide-in sidebar hiển thị lịch sử hội thoại toán của học sinh.
 * Nhận toàn bộ dữ liệu qua props — không gọi API trực tiếp.
 */

import { History, MessageSquare, Plus, Trash2, X } from "lucide-react";
import { ChatSessionSummary } from "@/lib/chatHistoryApi";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Chuyển ISO timestamp thành chuỗi tương đối tiếng Việt.
 * Ví dụ: "2 giờ trước", "15 phút trước", "3 ngày trước".
 */
function formatRelativeTime(updatedAt: string): string {
  const diffMs = Date.now() - new Date(updatedAt).getTime();
  const diffSec = Math.floor(diffMs / 1_000);

  if (diffSec < 60) return "Vừa xong";

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay} ngày trước`;

  const diffMonth = Math.floor(diffDay / 30);
  return `${diffMonth} tháng trước`;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ChatHistorySidebarProps {
  sessions: ChatSessionSummary[];
  activeSessionId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onCreateSession: () => void;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ChatHistorySidebar({
  sessions,
  activeSessionId,
  isOpen,
  onClose,
  onCreateSession,
  onSelectSession,
  onDeleteSession,
}: ChatHistorySidebarProps) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="md:hidden absolute inset-0 bg-black/35 z-20 backdrop-blur-3xs"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          "bg-white h-full border-r border-gray-150 flex flex-col shrink-0 transition-all duration-300 z-30 select-none",
          isOpen
            ? "w-64 max-md:absolute max-md:left-0 max-md:top-0 max-md:bottom-0 max-md:shadow-2xl"
            : "w-0 overflow-hidden border-r-0",
        ].join(" ")}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2 text-[#4A6741]">
            <History size={16} strokeWidth={2} />
            <span className="text-sm font-semibold tracking-wide whitespace-nowrap">
              Lịch sử hội thoại
            </span>
          </div>
          <button
            onClick={onClose}
            className="md:hidden rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Đóng sidebar"
          >
            <X size={16} />
          </button>
        </div>

        {/* New chat button */}
        <div className="px-3 py-3 shrink-0">
          <button
            onClick={onCreateSession}
            className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 bg-[#4A6741] hover:bg-[#3d5836] active:bg-[#354e2f] text-white text-xs font-bold tracking-widest transition-colors"
          >
            <Plus size={14} strokeWidth={2.5} />
            HỘI THOẠI TOÁN MỚI
          </button>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {sessions.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center gap-2 mt-10 px-4 text-center">
              <MessageSquare size={28} className="text-gray-300" />
              <p className="text-xs text-gray-400 leading-relaxed">
                Không có cuộc hội thoại nào.
                <br />
                Bạn hãy bấm{" "}
                <span className="font-semibold text-[#4A6741]">Thêm mới</span>{" "}
                để trò chuyện nhé!
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-1 mt-1">
              {sessions.map((session) => {
                const isActive = session.session_id === activeSessionId;
                return (
                  <li key={session.session_id}>
                    <div
                      onClick={() => onSelectSession(session.session_id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelectSession(session.session_id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      className={[
                        "group w-full text-left rounded-lg px-3 py-2.5 border transition-colors cursor-pointer outline-none",
                        isActive
                          ? "bg-[#E9F0E6] text-[#4A6741] border border-[#4A6741]/20 font-bold"
                          : "hover:bg-slate-50 text-gray-700 border-transparent",
                      ].join(" ")}
                    >
                      {/* Title row */}
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-sm leading-snug line-clamp-2 flex-1">
                          {session.title}
                        </span>
                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Ngăn sự kiện click lan ra ngoài thẻ div
                            onDeleteSession(session.session_id);
                          }}
                          className={[
                            "shrink-0 rounded p-0.5 transition-all",
                            isActive
                              ? "text-[#4A6741]/60 hover:text-[#4A6741] hover:bg-[#4A6741]/10"
                              : "text-gray-400 hover:text-red-500 hover:bg-red-50",
                            "opacity-0 group-hover:opacity-100",
                          ].join(" ")}
                          aria-label={`Xóa hội thoại ${session.title}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Meta row */}
                      <div
                        className={[
                          "mt-1 flex items-center gap-1.5 text-xs",
                          isActive ? "text-[#4A6741]/70" : "text-gray-400",
                        ].join(" ")}
                      >
                        <span>Lớp {session.grade}</span>
                        <span aria-hidden="true">•</span>
                        <span>{session.message_count} tin</span>
                        <span aria-hidden="true">•</span>
                        <span>{formatRelativeTime(session.updated_at)}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}