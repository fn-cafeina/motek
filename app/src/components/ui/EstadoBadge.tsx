import { Pressable } from "react-native";
import type { OrdenEstado, FacturaEstado } from "../../lib/types";
import { Badge } from "./Badge";

const estadoBadge: Record<string, { variant: "default" | "success" | "warning" | "danger" | "info"; label: string }> = {
  recibida: { variant: "info", label: "Recibida" },
  en_progreso: { variant: "warning", label: "En progreso" },
  finalizada: { variant: "success", label: "Finalizada" },
  cancelada: { variant: "danger", label: "Cancelada" },
  pendiente: { variant: "warning", label: "Pendiente" },
  parcial: { variant: "info", label: "Parcial" },
  pagada: { variant: "success", label: "Pagada" },
};

interface EstadoBadgeProps {
  estado: OrdenEstado | FacturaEstado;
  onPress?: () => void;
}

export function EstadoBadge({ estado, onPress }: EstadoBadgeProps) {
  const config = estadoBadge[estado] ?? { variant: "default" as const, label: estado };

  if (onPress) {
    return (
      <Pressable onPress={onPress}>
        <Badge label={config.label} variant={config.variant} dot />
      </Pressable>
    );
  }

  return <Badge label={config.label} variant={config.variant} dot />;
}
