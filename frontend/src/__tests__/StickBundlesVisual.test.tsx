import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import StickBundlesVisual from '@/components/visuals/StickBundlesVisual';

describe('StickBundlesVisual', () => {
  it('renders addition with bundled tens and ones', () => {
    render(
      <StickBundlesVisual
        primaryCount={24}
        secondaryCount={13}
        totalCount={37}
        config={{
          operation: '+',
          before: 24,
          change: 13,
          result: 37,
          object_name: 'que tính',
          show_bundles: true,
          tens_before: 2,
          ones_before: 4,
          tens_after: 3,
          ones_after: 7,
        }}
      />
    );

    expect(screen.getByText('Que tính: 24 + 13 = 37')).toBeTruthy();
    expect(screen.getByText('2 bó 10')).toBeTruthy();
    expect(screen.getByText('7 que rời')).toBeTruthy();
    expect(screen.getByText(/Minh họa phép tính bằng que tính/i)).toBeTruthy();
  });

  it('renders subtraction with faded change sticks', () => {
    render(
      <StickBundlesVisual
        primaryCount={48}
        secondaryCount={15}
        totalCount={33}
        config={{
          operation: '-',
          before: 48,
          change: 15,
          result: 33,
          object_name: 'que tính',
          show_bundles: true,
          tens_before: 4,
          ones_before: 8,
          tens_after: 3,
          ones_after: 3,
        }}
      />
    );

    expect(screen.getByText('Que tính: 48 - 15 = 33')).toBeTruthy();
    expect(screen.getByText('Bớt đi')).toBeTruthy();
    expect(screen.getByText('3 bó 10')).toBeTruthy();
    expect(screen.getByText('3 que rời')).toBeTruthy();
  });
});
