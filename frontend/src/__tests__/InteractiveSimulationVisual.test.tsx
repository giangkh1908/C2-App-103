import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import InteractiveSimulation from '@/components/InteractiveSimulation';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    if (!values) return key;
    return `${key}:${JSON.stringify(values)}`;
  },
}));

describe('InteractiveSimulation visual registry', () => {
  it('passes raw curriculum counts into comparison_visual without clamping them to legacy bounds', () => {
    render(
      <InteractiveSimulation
        visualData={{
          type: 'comparison_visual',
          primaryCount: 34,
          secondaryCount: 7,
          totalCount: 34,
          groupsLabel: 'Số',
          itemsLabel: 'Đơn vị',
          config: { a_label: '34', b_label: '7' },
        }}
      />
    );

    expect(screen.getByText('34 > 7')).toBeTruthy();
    expect(screen.getByText('34 lớn hơn 7')).toBeTruthy();
    expect(screen.queryByText('12 > 7')).toBeNull();
  });
});
