'use client';

import React from 'react';
import { motion } from 'motion/react';

import { getConfigNumber, getConfigNumberArray, getConfigString, VisualProps } from './shared';

const DEFAULT_DENOMINATIONS = [1000, 2000, 5000, 10000];
const NOTE_COLORS: Record<number, string> = {
  1000: 'from-emerald-300 to-emerald-500',
  2000: 'from-amber-300 to-amber-500',
  5000: 'from-sky-300 to-sky-500',
  10000: 'from-fuchsia-300 to-fuchsia-500',
  20000: 'from-rose-300 to-rose-500',
  50000: 'from-cyan-300 to-cyan-500',
  100000: 'from-orange-300 to-orange-500',
  200000: 'from-lime-300 to-lime-500',
  500000: 'from-violet-300 to-violet-500',
};

export default function MoneyVisual({ primaryCount, config }: VisualProps) {
  const denominations = getConfigNumberArray(config, 'denominations') ?? DEFAULT_DENOMINATIONS.slice(0, Math.max(1, primaryCount));
  const totalValue = getConfigNumber(config, 'total_value') ?? denominations.reduce((sum, value) => sum + value, 0);
  const currency = getConfigString(config, 'currency') ?? 'đồng';

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-4">
      <span className="rounded-full border-2 border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-bold text-emerald-700">
        Tiền Việt Nam
      </span>
      <div className="flex flex-wrap justify-center gap-3 rounded-3xl border-2 border-emerald-200 bg-white p-4 shadow-sm">
        {denominations.map((value, index) => (
          <motion.div
            key={`${value}-${index}`}
            initial={{ y: 12, opacity: 0, rotate: -2 }}
            animate={{ y: 0, opacity: 1, rotate: index % 2 === 0 ? -2 : 2 }}
            transition={{ delay: index * 0.06 }}
            className={`relative flex h-20 w-36 flex-col justify-between rounded-2xl border-2 border-emerald-700 bg-gradient-to-r p-3 text-white shadow-sm ${NOTE_COLORS[value] ?? 'from-emerald-300 to-emerald-500'}`}
          >
            <span className="text-xs font-bold opacity-90">Ngân hàng Nhà nước</span>
            <span className="text-xl font-black">{value.toLocaleString('vi-VN')}đ</span>
            <span className="self-end text-xs font-semibold opacity-90">VNĐ</span>
          </motion.div>
        ))}
      </div>
      <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 px-5 py-3 text-center shadow-sm">
        <div className="text-lg font-black text-amber-700">Tổng cộng: {totalValue.toLocaleString('vi-VN')} {currency}</div>
        <div className="mt-1 text-sm font-medium text-slate-600">Có {denominations.length} tờ tiền trong hình.</div>
      </div>
    </div>
  );
}
