import { Text, View } from "react-native";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-gray-100 dark:bg-gray-800",
  success: "bg-green-100 dark:bg-green-900",
  warning: "bg-yellow-100 dark:bg-yellow-900",
  danger: "bg-red-100 dark:bg-red-900",
  info: "bg-blue-100 dark:bg-blue-900",
};

const dotClasses: Record<BadgeVariant, string> = {
  default: "bg-gray-500",
  success: "bg-green-500",
  warning: "bg-yellow-500",
  danger: "bg-red-500",
  info: "bg-blue-500",
};

const textClasses: Record<BadgeVariant, string> = {
  default: "text-gray-700 dark:text-gray-300",
  success: "text-green-700 dark:text-green-300",
  warning: "text-yellow-700 dark:text-yellow-300",
  danger: "text-red-700 dark:text-red-300",
  info: "text-blue-700 dark:text-blue-300",
};

export function Badge({ label, variant = "default", dot = false }: BadgeProps) {
  return (
    <View className={`flex-row items-center gap-1.5 px-2.5 py-1 rounded-full ${variantClasses[variant]}`}>
      {dot && <View className={`w-1.5 h-1.5 rounded-full ${dotClasses[variant]}`} />}
      <Text className={`text-xs font-medium ${textClasses[variant]}`}>{label}</Text>
    </View>
  );
}
