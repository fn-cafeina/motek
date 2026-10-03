import { AlertTriangle, CheckCircle2, Info, OctagonAlert } from "lucide-react-native";
import { Text, View } from "react-native";
import { Button } from "./Button";

type AlertVariant = "danger" | "warning" | "info" | "success";

interface AlertProps {
  variant?: AlertVariant;
  message: string;
  onRetry?: () => void;
}

const variantConfig: Record<AlertVariant, { bg: string; border: string; text: string; icon: typeof AlertTriangle }> = {
  danger: { bg: "bg-danger-soft", border: "border-danger", text: "text-danger", icon: OctagonAlert },
  warning: { bg: "bg-accent-soft", border: "border-accent", text: "text-accent", icon: AlertTriangle },
  info: { bg: "bg-info-soft", border: "border-info", text: "text-info", icon: Info },
  success: { bg: "bg-ok-soft", border: "border-ok", text: "text-ok", icon: CheckCircle2 },
};

export function Alert({ variant = "info", message, onRetry }: AlertProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <View className={`flex-row items-center gap-3 rounded-lg border p-3 ${config.bg} ${config.border}`}>
      <Icon size={18} className={config.text} />
      <Text className={`flex-1 text-sm ${config.text}`}>{message}</Text>
      {onRetry && (
        <Button size="sm" variant="secondary" onPress={onRetry}>
          Reintentar
        </Button>
      )}
    </View>
  );
}
