import { useState } from "react";
import { Pressable, TextInput, View, type TextInputProps } from "react-native";
import { Search, X } from "lucide-react-native";
import { useCSSVariable } from "uniwind";

interface SearchInputProps extends TextInputProps {
  value: string;
  onChangeText?: (text: string) => void;
}

export function SearchInput({ value, onChangeText, placeholder = "Buscar", className = "", onFocus, onBlur, ...props }: SearchInputProps) {
  const [focused, setFocused] = useState(false);
  const subtle = useCSSVariable("--color-subtle") as string;

  return (
    <View className={`flex-row items-center rounded-lg border ${focused ? "border-primary bg-raised/40" : "border-border-strong"} bg-surface ${className}`}>
      <View className="pl-3">
        <Search size={16} className="text-muted" />
      </View>
      <TextInput
        {...props}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={subtle}
        returnKeyType="search"
        accessibilityLabel={placeholder}
        className="flex-1 px-2 py-2.5 text-base text-fg"
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChangeText?.("")}
          accessibilityRole="button"
          accessibilityLabel="Limpiar búsqueda"
          className="p-2.5"
          hitSlop={8}
        >
          <X size={16} className="text-muted" />
        </Pressable>
      )}
    </View>
  );
}
