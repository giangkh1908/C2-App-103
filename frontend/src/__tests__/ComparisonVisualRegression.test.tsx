import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ComparisonVisual from '@/components/visuals/ComparisonVisual';

describe('ComparisonVisual regression coverage', () => {
  it('renders 34 greater than 7 without collapsing to an equals state', () => {
    render(
      <ComparisonVisual
        primaryCount={34}
        secondaryCount={7}
        totalCount={34}
        groupsLabel="Số"
        config={{ a_label: '34', b_label: '7' }}
      />
    );

    expect(screen.getByText('34 > 7')).toBeTruthy();
    expect(screen.getByText('34 lớn hơn 7')).toBeTruthy();
  });

  it('renders the equality state explicitly when two numbers are the same', () => {
    render(
      <ComparisonVisual
        primaryCount={19}
        secondaryCount={19}
        totalCount={19}
        groupsLabel="Số"
        config={{ a_label: '19', b_label: '19' }}
      />
    );

    expect(screen.getByText('19 = 19')).toBeTruthy();
    expect(screen.getByText('Hai số bằng nhau')).toBeTruthy();
  });
});
