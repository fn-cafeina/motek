import { Text, TextInput, View, type TextInputProps } from "react-native";

interface FieldProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
}

export function Field({ label, error, hint, className = "", ...props }: FieldProps) {
  return (
    <View className={`gap-1.5 ${className}`}>
      <Text className="text-sm font-medium text-fg">{label}</Text>
      <TextInput
        className={`bg-surface border rounded-lg px-3 py-2.5 text-fg text-base ${error ? "border-danger" : "border-border-strong"}`}
        placeholderTextColor="#9ca3af"
        {...props}
      />
      {error && <Text className="text-xs text-danger">{error}</Text>}
      {hint && !error && <Text className="text-xs text-muted">{hint}</Text>}
    </View>
  );
}
