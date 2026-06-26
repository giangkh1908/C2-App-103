'use client';

import { VisualProps } from './shared';

export default function MoneyVisual({ primaryCount, secondaryCount, totalCount, groupsLabel, itemsLabel }: VisualProps) {
  const totalValue = primaryCount * 1000;
  const notesPerRow = 5;
  const rows = Math.ceil(primaryCount / notesPerRow);

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-wrap justify-center gap-1 mb-4">
        {Array.from({ length: primaryCount }).map((_, i) => (
          <div
            key={i}
            className="relative w-16 h-8 bg-gradient-to-r from-green-400 to-green-600 rounded border border-green-700 flex items-center justify-center"
            style={{
              transform: `rotate(${(i % 3 - 1) * 2}deg)`,
              marginTop: i >= notesPerRow ? -4 : 0,
            }}
          >
            <span className="text-white text-xs font-bold">1000đ</span>
          </div>
        ))}
      </div>

      <div className="bg-yellow-100 p-4 rounded-lg border-2 border-yellow-400">
        <div className="text-center">
          <div className="text-lg font-bold text-green-700">
            {primaryCount} x 1000đ = {totalValue.toLocaleString()}đ
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {groupsLabel ? `${groupsLabel}: ` : ''}
            Tổng cộng {totalValue.toLocaleString()} đồng
          </div>
        </div>
      </div>
    </div>
  );
}
