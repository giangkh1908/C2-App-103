'use client';

import React from 'react';
import { motion } from 'motion/react';

import { getConfigNumber, getConfigString, getConfigStringArray, VisualProps } from './shared';
import { getItemEmoji } from './kidThemeSafe';

const DEFAULT_LABELS = ['Táo', 'Cam', 'Chuối', 'Nho', 'Xoài'];

export default function PictureGraphVisual({
  primaryCount,
  secondaryCount,
  totalCount,
  groupsLabel = 'Loại',
  itemsLabel = 'bạn',
  config,
}: VisualProps) {
  const labels = getConfigStringArray(config, 'labels') ?? DEFAULT_LABELS.slice(0, Math.max(1, primaryCount));
  const values = (config?.values as unknown[] | undefined)?.map((value) => Number(value)).filter(Number.isFinite) as number[] | undefined;
  const unitValue = Math.max(1, getConfigNumber(config, 'unit_value') ?? secondaryCount ?? 1);
  const iconEmoji = getConfigString(config, 'icon_emoji');
  const data = labels.map((label, index) => ({
    label,
    value: values?.[index] ?? Math.max(1, Math.round(totalCount / Math.max(1, labels.length))),
  }));

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-4">
      <span className="rounded-full border-2 border-rose-200 bg-rose-50 px-4 py-1.5 text-sm font-bold text-rose-700">
        Biểu đồ tranh
      </span>
      <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-600">
        1 hình = {unitValue} {itemsLabel}
      </div>
      <div className="flex w-full flex-col gap-3 rounded-3xl border-2 border-rose-200 bg-white p-4 shadow-sm">
        {data.map((item, rowIndex) => {
          const iconCount = Math.max(1, Math.ceil(item.value / unitValue));
          return (
            <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50/60 px-3 py-2">
              <span className="w-20 shrink-0 text-right text-sm font-bold text-rose-700">{item.label}</span>
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: iconCount }, (_, iconIndex) => (
                  <motion.span
                    key={`${item.label}-${iconIndex}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: rowIndex * 0.08 + iconIndex * 0.04, type: 'spring', stiffness: 300 }}
                    className="text-2xl leading-none"
                  >
                    {iconEmoji ?? getItemEmoji(item.label, iconIndex)}
                  </motion.span>
                ))}
              </div>
              <span className="ml-auto text-sm font-black text-slate-700">{item.value}</span>
            </div>
          );
        })}
      </div>
      <div className="rounded-2xl border-2 border-rose-200 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 shadow-sm">
        {groupsLabel}: {data.length} mục
      </div>
    </div>
  );
}
