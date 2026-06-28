import { describe, expect, it } from 'vitest';

import { findSuggestionByText } from '@/components/chatSuggestions';
import { buildStreamRequest, getExactSuggestionMatch } from '@/lib/chatRouting';

describe('chat routing helpers', () => {
  it('keeps curriculum metadata when a suggestion is submitted', () => {
    const suggestion = findSuggestionByText('So sánh 37 và 42', 1);

    expect(suggestion).toBeTruthy();

    const request = buildStreamRequest({
      sessionId: 'session-1',
      grade: 1,
      message: 'So sánh 37 và 42',
      pendingSuggestion: suggestion,
    });

    expect(request).toEqual({
      session_id: 'session-1',
      grade: 1,
      message: 'So sánh 37 và 42',
      curriculum_topic_id: 'G1-NUM-02',
      curriculum_visual_template: 'comparison_visual',
    });
  });

  it('uses grade 2 suggestion metadata instead of the old hardcoded grade 1 payload', () => {
    const suggestion = findSuggestionByText('So sánh 342 và 324', 2);

    expect(suggestion).toBeTruthy();

    const request = buildStreamRequest({
      sessionId: 'session-2',
      grade: 2,
      message: 'So sánh 342 và 324',
      pendingSuggestion: suggestion,
    });

    expect(request.grade).toBe(2);
    expect(request.curriculum_topic_id).toBe('G2-NUM-02');
    expect(request.curriculum_visual_template).toBe('comparison_visual');
  });

  it('falls back to a plain free-text request when there is no pending suggestion', () => {
    const request = buildStreamRequest({
      sessionId: null,
      grade: 2,
      message: 'Tính 8 + 5',
      pendingSuggestion: null,
    });

    expect(request).toEqual({
      session_id: null,
      grade: 2,
      message: 'Tính 8 + 5',
      curriculum_topic_id: undefined,
      curriculum_visual_template: undefined,
    });
  });
  it('drops stale comparison metadata after the user edits the prompt text', () => {
    const suggestion = findSuggestionByText('So sÃ¡nh 37 vÃ  42', 1);

    expect(getExactSuggestionMatch('24 cÃ³ máº¥y chá»¥c máº¥y Ä‘Æ¡n vá»‹', suggestion)).toBeNull();

    const request = buildStreamRequest({
      sessionId: 'session-3',
      grade: 1,
      message: '24 cÃ³ máº¥y chá»¥c máº¥y Ä‘Æ¡n vá»‹',
      pendingSuggestion: suggestion,
    });

    expect(request.curriculum_topic_id).toBeUndefined();
    expect(request.curriculum_visual_template).toBeUndefined();
  });
});
