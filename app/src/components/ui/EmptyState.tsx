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
      <Icon size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
      <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center">{title}</Text>
      {description && (
        <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">{description}</Text>
      )}
      {action && <View className="mt-4">{action}</View>}
    </View>
  );
}
