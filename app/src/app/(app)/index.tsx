import { useCallback, useEffect, useState } from "react";
import { Link } from "expo-router";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useCSSVariable } from "uniwind";
import { ClipboardList, Wrench } from "lucide-react-native";
import { useCollection } from "../../hooks/useCollection";
import { useBreakpoint } from "../../lib/breakpoints";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { buildMap, formatFecha, formatMoney } from "../../lib/format";
import { contarPorEstado, facturadoDelMes, ordenesActivas, ordenesRecientes } from "../../lib/resumen";
import { ORDEN_ESTADO_LABELS } from "../../lib/types";
import type { AlertaStock, Cliente, Factura, OrdenEstado, OrdenTrabajo, ResumenTablero } from "../../lib/types";
import { Card } from "../../components/ui/Card";
import { EstadoBadge } from "../../components/ui/EstadoBadge";
import { EmptyState } from "../../components/ui/EmptyState";
import { Spinner } from "../../components/ui/Spinner";
import { BarChart } from "../../components/charts/BarChart";
import { DonutChart } from "../../components/charts/DonutChart";
import { HBars } from "../../components/charts/HBars";

const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function mesCorto(mes: string): string {
  const month = Number(mes.slice(5, 7));
  return MESES_CORTOS[month - 1] ?? mes;
}

function StatCard({ label, value, hint, tone = "neutral", href }: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "neutral" | "primary" | "accent";
  href?: string;
}) {
  const toneClass = tone === "primary" ? "text-primary" : tone === "accent" ? "text-accent" : "text-fg";
  const content = (
    <View className="flex-1">
      <Text className="text-xs font-medium text-muted">{label}</Text>
      <Text className={`text-2xl font-semibold leading-none mt-1 ${toneClass}`}>{value}</Text>
      {hint && <Text className="text-xs leading-5 text-subtle">{hint}</Text>}
    </View>
  );

  if (href) {
    return <Link href={href as never} className="flex-1">{content}</Link>;
  }

  return <View className="flex-1">{content}</View>;
}

function useResumenTablero(activo: boolean) {
  const [resumen, setResumen] = useState<ResumenTablero | null>(null);

  const cargar = useCallback(async () => {
    if (!activo) return;
    try {
      setResumen(await api<ResumenTablero>("/api/reportes/tablero"));
    } catch {
      // el tablero sigue funcionando con las colecciones basicas
    }
  }, [activo]);

  useEffect(() => {
    void Promise.resolve().then(cargar);
  }, [cargar]);

  return { resumen, cargar };
}

