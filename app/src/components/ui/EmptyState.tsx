import { View, Text } from "react-native";
import type { LucideIcon } from "lucide-react-native";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center py-16 px-6">
      <Icon size={48} className="text-subtle mb-4" />
      <Text className="text-lg font-semibold text-fg text-center">{title}</Text>
      {description && (
        <Text className="text-sm text-muted text-center mt-2">{description}</Text>
      )}
      {action && <View className="mt-4">{action}</View>}
    </View>
  );
}
