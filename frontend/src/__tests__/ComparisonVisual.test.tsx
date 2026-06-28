import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ComparisonVisual from '@/components/visuals/ComparisonVisual';

describe('ComparisonVisual', () => {
  it('renders a less-than comparison clearly', () => {
    render(
      <ComparisonVisual
        primaryCount={37}
        secondaryCount={42}
        totalCount={42}
        groupsLabel="Số"
        config={{ a_label: '37', b_label: '42' }}
      />
    );

    expect(screen.getByText('So sánh hai số')).toBeTruthy();
    expect(screen.getByText('37 nhỏ hơn 42')).toBeTruthy();
    expect(screen.getByText('37 < 42')).toBeTruthy();
    expect(screen.getByText('Số A')).toBeTruthy();
    expect(screen.getByText('Số B')).toBeTruthy();
  });

  it('renders a greater-than comparison clearly', () => {
    render(
      <ComparisonVisual
        primaryCount={58}
        secondaryCount={53}
        totalCount={58}
        groupsLabel="Số"
        config={{ a_label: '58', b_label: '53' }}
      />
    );

    expect(screen.getByText('58 lớn hơn 53')).toBeTruthy();
    expect(screen.getByText('58 > 53')).toBeTruthy();
  });

  it('renders an equals comparison clearly', () => {
    render(
      <ComparisonVisual
        primaryCount={19}
        secondaryCount={19}
        totalCount={19}
        groupsLabel="Số"
        config={{ a_label: '19', b_label: '19' }}
      />
    );

    expect(screen.getByText('Hai số bằng nhau')).toBeTruthy();
    expect(screen.getByText('19 = 19')).toBeTruthy();
  });
});
