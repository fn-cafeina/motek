import { ActivityIndicator, Text, View } from "react-native";

interface SpinnerProps {
  text?: string;
}

export function Spinner({ text }: SpinnerProps) {
  return (
    <View className="flex-1 items-center justify-center gap-3 py-12">
      <ActivityIndicator size="large" className="text-blue-600" />
      {text && <Text className="text-sm text-gray-500 dark:text-gray-400">{text}</Text>}
    </View>
  );
}
