import { Text, View, ScrollView, RefreshControl } from "react-native";
import { useCollection } from "../../hooks/useCollection";
import type { OrdenTrabajo, Factura, AlertaStock } from "../../lib/types";
import { formatMoney } from "../../lib/format";
import { Card } from "../../components/ui/Card";
import { EstadoBadge } from "../../components/ui/EstadoBadge";
import { Spinner } from "../../components/ui/Spinner";
import { EmptyState } from "../../components/ui/EmptyState";
import { ClipboardList } from "lucide-react-native";

export default function DashboardScreen() {
  const ordenes = useCollection<OrdenTrabajo>("/api/ordenes", "Error cargando órdenes");
  const facturas = useCollection<Factura>("/api/facturas", "Error cargando facturas");
  const alertas = useCollection<AlertaStock>("/api/alertas/stock", "Error cargando alertas");

  const loading = ordenes.loading || facturas.loading || alertas.loading;
  const refreshing = loading;

  const ordenesActivas = ordenes.items.filter((o) => o.estado === "recibida" || o.estado === "en_progreso");
  const facturasPendientes = facturas.items.filter((f) => f.estado !== "pagada" && f.estado !== "cancelada");
  const totalPendiente = facturasPendientes.reduce((acc, f) => acc + (f.total - f.pagado), 0);

  if (loading && ordenes.items.length === 0) {
    return <Spinner text="Cargando dashboard..." />;
  }

  return (
    <ScrollView
      className="flex-1 bg-canvas"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { await Promise.all([ordenes.refresh(), facturas.refresh(), alertas.refresh()]); }} />}
    >
      <View className="p-4 gap-4">
        <Text className="text-2xl font-bold text-fg">Inicio</Text>

        <View className="flex-row flex-wrap gap-3">
          <Card className="flex-1 min-w-[150px] p-4">
            <Text className="text-sm text-muted">Órdenes activas</Text>
            <Text className="text-2xl font-bold text-fg mt-1">{ordenesActivas.length}</Text>
          </Card>
          <Card className="flex-1 min-w-[150px] p-4">
            <Text className="text-sm text-muted">Stock bajo</Text>
            <Text className="text-2xl font-bold text-danger mt-1">{alertas.items.length}</Text>
          </Card>
          <Card className="flex-1 min-w-[150px] p-4">
            <Text className="text-sm text-muted">Pendiente cobro</Text>
            <Text className="text-2xl font-bold text-fg mt-1">{formatMoney(totalPendiente)}</Text>
          </Card>
        </View>

        <Card className="p-4">
          <Text className="text-sm font-semibold text-fg mb-3">Órdenes recientes</Text>
          {ordenesActivas.length === 0 ? (
            <EmptyState icon={ClipboardList} title="Sin órdenes activas" description="No hay órdenes en este momento." />
          ) : (
            ordenesActivas.slice(0, 5).map((o) => (
              <View key={o.id} className="flex-row items-center justify-between py-2 border-b border-border last:border-b-0">
                <Text className="text-sm text-fg flex-1" numberOfLines={1}>#{o.id} — {o.descripcion}</Text>
                <EstadoBadge estado={o.estado} />
              </View>
            ))
          )}
        </Card>

        {alertas.items.length > 0 && (
          <Card className="p-4">
            <Text className="text-sm font-semibold text-fg mb-3">Stock bajo</Text>
            {alertas.items.slice(0, 5).map((a) => (
              <View key={a.repuesto_id} className="flex-row items-center justify-between py-2 border-b border-border last:border-b-0">
                <Text className="text-sm text-fg flex-1" numberOfLines={1}>{a.nombre}</Text>
                <Text className="text-sm text-danger font-medium">{a.stock} / {a.stock_minimo}</Text>
              </View>
            ))}
          </Card>
        )}
      </View>
    </ScrollView>
  );
}
