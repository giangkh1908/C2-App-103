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
  created_at: string;
}

export interface ChatSessionDetail {
  session_id: string;
  title: string;
  messages: ChatMessage[];
}