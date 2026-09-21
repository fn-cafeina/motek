import { AlertTriangle, CheckCircle2, Info, OctagonAlert } from "lucide-react-native";
import { Text, View } from "react-native";

type AlertVariant = "danger" | "warning" | "info" | "success";

interface AlertProps {
  variant?: AlertVariant;
  message: string;
}

const variantConfig: Record<AlertVariant, { bg: string; border: string; text: string; icon: typeof AlertTriangle }> = {
  danger: { bg: "bg-red-50 dark:bg-red-950", border: "border-red-300 dark:border-red-800", text: "text-red-800 dark:text-red-200", icon: OctagonAlert },
  warning: { bg: "bg-yellow-50 dark:bg-yellow-950", border: "border-yellow-300 dark:border-yellow-800", text: "text-yellow-800 dark:text-yellow-200", icon: AlertTriangle },
  info: { bg: "bg-blue-50 dark:bg-blue-950", border: "border-blue-300 dark:border-blue-800", text: "text-blue-800 dark:text-blue-200", icon: Info },
  success: { bg: "bg-green-50 dark:bg-green-950", border: "border-green-300 dark:border-green-800", text: "text-green-800 dark:text-green-200", icon: CheckCircle2 },
};

export function Alert({ variant = "info", message }: AlertProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <View className={`flex-row items-start gap-3 p-3 rounded-lg border ${config.bg} ${config.border}`}>
      <Icon size={18} className={config.text} />
      <Text className={`flex-1 text-sm ${config.text}`}>{message}</Text>
    </View>
  );
}
