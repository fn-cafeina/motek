import { Pressable } from "react-native";
import type { OrdenEstado, FacturaEstado } from "../../lib/types";
import { Badge } from "./Badge";

const estadoBadge: Record<string, { variant: "default" | "success" | "warning" | "danger" | "info"; label: string }> = {
  recibido: { variant: "info", label: "Recibido" },
  en_progreso: { variant: "warning", label: "En progreso" },
  esperando_repuestos: { variant: "warning", label: "Esperando repuestos" },
  terminado: { variant: "success", label: "Terminado" },
  entregado: { variant: "success", label: "Entregado" },
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
