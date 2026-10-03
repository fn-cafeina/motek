import { Pressable, Text, View } from "react-native";

interface FilterChipsProps<T extends string> {
  options: readonly { value: T; label: string }[];
  value: T | "";
  onChange: (value: T | "") => void;
  allLabel?: string;
}

export function FilterChips<T extends string>({ options, value, onChange, allLabel = "Todas" }: FilterChipsProps<T>) {
  return (
    <View className="flex-row flex-wrap gap-2" accessibilityRole="tablist" accessibilityLabel="Filtros de estado">
      <Pressable
        onPress={() => onChange("")}
        accessibilityRole="tab"
        accessibilityState={{ selected: value === "" }}
        className={`rounded-md px-3 py-2 ${value === "" ? "bg-primary-soft" : "bg-raised"}`}
      >
        <Text className={`text-xs font-medium ${value === "" ? "text-primary" : "text-muted"}`}>{allLabel}</Text>
      </Pressable>
      {options.map((option) => (
        <Pressable
          key={option.value}
          onPress={() => onChange(option.value)}
          accessibilityRole="tab"
          accessibilityState={{ selected: value === option.value }}
          className={`rounded-md px-3 py-2 ${value === option.value ? "bg-primary-soft" : "bg-raised"}`}
        >
          <Text className={`text-xs font-medium ${value === option.value ? "text-primary" : "text-muted"}`}>{option.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
