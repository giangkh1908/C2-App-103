'use client';

import type { VisualData } from '@/types';

export type PolypadMode =
  | 'fractions'
  | 'geometry'
  | 'number-line'
  | 'base-ten-blocks'
  | 'measurement'
  | 'counters';

export interface PolypadIntent {
  enabled: boolean;
  mode?: PolypadMode;
  label?: string;
  href?: string;
}

const POLYPAD_BASE_URL = 'https://mathigon.org/polypad';

const POLYPAD_LABELS: Record<PolypadMode, string> = {
  fractions: 'Mở Polypad: Phân số',
  geometry: 'Mở Polypad: Hình học',
  'number-line': 'Mở Polypad: Trục số',
  'base-ten-blocks': 'Mở Polypad: Khối base-ten',
  measurement: 'Mở Polypad: Đo lường',
  counters: 'Mở Polypad: Nhóm đồ vật',
};

export function buildPolypadUrl(mode: PolypadMode): string {
  return `${POLYPAD_BASE_URL}?source=c2-app-103&mode=${encodeURIComponent(mode)}`;
}

export function resolvePolypadIntent(visualData?: VisualData): PolypadIntent {
  if (!visualData) {
    return { enabled: false };
  }

  if (visualData.polypadEnabled === false) {
    return { enabled: false };
  }

  const explicitMode = normalizeMode(visualData.polypadMode);
  if (visualData.polypadEnabled && explicitMode) {
    return {
      enabled: true,
      mode: explicitMode,
      label: POLYPAD_LABELS[explicitMode],
      href: buildPolypadUrl(explicitMode),
    };
  }

  const fallbackMode = inferPolypadModeFromVisualType(visualData.type);
  if (!fallbackMode) {
    return { enabled: false };
  }

  return {
    enabled: true,
    mode: fallbackMode,
    label: POLYPAD_LABELS[fallbackMode],
    href: buildPolypadUrl(fallbackMode),
  };
}

function normalizeMode(mode?: string): PolypadMode | undefined {
  if (!mode) return undefined;
  const supported: PolypadMode[] = ['fractions', 'geometry', 'number-line', 'base-ten-blocks', 'measurement', 'counters'];
  return supported.includes(mode as PolypadMode) ? (mode as PolypadMode) : undefined;
}

function inferPolypadModeFromVisualType(type: string): PolypadMode | undefined {
  if (['fraction_bar', 'fraction_circle', 'equivalent_fraction_visual'].includes(type)) {
    return 'fractions';
  }
  if (type === 'number_line') {
    return 'number-line';
  }
  if (type === 'place_value_blocks') {
    return 'base-ten-blocks';
  }
  if (['array_model', 'grouping_model', 'counting_objects'].includes(type)) {
    return 'counters';
  }
  if (['geometry_shape', 'shape_composition', 'drag_drop_shapes', 'real_object_match', 'shape_sorting'].includes(type)) {
    return 'geometry';
  }
  if (['ruler_measurement', 'clock_calendar', 'money_visual', 'mass_capacity_visual', 'polyline_length_visual'].includes(type)) {
    return 'measurement';
  }
  return undefined;
}