function PanelGeneral() {
  const ordenes = useCollection<OrdenTrabajo>("/api/ordenes", "Error cargando órdenes");
  const facturas = useCollection<Factura>("/api/facturas", "Error cargando facturas");
  const alertas = useCollection<AlertaStock>("/api/alertas/stock", "Error cargando alertas");
  const clientes = useCollection<Cliente>("/api/clientes", "Error cargando clientes");
  const { resumen, cargar: cargarResumen } = useResumenTablero(true);

  const { lg } = useBreakpoint();
  const primary = useCSSVariable("--color-primary") as string;
  const ok = useCSSVariable("--color-ok") as string;
  const accent = useCSSVariable("--color-accent") as string;
  const info = useCSSVariable("--color-info") as string;
  const subtle = useCSSVariable("--color-subtle") as string;
  const border = useCSSVariable("--color-border") as string;
  const muted = useCSSVariable("--color-muted") as string;
  const fg = useCSSVariable("--color-fg") as string;

  const loading = ordenes.loading || facturas.loading || alertas.loading || clientes.loading;
  const estados = contarPorEstado(ordenes.items);
  const activas = ordenesActivas(ordenes.items).length;
  const recientes = ordenesRecientes(ordenes.items, 8);
  const clienteMap = buildMap(clientes.items);
  const sinMovimiento = ordenes.items.length === 0 && facturas.items.length === 0;

  const saldo = resumen?.saldo_por_cobrar ?? 0;
  const sinCobrar = resumen?.facturas_sin_cobrar ?? 0;

  const meses = Array.from(new Set([
    ...(resumen?.facturacion_mensual.map((serie) => serie.mes) ?? []),
    ...(resumen?.ingresos_mensuales.map((serie) => serie.mes) ?? []),
  ])).sort();
  const facturadoPorMes = new Map((resumen?.facturacion_mensual ?? []).map((serie) => [serie.mes, serie.total]));
  const cobradoPorMes = new Map((resumen?.ingresos_mensuales ?? []).map((serie) => [serie.mes, serie.total]));
  const barras = meses.map((mes) => ({
    label: mesCorto(mes),
    values: [facturadoPorMes.get(mes) ?? 0, cobradoPorMes.get(mes) ?? 0],
  }));

  const colorPorEstado: Record<OrdenEstado, string> = {
    recibido: subtle,
    en_progreso: primary,
    esperando_repuestos: accent,
    terminado: info,
    entregado: ok,
  };
  const donut = (resumen?.ordenes_por_estado ?? []).map((conteo) => ({
    label: ORDEN_ESTADO_LABELS[conteo.estado] ?? conteo.estado,
    value: conteo.cantidad,
    color: colorPorEstado[conteo.estado] ?? subtle,
  }));
  const ranking = resumen?.ranking_tecnicos ?? [];
  const topRepuestos = resumen?.top_repuestos ?? [];

  if (loading && ordenes.items.length === 0) return <Spinner text="Cargando dashboard..." />;

  if (sinMovimiento) {
    return (
      <ScrollView className="flex-1 bg-canvas" contentContainerStyle={{ paddingTop: 16 }}>
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
      refreshControl={<RefreshControl refreshing={loading} onRefresh={async () => { await Promise.all([ordenes.refresh(), facturas.refresh(), alertas.refresh(), clientes.refresh(), cargarResumen()]); }} />}
      contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
    >
      <View className="gap-4">
        <View className="flex-row flex-wrap gap-2">
          <Card className="flex-1 min-w-[132px] p-4">
            <StatCard label="Órdenes activas" value={activas} tone="primary" hint={activas === 0 ? "No queda nada pendiente en el taller" : `${estados.en_progreso ?? 0} en progreso`} />
          </Card>
          <Card className="flex-1 min-w-[132px] p-4">
            <StatCard label="Stock crítico" value={alertas.items.length} tone={alertas.items.length > 0 ? "accent" : "neutral"} href="/alertas" hint={alertas.items.length > 0 ? "Repuestos en el mínimo o por debajo" : "Todo el stock está sobre el mínimo"} />
          </Card>
          <Card className="flex-1 min-w-[132px] p-4">
            <StatCard label="Facturado este mes" value={formatMoney(facturadoDelMes(facturas.items))} href="/facturas" hint="Sin contar las facturas canceladas" />
          </Card>
          <Card className="flex-1 min-w-[132px] p-4">
            <StatCard label="Saldo por cobrar" value={formatMoney(saldo)} tone={sinCobrar > 0 ? "accent" : "neutral"} href="/facturas" hint={sinCobrar > 0 ? `${sinCobrar} factura${sinCobrar === 1 ? "" : "s"} con saldo` : "Todas las facturas están cobradas"} />
          </Card>
        </View>

        <Card className="p-4">
          <View className="mb-3 flex-row flex-wrap items-center justify-between gap-2">
            <Text className="text-base font-semibold text-fg">Facturación de los últimos 6 meses</Text>
            <View className="flex-row items-center gap-3">
              <View className="flex-row items-center gap-1.5"><View className="size-2 rounded-full" style={{ backgroundColor: primary }} /><Text className="text-xs text-muted">Facturado</Text></View>
              <View className="flex-row items-center gap-1.5"><View className="size-2 rounded-full" style={{ backgroundColor: ok }} /><Text className="text-xs text-muted">Cobrado</Text></View>
            </View>
          </View>
          {barras.length === 0 ? (
            <Text className="py-10 text-center text-muted">Todavía no hay facturación registrada.</Text>
          ) : (
            <BarChart data={barras} colors={[primary, ok]} gridColor={border} labelColor={muted} />
          )}
        </Card>

        <View className="flex-row flex-wrap gap-4">
          <Card className="flex-1 min-w-[300px] p-4">
            <Text className="mb-3 text-base font-semibold text-fg">Órdenes por estado</Text>
            {donut.length === 0 ? (
              <Text className="py-10 text-center text-muted">Sin órdenes todavía.</Text>
            ) : (
              <View className="flex-row flex-wrap items-center gap-5">
                <DonutChart data={donut} trackColor={border} centerColor={fg} centerMuted={muted} size={lg ? 176 : 148} />
                <View className="flex-1 gap-2 min-w-[132px]">
                  {donut.map((item) => (
                    <View key={item.label} className="flex-row items-center gap-2">
                      <View className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <Text className="flex-1 text-sm text-muted">{item.label}</Text>
                      <Text className="text-sm font-semibold text-fg">{item.value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </Card>

          <Card className="flex-1 min-w-[300px] p-4">
            <Text className="mb-3 text-base font-semibold text-fg">Top repuestos</Text>
            {topRepuestos.length === 0 ? (
              <Text className="py-10 text-center text-muted">Todavía no se consumieron repuestos.</Text>
            ) : (
              <HBars
                data={topRepuestos.map((repuesto) => ({
                  label: repuesto.nombre,
                  sublabel: `${repuesto.codigo} · ${repuesto.unidades} unidad${repuesto.unidades === 1 ? "" : "es"}`,
                  value: repuesto.monto,
                }))}
                color={primary}
                formatValue={formatMoney}
              />
            )}
          </Card>
        </View>

        <Card className="overflow-hidden">
          <View className="border-b border-border px-4 py-3">
            <Text className="text-base font-semibold text-fg">Ranking de técnicos</Text>
          </View>
          {ranking.length === 0 ? (
            <Text className="py-10 text-center text-muted">No hay técnicos registrados.</Text>
          ) : ranking.map((tecnico, index) => (
            <View key={tecnico.id} className={`flex-row items-center gap-3 border-b border-border px-4 py-3 ${index === 0 ? "bg-primary-soft" : ""}`}>
              <View className={`size-7 items-center justify-center rounded-full ${index === 0 ? "bg-primary" : "bg-raised"}`}>
                <Text className={`text-xs font-bold ${index === 0 ? "text-primary-fg" : "text-muted"}`}>{index + 1}</Text>
              </View>
              <View className="flex-1 min-w-0">
                <Text className="font-medium text-fg" numberOfLines={1}>{tecnico.nombre || "Sin nombre"}</Text>
                <Text className="text-xs text-muted">{tecnico.ordenes} orden{tecnico.ordenes === 1 ? "" : "es"} asignada{tecnico.ordenes === 1 ? "" : "s"}</Text>
              </View>
              <Text className="text-sm font-semibold text-fg">{formatMoney(tecnico.facturado)}</Text>
            </View>
          ))}
        </Card>

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

function PanelTaller() {
  const { user } = useAuth();
  const ordenes = useCollection<OrdenTrabajo>("/api/ordenes", "Error cargando órdenes");
  const alertas = useCollection<AlertaStock>("/api/alertas/stock", "Error cargando alertas");
  const clientes = useCollection<Cliente>("/api/clientes", "Error cargando clientes");
  const clienteMap = buildMap(clientes.items);

  const loading = ordenes.loading || alertas.loading || clientes.loading;
  const misOrdenes = ordenes.items.filter((orden) => orden.tecnico_id === user?.id);
  const activas = misOrdenes.filter((orden) => orden.estado !== "entregado");
  const enProgreso = misOrdenes.filter((orden) => orden.estado === "en_progreso").length;
  const esperando = misOrdenes.filter((orden) => orden.estado === "esperando_repuestos").length;
  const terminadas = misOrdenes.filter((orden) => orden.estado === "terminado").length;
  const proximas = [...activas].sort((a, b) => a.id - b.id).slice(0, 8);

  if (loading && ordenes.items.length === 0) return <Spinner text="Cargando tu taller..." />;

  return (
    <ScrollView
      className="flex-1 bg-canvas"
      refreshControl={<RefreshControl refreshing={loading} onRefresh={async () => { await Promise.all([ordenes.refresh(), alertas.refresh(), clientes.refresh()]); }} />}
      contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
    >
      <View className="gap-4">
        <View>
          <Text className="text-2xl font-semibold tracking-tight text-fg">Mi taller</Text>
          <Text className="mt-1 text-sm text-muted">{user?.nombre ? `Hola, ${user.nombre}` : "Tus órdenes asignadas"}</Text>
        </View>

        <View className="flex-row flex-wrap gap-2">
          <Card className="flex-1 min-w-[132px] p-4">
            <StatCard label="Mis órdenes activas" value={activas.length} tone="primary" hint="Asignadas a vos y sin entregar" />
          </Card>
          <Card className="flex-1 min-w-[132px] p-4">
            <StatCard label="En progreso" value={enProgreso} />
          </Card>
          <Card className="flex-1 min-w-[132px] p-4">
            <StatCard label="Esperando repuestos" value={esperando} tone={esperando > 0 ? "accent" : "neutral"} />
          </Card>
          <Card className="flex-1 min-w-[132px] p-4">
            <StatCard label="Listas para entregar" value={terminadas} />
          </Card>
        </View>

        <Card className="overflow-hidden">
          <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
            <Text className="text-base font-semibold text-fg">Mis órdenes en curso</Text>
            <Link href="/ordenes" asChild><Text className="text-sm font-medium text-primary">Ver todas</Text></Link>
          </View>
          {proximas.length === 0 ? (
            <View className="p-4">
              <EmptyState icon={Wrench} title="Sin órdenes asignadas" description="Cuando te asignen una orden, la vas a ver acá con su estado." />
            </View>
          ) : proximas.map((orden) => (
            <View key={orden.id} className="flex-row items-center gap-3 border-b border-border px-4 py-3">
              <View className="flex-1 min-w-0">
                <Text className="font-medium text-fg" numberOfLines={1}>{orden.descripcion}</Text>
                <Text className="text-xs text-muted" numberOfLines={1}>{clienteMap.get(orden.cliente_id)?.nombre ?? "Sin cliente"} · {formatFecha(orden.fecha_recibido)}</Text>
              </View>
              <EstadoBadge estado={orden.estado} />
            </View>
          ))}
        </Card>

        <Card className="overflow-hidden">
          <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
            <Text className="text-base font-semibold text-fg">Repuestos bajo mínimo</Text>
            <Link href="/alertas" asChild><Text className="text-sm font-medium text-primary">Ver todo</Text></Link>
          </View>
          {alertas.items.length === 0 ? (
            <Text className="text-center text-muted py-8">Ningún repuesto está en el mínimo.</Text>
          ) : alertas.items.slice(0, 5).map((alerta) => (
            <View key={alerta.id ?? alerta.repuesto_id ?? alerta.codigo} className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
              <View className="flex-1 min-w-0">
                <Text className="font-medium text-fg" numberOfLines={1}>{alerta.nombre}</Text>
                <Text className="text-xs text-subtle">{alerta.codigo}</Text>
              </View>
              <Text className="font-semibold text-accent">{alerta.stock}</Text>
              <Text className="text-xs text-subtle">de {alerta.stock_minimo} mín.</Text>
            </View>
          ))}
        </Card>
      </View>
    </ScrollView>
  );
}

export default function DashboardScreen() {
  const { user } = useAuth();
  if (user?.rol === "tecnico") return <PanelTaller />;
  return <PanelGeneral />;
}
