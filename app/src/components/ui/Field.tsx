import { Text, TextInput, View, type TextInputProps } from "react-native";

interface FieldProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
}

export function Field({ label, error, hint, className = "", ...props }: FieldProps) {
  return (
    <View className={`gap-1.5 ${className}`}>
      <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</Text>
      <TextInput
        className={`bg-white dark:bg-gray-800 border rounded-lg px-3 py-2.5 text-gray-900 dark:text-gray-100 text-base ${error ? "border-red-500" : "border-gray-300 dark:border-gray-700"}`}
        placeholderTextColor="#9ca3af"
        {...props}
      />
      {error && <Text className="text-xs text-red-600">{error}</Text>}
      {hint && !error && <Text className="text-xs text-gray-500">{hint}</Text>}
    </View>
  );
}
