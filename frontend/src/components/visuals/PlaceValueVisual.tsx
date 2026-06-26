'use client';

import React from 'react';

interface PlaceValueProps {
  primaryCount: number;
  secondaryCount: number;
  totalCount: number;
  groupsLabel?: string;
  itemsLabel?: string;
}

interface BlockProps {
  value: number;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

function PlaceBlock({ value, label, color, bgColor, borderColor }: BlockProps) {
  if (value === 0) return null;

  const blocks = Array.from({ length: Math.min(value, 20) }, (_, i) => i);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex flex-wrap justify-center gap-0.5 max-w-[120px]">
        {blocks.map((i) => (
          <div
            key={i}
            className={`w-5 h-5 rounded-sm ${bgColor} ${borderColor} border`}
            title={label}
          />
        ))}
      </div>
      <span className={`text-xs font-bold ${color}`}>
        {value} {label}
      </span>
    </div>
  );
}

export default function PlaceValueVisual({
  primaryCount,
  secondaryCount,
  totalCount,
}: PlaceValueProps) {
  const num = totalCount || primaryCount * 10 + secondaryCount;
  const thousands = Math.floor(num / 1000);
  const hundreds = Math.floor((num % 1000) / 100);
  const tens = Math.floor((num % 100) / 10);
  const ones = num % 10;

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <span className="text-[11px] font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
        Cấu tạo số: {num.toLocaleString('vi-VN')}
      </span>

      <div className="flex items-end justify-center gap-4">
        <PlaceBlock
          value={thousands}
          label="nghìn"
          color="text-purple-600"
          bgColor="bg-purple-200"
          borderColor="border-purple-300"
        />
        <PlaceBlock
          value={hundreds}
          label="trăm"
          color="text-blue-600"
          bgColor="bg-blue-200"
          borderColor="border-blue-300"
        />
        <PlaceBlock
          value={tens}
          label="chục"
          color="text-green-600"
          bgColor="bg-green-200"
          borderColor="border-green-300"
        />
        <PlaceBlock
          value={ones}
          label="đơn vị"
          color="text-amber-600"
          bgColor="bg-amber-200"
          borderColor="border-amber-300"
        />
      </div>

      <div className="text-sm font-bold text-slate-700">
        {thousands > 0 && <span className="text-purple-600">{thousands}×</span>}
        {hundreds > 0 && <span className="text-blue-600">{hundreds}×100 + </span>}
        {tens > 0 && <span className="text-green-600">{tens}×10 + </span>}
        <span className="text-amber-600">{ones}</span>
        <span className="text-slate-400 ml-2">= {num.toLocaleString('vi-VN')}</span>
      </div>
    </div>
  );
}
