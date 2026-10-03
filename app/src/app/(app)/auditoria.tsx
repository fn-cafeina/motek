import { useMemo, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { History, Pencil, Plus, Trash2, X } from "lucide-react-native";
import { useCollection } from "../../hooks/useCollection";
import { formatFecha, formatFechaHora } from "../../lib/format";
import type { AuditoriaAccion, AuditoriaItem, User } from "../../lib/types";
import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { SelectField } from "../../components/ui/SelectField";
import { Spinner } from "../../components/ui/Spinner";

const TABLA_OPTIONS = [
  { value: "", label: "Todas las tablas" },
  { value: "ordenes_trabajo", label: "Órdenes" },
  { value: "clientes", label: "Clientes" },
  { value: "motos", label: "Motos" },
  { value: "repuestos", label: "Repuestos" },
  { value: "orden_repuestos", label: "Repuestos de orden" },
  { value: "facturas", label: "Facturas" },
  { value: "pagos", label: "Pagos" },
];

const TABLA_LABELS: Record<string, string> = {
  ordenes_trabajo: "orden",
  clientes: "cliente",
  motos: "moto",
  repuestos: "repuesto",
  orden_repuestos: "repuesto de orden",
  facturas: "factura",
  pagos: "pago",
};

const ACCION_LABELS: Record<AuditoriaAccion, string> = { crear: "creó", editar: "editó", borrar: "borró" };
const ACCION_VARIANTS: Record<AuditoriaAccion, "success" | "info" | "danger"> = { crear: "success", editar: "info", borrar: "danger" };
const ACCION_ICONS: Record<AuditoriaAccion, typeof Plus> = { crear: Plus, editar: Pencil, borrar: Trash2 };

function formatearValor(valor: unknown): string {
  if (valor === null || valor === undefined || valor === "") return "—";
  const texto = typeof valor === "string" ? valor : String(valor);
  return texto.length > 42 ? `${texto.slice(0, 42)}…` : texto;
}

function cambiosDe(item: AuditoriaItem): string[] {
  if (item.accion !== "editar") return [];
  const antes = item.datos_antes ?? {};
  const despues = item.datos_despues ?? {};
  const claves = Array.from(new Set([...Object.keys(antes), ...Object.keys(despues)]));
  const cambios: string[] = [];
  for (const clave of claves) {
    const valorAntes = antes[clave];
    const valorDespues = despues[clave];
    if (JSON.stringify(valorAntes) === JSON.stringify(valorDespues)) continue;
    cambios.push(`${clave}: ${formatearValor(valorAntes)} → ${formatearValor(valorDespues)}`);
  }
  return cambios;
}

function desdeDias(dias: number): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - dias);
  return fecha.toISOString().slice(0, 10);
}

