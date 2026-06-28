'use client';

import React from 'react';
import { VisualProps } from './shared';

export default function VolumeCubesVisual({ primaryCount, secondaryCount, totalCount, groupsLabel, itemsLabel }: VisualProps) {
  const cubeSize = 25;
  const rows = Math.min(primaryCount, 5);
  const cols = Math.min(secondaryCount, 5);
  const height = Math.min(totalCount, 5);

  const offsetX = 50;
  const offsetY = 200;
  const isoAngle = Math.PI / 6;

  const totalCubes = rows * cols * height;

  const cubes: React.JSX.Element[] = [];

  for (let h = 0; h < height; h++) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = offsetX + c * cubeSize + h * cubeSize * Math.cos(isoAngle);
        const y = offsetY - r * cubeSize * 0.5 - h * cubeSize * 0.5;

        cubes.push(
          <g key={`${h}-${r}-${c}`} transform={`translate(${x}, ${y})`}>
            {/* Top face */}
            <polygon
              points={`0,0 ${cubeSize},0 ${cubeSize + cubeSize * Math.cos(isoAngle)},${-cubeSize * Math.sin(isoAngle)} ${cubeSize * Math.cos(isoAngle)},${-cubeSize * Math.sin(isoAngle)}`}
              fill="#5dade2"
              stroke="#2980b9"
              strokeWidth={1}
            />
            {/* Front face */}
            <polygon
              points={`0,0 ${cubeSize},0 ${cubeSize},${cubeSize} 0,${cubeSize}`}
              fill="#3498db"
              stroke="#2471a3"
              strokeWidth={1}
            />
            {/* Right face */}
            <polygon
              points={`${cubeSize},0 ${cubeSize + cubeSize * Math.cos(isoAngle)},${-cubeSize * Math.sin(isoAngle)} ${cubeSize + cubeSize * Math.cos(isoAngle)},${cubeSize - cubeSize * Math.sin(isoAngle)} ${cubeSize},${cubeSize}`}
              fill="#2e86c1"
              stroke="#1f618d"
              strokeWidth={1}
            />
          </g>
        );
      }
    }
  }

  return (
    <div className="flex flex-col items-center">
      <svg width={350} height={250} viewBox="0 0 350 250">
        {cubes}
      </svg>

      <div className="mt-4 text-center">
        <div className="text-lg font-bold text-blue-700">
          {primaryCount} x {secondaryCount} x {totalCount} = {totalCubes} khối
        </div>
        <div className="text-sm text-gray-600">
          {groupsLabel ? `${groupsLabel}: ` : ''}
          Công thức: D x R x C = {totalCubes}
        </div>
      </div>
    </div>
  );
}
