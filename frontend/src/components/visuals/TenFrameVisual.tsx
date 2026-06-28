'use client';

import React from 'react';
import { motion } from 'motion/react';

import { VisualProps } from './shared';
import { getItemEmoji } from './kidThemeSafe';

function TenFrame({ filled, itemsLabel }: { filled: number; itemsLabel: string }) {
  return (
    <div className="grid grid-cols-5 gap-1.5 rounded-3xl border-2 border-yellow-300 bg-yellow-50 p-3 shadow-sm">
      {Array.from({ length: 10 }, (_, index) => {
        const isFilled = index < filled;
        return (
          <motion.div
            key={index}
            initial={isFilled ? { scale: 0 } : undefined}
            animate={isFilled ? { scale: 1 } : undefined}
            transition={{ delay: index * 0.04, type: 'spring', stiffness: 320 }}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border-2 ${isFilled ? 'border-yellow-400 bg-white text-xl' : 'border-dashed border-yellow-300 bg-white/70'}`}
          >
            {isFilled ? getItemEmoji(itemsLabel, index) : null}
          </motion.div>
        );
      })}
    </div>
  );
}

export default function TenFrameVisual({ totalCount, primaryCount, secondaryCount, itemsLabel = 'vật', groupsLabel }: VisualProps) {
  const total = totalCount || primaryCount + secondaryCount;
  const fullFrames = Math.floor(total / 10);
  const remainder = total % 10;
  const frames = Array.from({ length: fullFrames }, () => 10);
  if (remainder > 0 || frames.length === 0) {
    frames.push(remainder);
  }

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <motion.div initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-full border-2 border-orange-200 bg-orange-50 px-4 py-2 text-sm font-bold text-orange-700">
        Khung 10 - Tổng: {total}
      </motion.div>
      <div className="flex flex-wrap justify-center gap-4">
        {frames.map((filled, index) => (
          <div key={index} className="flex flex-col items-center gap-2">
            <TenFrame filled={filled} itemsLabel={itemsLabel} />
            <span className="text-sm font-black text-orange-700">{filled}</span>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border-2 border-violet-200 bg-violet-50 px-4 py-2 text-base font-black text-violet-700 shadow-sm">
        {groupsLabel ? `${groupsLabel}: ` : ''}{primaryCount} + {secondaryCount} = {total}
      </div>
    </div>
  );
}
