'use client';

import React from 'react';

export interface VisualProps {
  primaryCount: number;
  secondaryCount: number;
  totalCount: number;
  groupsLabel?: string;
  itemsLabel?: string;
  config?: Record<string, unknown>;
}

export type VisualComponent = React.ComponentType<VisualProps>;

export function getConfigString(
  config: Record<string, unknown> | undefined,
  key: string,
): string | undefined {
  const value = config?.[key];
  return typeof value === 'string' && value.trim() ? value : undefined;
}

export function getConfigNumber(
  config: Record<string, unknown> | undefined,
  key: string,
): number | undefined {
  const value = config?.[key];
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

export function getConfigStringArray(
  config: Record<string, unknown> | undefined,
  key: string,
): string[] | undefined {
  const value = config?.[key];
  if (!Array.isArray(value)) {
    return undefined;
  }
  const items = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  return items.length ? items : undefined;
}

export function getConfigNumberArray(
  config: Record<string, unknown> | undefined,
  key: string,
): number[] | undefined {
  const value = config?.[key];
  if (!Array.isArray(value)) {
    return undefined;
  }
  const items = value
    .map((item) => (typeof item === 'number' ? item : Number(item)))
    .filter((item) => Number.isFinite(item));
  return items.length ? items : undefined;
}
