'use client';

import React from 'react';

import type { VisualProps } from './shared';

function bundleColor(index: number): string {
  const colors = [
    'border-amber-300 bg-amber-50',
    'border-orange-300 bg-orange-50',
    'border-yellow-300 bg-yellow-50',
    'border-lime-300 bg-lime-50',
  ];
  return colors[index % colors.length];
}

function Stick({
  tone = 'bg-amber-500',
  faint = false,
}: {
  tone?: string;
  faint?: boolean;
}) {
  return (
    <span
      className={`inline-block h-12 w-1.5 rounded-full ${tone} ${
        faint ? 'opacity-35' : ''
      }`}
    />
  );
}

function StickBundle({ count, label }: { count: number; label: string }) {
  const safeCount = Math.max(0, count);
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-[10px] font-bold uppercase tracking-wide text-amber-700">
        {label}
      </span>
      <div className="flex flex-wrap justify-center gap-2">
        {Array.from({ length: safeCount }, (_, index) => (
          <div
            key={`${label}-${index}`}
            className={`flex h-16 w-9 items-center justify-center rounded-xl border-2 ${bundleColor(index)}`}
          >
            <div className="flex items-center gap-[2px]">
              {Array.from({ length: 10 }, (_, stickIndex) => (
                <Stick key={stickIndex} faint={stickIndex > 7} />
              ))}
            </div>
          </div>
        ))}
        {safeCount === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 px-3 py-5 text-xs text-slate-400">
            0 bó
          </div>
        )}
      </div>
      <span className="text-xs font-semibold text-amber-700">{safeCount} bó 10</span>
    </div>
  );
}

function LooseSticks({ count, label, faded = false }: { count: number; label: string; faded?: boolean }) {
  const safeCount = Math.max(0, count);
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-[10px] font-bold uppercase tracking-wide text-sky-700">
        {label}
      </span>
      <div className="flex min-h-14 flex-wrap justify-center gap-2 rounded-xl border border-sky-100 bg-sky-50/70 px-3 py-3">
        {Array.from({ length: safeCount }, (_, index) => (
          <Stick key={`${label}-${index}`} tone="bg-sky-500" faint={faded} />
        ))}
        {safeCount === 0 && <span className="text-xs text-slate-400">0 que</span>}
      </div>
      <span className="text-xs font-semibold text-sky-700">{safeCount} que rời</span>
    </div>
  );
}

export default function StickBundlesVisual({
  primaryCount,
  secondaryCount,
  totalCount,
  groupsLabel = 'que tính',
  config,
}: VisualProps) {
  const before = Number(config?.before ?? primaryCount ?? 0);
  const change = Number(config?.change ?? secondaryCount ?? 0);
  const result = Number(config?.result ?? totalCount ?? 0);
  const operation = config?.operation === '-' ? '-' : '+';
  const objectName =
    typeof config?.object_name === 'string' ? config.object_name : groupsLabel;
  const showBundles = config?.show_bundles !== false;

  const tensBefore = Number(config?.tens_before ?? Math.floor(before / 10));
  const onesBefore = Number(config?.ones_before ?? before % 10);
  const tensAfter = Number(config?.tens_after ?? Math.floor(result / 10));
  const onesAfter = Number(config?.ones_after ?? result % 10);
  const tensChange = Math.floor(change / 10);
  const onesChange = change % 10;

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700">
        Que tính: {before} {operation} {change} = {result}
      </span>

      <div className="grid w-full gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <div className="mb-2 text-center text-xs font-bold text-slate-500">Trước</div>
          <div className="flex flex-col gap-3">
            {showBundles && <StickBundle count={tensBefore} label="Bó chục" />}
            <LooseSticks count={onesBefore} label="Đơn vị" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 text-center text-xs font-bold text-slate-500">
            {operation === '+' ? 'Thêm vào' : 'Bớt đi'}
          </div>
          <div className="flex flex-col gap-3">
            {showBundles && <StickBundle count={tensChange} label="Bó thay đổi" />}
            <LooseSticks
              count={onesChange}
              label="Que thay đổi"
              faded={operation === '-'}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3">
          <div className="mb-2 text-center text-xs font-bold text-emerald-700">Kết quả</div>
          <div className="flex flex-col gap-3">
            {showBundles && <StickBundle count={tensAfter} label="Bó chục mới" />}
            <LooseSticks count={onesAfter} label="Đơn vị mới" />
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-slate-50 px-4 py-2 text-center text-xs text-slate-600">
        Minh họa phép tính bằng {objectName}: tách bó 10 và que rời để học sinh nhìn rõ
        thao tác {operation === '+' ? 'thêm vào' : 'bớt đi'}.
      </div>
    </div>
  );
}
