import { Circle, G, Svg, Text as SvgText } from "react-native-svg";

interface DonutDatum {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutDatum[];
  trackColor: string;
  centerColor: string;
  centerMuted: string;
  size?: number;
  centerLabel?: string;
}

export function DonutChart({ data, trackColor, centerColor, centerMuted, size = 148, centerLabel = "órdenes" }: DonutChartProps) {
  const stroke = 15;
  const radius = size / 2 - stroke / 2 - 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const fractions = data.map((item) => (total > 0 ? item.value / total : 0));
  const segments = data.map((item, index) => {
    const start = fractions.slice(0, index).reduce((sum, fraction) => sum + fraction, 0);
    return {
      label: item.label,
      color: item.color,
      fraction: fractions[index],
      dash: fractions[index] * circumference,
      offset: -start * circumference,
    };
  });

  return (
    <Svg width={size} height={size}>
      <G rotation={-90} originX={size / 2} originY={size / 2}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={stroke} fill="none" />
        {segments.map((segment) => {
          if (segment.fraction <= 0) return null;
          return (
            <Circle
              key={segment.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={segment.color}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={`${segment.dash} ${circumference - segment.dash}`}
              strokeDashoffset={segment.offset}
            />
          );
        })}
      </G>
      <SvgText x={size / 2} y={size / 2 + 2} textAnchor="middle" fontSize={26} fontWeight="bold" fill={centerColor}>
        {total}
      </SvgText>
      <SvgText x={size / 2} y={size / 2 + 16} textAnchor="middle" fontSize={9} fill={centerMuted}>
        {centerLabel}
      </SvgText>
    </Svg>
  );
}