export default function AuditoriaScreen() {
  const params = useLocalSearchParams<{ tabla?: string; registro_id?: string }>();
  const [tabla, setTabla] = useState(params.tabla ?? "");
  const [registroId, setRegistroId] = useState(params.registro_id ?? "");
  const [usuario, setUsuario] = useState("");
  const [desde, setDesde] = useState("");

  const usuarios = useCollection<User>("/api/usuarios", "Error cargando usuarios");

  const filtros = useMemo(() => {
    const p: Record<string, string> = { limite: "200" };
    if (tabla) p.tabla = tabla;
    if (registroId) p.registro_id = registroId;
    if (usuario) p.usuario_id = usuario;
    if (desde) p.desde = desde;
    return p;
  }, [tabla, registroId, usuario, desde]);

  const eventos = useCollection<AuditoriaItem>("/api/auditoria", "Error cargando historial", filtros);

  const filas = useMemo(() => {
    const lista: (AuditoriaItem | { dia: string })[] = [];
    let diaActual = "";
    for (const evento of eventos.items) {
      const dia = evento.fecha.slice(0, 10);
      if (dia !== diaActual) {
        diaActual = dia;
        lista.push({ dia });
      }
      lista.push(evento);
    }
    return lista;
  }, [eventos.items]);

  if (eventos.loading && eventos.items.length === 0) return <Spinner text="Cargando historial..." />;

  const usuarioOptions = [
    { value: "", label: "Todos los usuarios" },
    ...usuarios.items.map((item) => ({ value: String(item.id), label: item.nombre || item.email })),
  ];
  const diasOpciones = [
    { label: "Todo", value: "" },
    { label: "7 días", value: desdeDias(7) },
    { label: "30 días", value: desdeDias(30) },
    { label: "90 días", value: desdeDias(90) },
  ];

  return (
    <View className="flex-1 bg-canvas">
      <FlatList
        data={filas}
        keyExtractor={(fila) => ("dia" in fila ? `dia-${fila.dia}` : `evento-${fila.id}`)}
        refreshControl={<RefreshControl refreshing={eventos.loading} onRefresh={eventos.refresh} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 8 }}
        ListHeaderComponent={
          <View className="gap-4 pb-2">
            <View>
              <Text className="text-2xl font-semibold tracking-tight text-fg">Historial</Text>
              <Text className="mt-1 text-sm text-muted">Quién hizo qué en el taller</Text>
            </View>
            {registroId ? (
              <Pressable onPress={() => setRegistroId("")} className="flex-row items-center gap-2 self-start rounded-full bg-primary-soft px-3 py-1.5">
                <Text className="text-xs font-medium text-primary">Registro #{registroId} de {TABLA_LABELS[tabla] ?? tabla}</Text>
                <X size={14} className="text-primary" />
              </Pressable>
            ) : null}
            <SelectField label="Tabla" value={tabla} options={TABLA_OPTIONS} onChange={(value) => { setTabla(value); setRegistroId(""); }} />
            <SelectField label="Usuario" value={usuario} options={usuarioOptions} onChange={setUsuario} />
            <View className="flex-row flex-wrap gap-2">
              {diasOpciones.map((opcion) => (
                <Pressable key={opcion.label} onPress={() => setDesde(opcion.value)} className={`rounded-md px-3 py-2 ${desde === opcion.value ? "bg-primary-soft" : "bg-raised"}`}>
                  <Text className={`text-xs font-medium ${desde === opcion.value ? "text-primary" : "text-muted"}`}>{opcion.label}</Text>
                </Pressable>
              ))}
            </View>
            {eventos.error && <Text className="text-sm text-danger">{eventos.error}</Text>}
          </View>
        }
        ListEmptyComponent={<EmptyState icon={History} title="Sin movimientos" description="Cuando el equipo opere en el sistema, cada cambio va a quedar registrado acá." />}
        renderItem={({ item: fila }) => {
          if ("dia" in fila) {
            return <Text className="pt-3 text-xs font-semibold uppercase tracking-wider text-subtle">{formatFecha(fila.dia)}</Text>;
          }
          const Icono = ACCION_ICONS[fila.accion] ?? History;
          const cambios = cambiosDe(fila);
          return (
            <Card className="p-3.5">
              <View className="flex-row items-center gap-3">
                <View className="size-8 items-center justify-center rounded-full bg-raised"><Icono size={15} className="text-muted" /></View>
                <View className="flex-1 min-w-0">
                  <Text className="text-sm text-fg">
                    <Text className="font-semibold">{fila.usuario_nombre || fila.usuario_email || "Sistema"}</Text> {ACCION_LABELS[fila.accion] ?? fila.accion} {TABLA_LABELS[fila.tabla] ?? fila.tabla} #{fila.registro_id}
                  </Text>
                  <Text className="mt-0.5 text-xs text-subtle">{formatFechaHora(fila.fecha)}</Text>
                  {cambios.length > 0 && (
                    <Text className="mt-1 text-xs text-muted" numberOfLines={3}>
                      {cambios.slice(0, 3).join("  ·  ")}{cambios.length > 3 ? `  (+${cambios.length - 3})` : ""}
                    </Text>
                  )}
                </View>
                <Badge label={fila.accion} variant={ACCION_VARIANTS[fila.accion] ?? "default"} />
              </View>
            </Card>
          );
        }}
      />
    </View>
  );
}
