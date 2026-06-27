'use client';

import React from 'react';

import type { VisualData } from '@/types';

import { resolvePolypadIntent } from './polypad';

export default function PolypadLauncher({ visualData }: { visualData?: VisualData }) {
  const intent = resolvePolypadIntent(visualData);
  if (!intent.enabled || !intent.href || !intent.label) {
    return null;
  }

  return (
    <div className="border-t border-gray-100 bg-slate-50 px-4 py-3">
      <a
        href={intent.href}
        target="_blank"
        rel="noreferrer noopener"
        data-polypad-mode={intent.mode}
        className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 transition-colors hover:border-sky-300 hover:bg-sky-100"
      >
        {intent.label}
      </a>
    </div>
  );
}
