import { AlertTriangle, CheckCircle2, Info, OctagonAlert } from "lucide-react-native";
import { Text, View } from "react-native";

type AlertVariant = "danger" | "warning" | "info" | "success";

interface AlertProps {
  variant?: AlertVariant;
  message: string;
}

const variantConfig: Record<AlertVariant, { bg: string; border: string; text: string; icon: typeof AlertTriangle }> = {
  danger: { bg: "bg-danger-soft", border: "border-danger", text: "text-danger", icon: OctagonAlert },
  warning: { bg: "bg-accent-soft", border: "border-accent", text: "text-accent", icon: AlertTriangle },
  info: { bg: "bg-info-soft", border: "border-info", text: "text-info", icon: Info },
  success: { bg: "bg-ok-soft", border: "border-ok", text: "text-ok", icon: CheckCircle2 },
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
