import { Link } from "expo-router";
import { ScrollView, Text, View, RefreshControl } from "react-native";
import { useCollection } from "../../hooks/useCollection";
import type { AlertaStock, Cliente, Factura, OrdenTrabajo } from "../../lib/types";
import { buildMap, formatFecha, formatMoney } from "../../lib/format";
import {
  contarPorEstado,
  facturadoDelMes,
  facturasSinCobrar,
  ordenesActivas,
  ordenesRecientes,
  totalSinCobrar,
} from "../../lib/resumen";
import { Card } from "../../components/ui/Card";
import { EstadoBadge } from "../../components/ui/EstadoBadge";
import { Spinner } from "../../components/ui/Spinner";
import { EmptyState } from "../../components/ui/EmptyState";
import { ClipboardList } from "lucide-react-native";

function StatCard({ label, value, hint, tone = "neutral", href }: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "neutral" | "primary" | "accent";
  href?: string;
}) {
  const toneClass = tone === "primary" ? "text-primary" : tone === "accent" ? "text-accent" : "text-fg";
  const content = (
    <View className="flex-1 min-w-[150px]">
      <Text className="text-xs font-medium text-muted">{label}</Text>
      <Text className={`text-2xl font-semibold leading-none mt-1 ${toneClass}`}>{value}</Text>
      {hint && <Text className="text-xs leading-5 text-subtle">{hint}</Text>}
    </View>
  );

  if (href) {
    return <Link href={href as never} className="flex-1 min-w-[150px]">{content}</Link>;
  }

  return <View className="flex-1 min-w-[150px]">{content}</View>;
}

export default function DashboardScreen() {
  const ordenes = useCollection<OrdenTrabajo>("/api/ordenes", "Error cargando órdenes");
  const facturas = useCollection<Factura>("/api/facturas", "Error cargando facturas");
  const alertas = useCollection<AlertaStock>("/api/alertas/stock", "Error cargando alertas");
  const clientes = useCollection<Cliente>("/api/clientes", "Error cargando clientes");

  const loading = ordenes.loading || facturas.loading || alertas.loading || clientes.loading;
  const estados = contarPorEstado(ordenes.items);
  const activas = ordenesActivas(ordenes.items).length;
  const sinCobrar = facturasSinCobrar(facturas.items);
  const recientes = ordenesRecientes(ordenes.items, 8);
  const clienteMap = buildMap(clientes.items);
  const sinMovimiento = ordenes.items.length === 0 && facturas.items.length === 0;

  if (loading && ordenes.items.length === 0) return <Spinner text="Cargando dashboard..." />;

  if (sinMovimiento) {
    return (
      <ScrollView className="flex-1 bg-canvas" contentContainerStyle={{ padding: 16 }}>
        <Card className="p-4">
          <EmptyState
            icon={ClipboardList}
            title="Todavía no hay movimiento"
            description="Cargá un cliente y abrí la primera orden de trabajo: acá vas a ver el estado del taller, el stock crítico y lo facturado."
            action={<Link href="/clientes" asChild><Text className="text-primary font-semibold">Ir a clientes</Text></Link>}
          />
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-canvas"
      refreshControl={<RefreshControl refreshing={loading} onRefresh={async () => { await Promise.all([ordenes.refresh(), facturas.refresh(), alertas.refresh(), clientes.refresh()]); }} />}
      contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
    >
      <View className="gap-4">
        <View className="flex-row flex-wrap gap-3">
          <Card className="flex-1 min-w-[150px] p-4">
            <StatCard label="Órdenes activas" value={activas} tone="primary" hint={activas === 0 ? "No queda nada pendiente en el taller" : `${estados.en_progreso ?? 0} en progreso`} />
          </Card>
          <Card className="flex-1 min-w-[150px] p-4">
            <StatCard label="Stock crítico" value={alertas.items.length} tone={alertas.items.length > 0 ? "accent" : "neutral"} href="/alertas" hint={alertas.items.length > 0 ? "Repuestos en el mínimo o por debajo" : "Todo el stock está sobre el mínimo"} />
          </Card>
          <Card className="flex-1 min-w-[150px] p-4">
            <StatCard label="Facturado este mes" value={formatMoney(facturadoDelMes(facturas.items))} href="/facturas" hint="Sin contar las facturas canceladas" />
          </Card>
          <Card className="flex-1 min-w-[150px] p-4">
            <StatCard label="Facturado sin cobrar" value={formatMoney(totalSinCobrar(facturas.items))} tone={sinCobrar.length > 0 ? "accent" : "neutral"} href="/facturas" hint={`${sinCobrar.length} factura${sinCobrar.length === 1 ? "" : "s"} pendiente${sinCobrar.length === 1 ? "" : "s"}`} />
          </Card>
        </View>

        <View className="flex-row flex-wrap gap-4">
          <Card className="flex-1 min-w-[320px] overflow-hidden">
            <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
              <Text className="text-base font-semibold text-fg">Últimas órdenes</Text>
              <Link href="/ordenes" asChild><Text className="text-sm font-medium text-primary">Ver todas</Text></Link>
            </View>
            {recientes.length === 0 ? (
              <Text className="text-center text-muted py-10">No hay órdenes cargadas.</Text>
            ) : recientes.map((orden) => (
              <View key={orden.id} className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
                <View className="flex-1 min-w-0">
                  <Text className="font-medium text-fg" numberOfLines={1}>{orden.descripcion}</Text>
                  <Text className="text-xs text-muted" numberOfLines={1}>{clienteMap.get(orden.cliente_id)?.nombre ?? "Sin cliente"} · {formatFecha(orden.fecha_recibido)}</Text>
                </View>
                <EstadoBadge estado={orden.estado} />
                <Text className="w-24 text-right text-sm text-muted">{formatMoney(orden.total_mano_obra)}</Text>
              </View>
            ))}
          </Card>

          <Card className="flex-1 min-w-[280px] overflow-hidden">
            <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
              <Text className="text-base font-semibold text-fg">Repuestos bajo mínimo</Text>
              <Link href="/alertas" asChild><Text className="text-sm font-medium text-primary">Ver todo</Text></Link>
            </View>
            {alertas.items.length === 0 ? (
              <Text className="text-center text-muted py-10">Ningún repuesto está en el mínimo.</Text>
            ) : alertas.items.slice(0, 6).map((alerta) => (
              <View key={alerta.id ?? alerta.repuesto_id ?? alerta.codigo} className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
                <View className="flex-1 min-w-0">
                  <Text className="font-medium text-fg" numberOfLines={1}>{alerta.nombre}</Text>
                  <Text className="text-xs text-subtle" numberOfLines={1}>{alerta.codigo}</Text>
                </View>
                <Text className="font-semibold text-accent">{alerta.stock}</Text>
                <Text className="text-xs text-subtle">de {alerta.stock_minimo} mín.</Text>
              </View>
            ))}
          </Card>
        </View>
      </View>
    </ScrollView>
  );
}
