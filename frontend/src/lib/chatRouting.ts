import type { ChatSuggestion } from '@/components/chatSuggestions';
import type { StreamRequest } from '@/lib/useChatStream';

interface BuildStreamRequestArgs {
  sessionId: string | null;
  grade: number;
  message: string;
  pendingSuggestion?: ChatSuggestion | null;
}

export function getExactSuggestionMatch(
  message: string,
  pendingSuggestion?: ChatSuggestion | null,
): ChatSuggestion | null {
  if (!pendingSuggestion) return null;
  return message.trim() === pendingSuggestion.text.trim() ? pendingSuggestion : null;
}

export function buildStreamRequest({
  sessionId,
  grade,
  message,
  pendingSuggestion,
}: BuildStreamRequestArgs): StreamRequest {
  const activeSuggestion = getExactSuggestionMatch(message, pendingSuggestion);
  return {
    session_id: sessionId,
    grade: activeSuggestion?.grade ?? grade,
    message,
    curriculum_topic_id: activeSuggestion?.curriculumTopicId,
    curriculum_visual_template: activeSuggestion?.curriculumVisualTemplate,
  };
}
