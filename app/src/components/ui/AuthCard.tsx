import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card } from "./Card";

export function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-canvas">
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-4 py-8"
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <View className="w-full max-w-sm self-center" style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 32 }}>
          <View className="mb-6 items-center">
            <Text className="text-3xl font-bold tracking-tight text-fg">
              Motek<Text className="text-primary">.</Text>
            </Text>
            <Text className="mt-1 text-sm text-muted">Taller especializado en motocicletas</Text>
          </View>
          <Card className="p-6">
            <Text className="mb-6 text-xl font-semibold tracking-tight text-fg">{title}</Text>
            {children}
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
