import { useState } from "react";
import { View } from "react-native";
import { G, Line, Rect, Svg, Text as SvgText } from "react-native-svg";

interface BarGroup {
  label: string;
  values: number[];
}

interface BarChartProps {
  data: BarGroup[];
  colors: string[];
  gridColor: string;
  labelColor: string;
  height?: number;
}

export function BarChart({ data, colors, gridColor, labelColor, height = 170 }: BarChartProps) {
  const [width, setWidth] = useState(0);
  const paddingTop = 8;
  const paddingBottom = 22;
  const chartHeight = height - paddingTop - paddingBottom;
  const max = Math.max(1, ...data.flatMap((group) => group.values));
  const groupWidth = width / Math.max(1, data.length);
  const barWidth = Math.min(16, (groupWidth - 12) / Math.max(1, colors.length));
  const barGap = 3;

  return (
    <View
      style={{ height }}
      onLayout={(event) => {
        const nextWidth = event.nativeEvent.layout.width;
        if (nextWidth > 0 && Math.abs(nextWidth - width) > 1) setWidth(nextWidth);
      }}
    >
      {width > 0 && (
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {[0, 0.5, 1].map((fraction) => (
            <Line
              key={fraction}
              x1={0}
              x2={width}
              y1={paddingTop + chartHeight * fraction}
              y2={paddingTop + chartHeight * fraction}
              stroke={gridColor}
              strokeWidth={1}
              strokeDasharray="3 4"
            />
          ))}
          {data.map((group, index) => {
            const groupX = index * groupWidth;
            const barsWidth = colors.length * barWidth + (colors.length - 1) * barGap;
            const startX = groupX + (groupWidth - barsWidth) / 2;
            return (
              <G key={group.label}>
                {group.values.map((value, valueIndex) => {
                  const barHeight = (value / max) * chartHeight;
                  return (
                    <Rect
                      key={valueIndex}
                      x={startX + valueIndex * (barWidth + barGap)}
                      y={paddingTop + chartHeight - barHeight}
                      width={barWidth}
                      height={Math.max(barHeight, value > 0 ? 2 : 0)}
                      rx={3}
                      fill={colors[valueIndex] ?? colors[0]}
                    />
                  );
                })}
                <SvgText x={groupX + groupWidth / 2} y={height - 6} textAnchor="middle" fontSize={9} fill={labelColor}>
                  {group.label}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      )}
    </View>
  );
}
