import { Text, View } from "react-native";
import { Card } from "./Card";

export function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="flex-1 items-center justify-center bg-canvas px-4 py-8">
      <View className="w-full max-w-sm">
        <View className="mb-6 items-center">
          <Text className="text-3xl font-bold tracking-tight text-fg">Motek</Text>
          <Text className="mt-1 text-sm text-muted">Taller especializado en motocicletas</Text>
        </View>
        <Card className="p-6">
          <Text className="mb-6 text-xl font-semibold tracking-tight text-fg">{title}</Text>
          {children}
        </Card>
      </View>
    </View>
  );
}
