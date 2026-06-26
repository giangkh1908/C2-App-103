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
