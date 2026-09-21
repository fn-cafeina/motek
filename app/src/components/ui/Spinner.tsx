import { ActivityIndicator, Text, View } from "react-native";

interface SpinnerProps {
  text?: string;
}

export function Spinner({ text }: SpinnerProps) {
  return (
    <View className="flex-1 items-center justify-center gap-3 py-12">
      <ActivityIndicator size="large" className="text-primary" />
      {text && <Text className="text-sm text-muted">{text}</Text>}
    </View>
  );
}
