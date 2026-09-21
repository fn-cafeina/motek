import { Text, View } from "react-native";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-raised",
  success: "bg-ok-soft",
  warning: "bg-accent-soft",
  danger: "bg-danger-soft",
  info: "bg-info-soft",
};

const dotClasses: Record<BadgeVariant, string> = {
  default: "bg-subtle",
  success: "bg-ok",
  warning: "bg-accent",
  danger: "bg-danger",
  info: "bg-info",
};

const textClasses: Record<BadgeVariant, string> = {
  default: "text-fg",
  success: "text-ok",
  warning: "text-accent",
  danger: "text-danger",
  info: "text-info",
};

export function Badge({ label, variant = "default", dot = false }: BadgeProps) {
  return (
    <View className={`flex-row items-center gap-1.5 px-2.5 py-1 rounded-full ${variantClasses[variant]}`}>
      {dot && <View className={`w-1.5 h-1.5 rounded-full ${dotClasses[variant]}`} />}
      <Text className={`text-xs font-medium ${textClasses[variant]}`}>{label}</Text>
    </View>
  );
}
