'use client';

import React from 'react';
import { motion } from 'motion/react';

import { getConfigNumber, getConfigString, VisualProps } from './shared';
import { getItemEmoji, getKidColor } from './kidThemeSafe';

export default function ArrayModelVisual({
  primaryCount,
  secondaryCount,
  totalCount,
  groupsLabel = 'hàng',
  itemsLabel = 'cột',
  config,
}: VisualProps) {
  const rows = Math.max(1, getConfigNumber(config, 'rows') ?? primaryCount);
  const cols = Math.max(1, getConfigNumber(config, 'cols') ?? secondaryCount);
  const objectLabel = getConfigString(config, 'emoji_label') ?? itemsLabel;
  const total = totalCount || rows * cols;

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <span className="rounded-full border-2 border-violet-200 bg-violet-50 px-4 py-1.5 text-sm font-bold text-violet-700">
        Mảng ô vuông: {rows} × {cols} = {total}
      </span>

      <div className="rounded-3xl border-2 border-violet-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col items-center gap-2">
          {Array.from({ length: rows }, (_, rowIndex) => {
            const color = getKidColor(rowIndex);
            return (
              <motion.div
                key={rowIndex}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: rowIndex * 0.08 }}
                className="flex items-center gap-1"
              >
                <span className="w-6 text-right text-xs font-bold" style={{ color: color.text }}>
                  {rowIndex + 1}
                </span>
                {Array.from({ length: cols }, (_, colIndex) => (
                  <motion.div
                    key={colIndex}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: rowIndex * 0.08 + colIndex * 0.03, type: 'spring', stiffness: 320 }}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border-2 text-lg"
                    style={{ background: color.bg, borderColor: color.border }}
                    title={objectLabel}
                  >
                    {getItemEmoji(objectLabel, rowIndex + colIndex)}
                  </motion.div>
                ))}
              </motion.div>
            );
          })}
        </div>

        <div className="mt-3 flex items-center gap-1 pl-7">
          {Array.from({ length: cols }, (_, colIndex) => (
            <span key={colIndex} className="w-9 text-center text-xs font-bold text-violet-600">
              {colIndex + 1}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 shadow-sm">
        {rows} {groupsLabel} × {cols} {itemsLabel} = {total}
      </div>
    </div>
  );
}
