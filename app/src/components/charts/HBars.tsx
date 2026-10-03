import { Text, View } from "react-native";

interface HBarDatum {
  label: string;
  sublabel?: string;
  value: number;
}

interface HBarsProps {
  data: HBarDatum[];
  color: string;
  formatValue?: (value: number) => string;
}

export function HBars({ data, color, formatValue }: HBarsProps) {
  const max = Math.max(1, ...data.map((item) => item.value));

  return (
    <View className="gap-3">
      {data.map((item) => (
        <View key={item.label} className="gap-1">
          <View className="flex-row items-center justify-between gap-3">
            <Text className="flex-1 text-sm text-fg" numberOfLines={1}>{item.label}</Text>
            <Text className="text-xs font-semibold text-muted">{formatValue ? formatValue(item.value) : item.value}</Text>
          </View>
          <View className="h-2 overflow-hidden rounded-full bg-raised">
            <View className="h-full rounded-full" style={{ width: `${Math.max(4, (item.value / max) * 100)}%`, backgroundColor: color }} />
          </View>
          {item.sublabel ? <Text className="text-xs text-subtle">{item.sublabel}</Text> : null}
        </View>
      ))}
    </View>
  );
}
