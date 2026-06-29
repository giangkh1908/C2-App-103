'use client';

import { VisualProps } from './shared';

export default function ThermometerVisual({ primaryCount, groupsLabel }: VisualProps) {
  const width = 200;
  const height = 300;
  const cx = width / 2;
  const thermometerTop = 30;
  const thermometerBottom = 250;
  const thermometerHeight = thermometerBottom - thermometerTop;
  const bulbRadius = 20;
  const tubeWidth = 12;

  const maxTemp = 50;
  const temp = Math.min(Math.max(primaryCount, 0), maxTemp);
  const fillHeight = (temp / maxTemp) * thermometerHeight;

  let fillColor = '#3498db';
  if (temp >= 37) fillColor = '#e74c3c';
  else if (temp >= 20) fillColor = '#2ecc71';

  return (
    <div className="flex flex-col items-center">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Thermometer body */}
        <rect
          x={cx - tubeWidth / 2}
          y={thermometerTop}
          width={tubeWidth}
          height={thermometerHeight}
          fill="#fff"
          stroke="#333"
          strokeWidth={2}
          rx={tubeWidth / 2}
        />

        {/* Bulb */}
        <circle cx={cx} cy={thermometerBottom + bulbRadius} r={bulbRadius} fill="#fff" stroke="#333" strokeWidth={2} />

        {/* Mercury fill */}
        <rect
          x={cx - tubeWidth / 2 + 2}
          y={thermometerBottom - fillHeight}
          width={tubeWidth - 4}
          height={fillHeight}
          fill={fillColor}
          rx={2}
        />
        <circle cx={cx} cy={thermometerBottom + bulbRadius} r={bulbRadius - 3} fill={fillColor} />

        {/* Temperature markings */}
        {Array.from({ length: maxTemp / 5 + 1 }).map((_, i) => {
          const tempVal = i * 5;
          const y = thermometerBottom - (tempVal / maxTemp) * thermometerHeight;
          return (
            <g key={i}>
              <line
                x1={cx + tubeWidth / 2}
                y1={y}
                x2={cx + tubeWidth / 2 + 10}
                y2={y}
                stroke="#333"
                strokeWidth={1}
              />
              <text
                x={cx + tubeWidth / 2 + 15}
                y={y + 4}
                fontSize={10}
                fill="#333"
              >
                {tempVal}°
              </text>
            </g>
          );
        })}

        {/* Current temperature indicator */}
        <circle cx={cx} cy={thermometerBottom - fillHeight} r={5} fill={fillColor} stroke="#fff" strokeWidth={2} />
      </svg>

      <div className="mt-2 text-center">
        <div className="text-2xl font-bold" style={{ color: fillColor }}>
          {temp}°C
        </div>
        <div className="text-sm text-gray-600">
          {groupsLabel ? `${groupsLabel}: ` : ''}
          {temp < 20 ? 'Lạnh' : temp < 37 ? 'Bình thường' : 'Nóng'}
        </div>
      </div>
    </div>
  );
}
