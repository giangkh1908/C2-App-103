import type { ChatSuggestion } from '@/components/chatSuggestions';
import type { StreamRequest } from '@/lib/useChatStream';
import type { MathDomain } from '@/types';

interface BuildStreamRequestArgs {
  sessionId: string | null;
  grade: number;
  message: string;
  selectedTopic?: MathDomain | null;
  pendingSuggestion?: ChatSuggestion | null;
}

function normalizeForRouting(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .trim();
}

function shouldUseContinuityTopic(message: string): boolean {
  const normalized = normalizeForRouting(message);
  return [
    'them vi du',
    'cho them vi du',
    'cho con them vi du',
    'them mot vi du',
    'them vi du nua',
    'vi du nua',
    'cho vi du khac',
    'vi du khac',
    'vi du moi',
    'lam vi du khac',
    'so khac',
    'so khac di',
    'đoi so',
    'doi so',
    'doi so khac',
    'vi sao day la phep nhan',
    'vi sao la phep nhan',
    'giai thich lai',
    'giai thich de hon',
    'noi ro hon',
    'tai sao lai nhu vay',
  ].some((phrase) => normalized.includes(phrase));
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
  selectedTopic,
  pendingSuggestion,
}: BuildStreamRequestArgs): StreamRequest {
  const activeSuggestion = getExactSuggestionMatch(message, pendingSuggestion);
  const continuityTopic =
    !activeSuggestion && selectedTopic && shouldUseContinuityTopic(message)
      ? selectedTopic
      : undefined;
  return {
    session_id: sessionId,
    grade: activeSuggestion?.grade ?? grade,
    message,
    ...(continuityTopic ? { selected_topic: continuityTopic } : {}),
    curriculum_topic_id: activeSuggestion?.curriculumTopicId,
    curriculum_visual_template: activeSuggestion?.curriculumVisualTemplate,
  };
}
