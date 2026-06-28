'use client';

import React from 'react';

import type { VisualProps } from './shared';

interface TreeNode {
  id: string;
  label: string;
  type: 'number' | 'operator';
  x: number;
  y: number;
  children?: string[];
}

export default function ExpressionTreeVisual({
  primaryCount,
  secondaryCount,
  totalCount,
  groupsLabel = '+',
  itemsLabel,
}: VisualProps) {
  const left = primaryCount;
  const right = secondaryCount;
  const op = groupsLabel || '+';

  const result = (() => {
    switch (op) {
      case '+': return left + right;
      case '-': return left - right;
      case '*': return left * right;
      case '/': return right !== 0 ? Math.round((left / right) * 100) / 100 : '∞';
      default: return left + right;
    }
  })();

  const total = typeof result === 'number' ? result : totalCount;
  const displayResult = typeof result === 'number' ? result : result;

  const treeNodes: Record<string, TreeNode> = {
    root: {
      id: 'root',
      label: op,
      type: 'operator',
      x: 150,
      y: 30,
      children: ['left', 'right'],
    },
    left: {
      id: 'left',
      label: String(left),
      type: 'number',
      x: 80,
      y: 100,
    },
    right: {
      id: 'right',
      label: String(right),
      type: 'number',
      x: 220,
      y: 100,
    },
    result: {
      id: 'result',
      label: `= ${displayResult}`,
      type: 'number',
      x: 150,
      y: 170,
    },
  };

  const edges = [
    { from: 'root', to: 'left' },
    { from: 'root', to: 'right' },
    { from: 'root', to: 'result' },
  ];

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <span className="text-[11px] font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
        Cây biểu thức: {left} {op} {right}
      </span>

      <svg viewBox="0 0 300 210" className="w-full max-w-sm">
        {/* Edges */}
        {edges.map((edge, i) => {
          const from = treeNodes[edge.from];
          const to = treeNodes[edge.to];
          const isResultEdge = edge.to === 'result';
          return (
            <line
              key={i}
              x1={from.x}
              y1={from.y + 18}
              x2={to.x}
              y2={to.y - 18}
              stroke={isResultEdge ? '#a78bfa' : '#94a3b8'}
              strokeWidth={isResultEdge ? 2 : 1.5}
              strokeDasharray={isResultEdge ? '6 3' : undefined}
            />
          );
        })}

        {/* Nodes */}
        {Object.values(treeNodes).map((node) => {
          const isOp = node.type === 'operator';
          const isResult = node.id === 'result';

          return (
            <g key={node.id}>
              {isOp ? (
                <rect
                  x={node.x - 18}
                  y={node.y - 18}
                  width="36"
                  height="36"
                  rx="6"
                  fill="#f3e8ff"
                  stroke="#a78bfa"
                  strokeWidth="2"
                />
              ) : (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isResult ? 22 : 18}
                  fill={isResult ? '#ede9fe' : '#eff6ff'}
                  stroke={isResult ? '#8b5cf6' : '#60a5fa'}
                  strokeWidth="2"
                />
              )}
              <text
                x={node.x}
                y={node.y + (isOp ? 1 : 1)}
                textAnchor="middle"
                dominantBaseline="middle"
                className={isOp
                  ? 'fill-purple-700 text-[14px] font-extrabold'
                  : isResult
                    ? 'fill-violet-700 text-[12px] font-bold'
                    : 'fill-blue-700 text-[13px] font-bold'
                }
                fontFamily="sans-serif"
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Operation labels */}
      <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3.5 h-3.5 rounded bg-purple-100 border-2 border-purple-300" />
          Toán tử
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3.5 h-3.5 rounded-full bg-blue-100 border-2 border-blue-300" />
          Số
        </span>
      </div>
    </div>
  );
}
