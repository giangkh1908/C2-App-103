import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import VisualRenderer from '@/components/visualization/VisualRenderer';
import { validateVisualizationPayload } from '@/components/visualization/validator';

describe('VisualRenderer guardrails', () => {
  it('renders a curriculum template when the payload is valid', () => {
    render(
      <VisualRenderer
        visualData={{
          type: 'comparison_visual',
          primaryCount: 34,
          secondaryCount: 7,
          totalCount: 34,
          groupsLabel: 'Số',
          itemsLabel: 'Đơn vị',
          config: { a_label: '34', b_label: '7', compare_operator: '>' },
        }}
      />
    );

    expect(screen.getByText('34 > 7')).toBeTruthy();
  });

  it('falls back safely when the payload is invalid', () => {
    render(
      <VisualRenderer
        visualData={{
          type: 'array_model',
          primaryCount: 3,
          secondaryCount: 5,
          totalCount: 20,
          groupsLabel: 'Hàng',
          itemsLabel: 'Cột',
          config: { rows: 3, cols: 5 },
        }}
      />
    );

    expect(screen.getByText(/fallback an toàn/i)).toBeTruthy();
  });

  it('validator catches ten-frame overflow and inconsistent arithmetic', () => {
    const overflow = validateVisualizationPayload({
      type: 'ten_frame',
      primaryCount: 18,
      secondaryCount: 9,
      totalCount: 27,
      config: { operation: '+', before: 18, change: 9, result: 27 },
    });
    const inconsistent = validateVisualizationPayload({
      type: 'operation_story',
      primaryCount: 8,
      secondaryCount: 5,
      totalCount: 20,
      config: { operation: '+', before: 8, change: 5, result: 20 },
    });

    expect(overflow.isValid).toBe(false);
    expect(inconsistent.isValid).toBe(false);
  });
});
