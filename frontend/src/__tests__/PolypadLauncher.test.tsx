import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import PolypadLauncher from '@/components/visualization/PolypadLauncher';
import { resolvePolypadIntent } from '@/components/visualization/polypad';

describe('PolypadLauncher', () => {
  it('shows a launch button when backend enables Polypad for the concept', () => {
    render(
      <PolypadLauncher
        visualData={{
          type: 'place_value_blocks',
          primaryCount: 2,
          secondaryCount: 4,
          totalCount: 24,
          polypadEnabled: true,
          polypadMode: 'base-ten-blocks',
        }}
      />
    );

    const link = screen.getByRole('link', { name: /khối base-ten/i });
    expect(link.getAttribute('href')).toContain('https://mathigon.org/polypad');
    expect(link.getAttribute('data-polypad-mode')).toBe('base-ten-blocks');
  });

  it('hides the button for unsupported concepts', () => {
    render(
      <PolypadLauncher
        visualData={{
          type: 'comparison_visual',
          primaryCount: 34,
          secondaryCount: 7,
          totalCount: 34,
          polypadEnabled: false,
        }}
      />
    );

    expect(screen.queryByRole('link')).toBeNull();
  });

  it('can infer a safe fallback mode from supported visual types', () => {
    const intent = resolvePolypadIntent({
      type: 'geometry_shape',
      primaryCount: 1,
      secondaryCount: 0,
      totalCount: 1,
    });

    expect(intent.enabled).toBe(true);
    expect(intent.mode).toBe('geometry');
  });
});
