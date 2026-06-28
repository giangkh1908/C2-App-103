'use client';

import React from 'react';
import { motion } from 'motion/react';

import { VisualProps } from './shared';
import { getKidColor, getItemEmoji } from './kidThemeSafe';

export default function CountingObjectsVisual({
  primaryCount,
  secondaryCount,
  totalCount,
  groupsLabel = 'nhóm',
  itemsLabel = 'vật',
}: VisualProps) {
  const groups = Math.max(1, primaryCount);
  const itemsPerGroup = Math.max(1, secondaryCount);
  const total = totalCount || groups * itemsPerGroup;

  const allGroups: number[][] = [];
  let remaining = total;
  for (let g = 0; g < groups; g += 1) {
    const count = Math.min(itemsPerGroup, remaining);
    allGroups.push(Array.from({ length: count }, (_, i) => i));
    remaining -= count;
  }

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <motion.div
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="rounded-full border-2 px-4 py-2 text-sm font-bold"
        style={{ background: '#FFF9DB', borderColor: '#FFD43B', color: '#E67700' }}
      >
        {groups} {groupsLabel} × {itemsPerGroup} {itemsLabel} = <span className="text-base text-rose-600">{total}</span>
      </motion.div>

      <div className="flex flex-wrap justify-center gap-3">
        {allGroups.map((group, groupIndex) => {
          const color = getKidColor(groupIndex);
          return (
            <motion.div
              key={groupIndex}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: groupIndex * 0.08 }}
              className="flex flex-col items-center gap-2 rounded-3xl border-2 p-3 shadow-sm"
              style={{ background: color.bg, borderColor: color.border }}
            >
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: color.text }}>
                {groupsLabel} {groupIndex + 1}
              </span>
              <div className="flex max-w-[112px] flex-wrap justify-center gap-1">
                {group.map((itemIndex) => (
                  <motion.span
                    key={itemIndex}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: groupIndex * 0.08 + itemIndex * 0.04, type: 'spring', stiffness: 300 }}
                    className="text-2xl leading-none"
                  >
                    {getItemEmoji(itemsLabel, groupIndex + itemIndex)}
                  </motion.span>
                ))}
              </div>
              <span className="text-lg font-black" style={{ color: color.text }}>{group.length}</span>
            </motion.div>
          );
        })}
      </div>

      <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 shadow-sm">
        Tổng cộng: {total} {itemsLabel}
      </div>
    </div>
  );
}
