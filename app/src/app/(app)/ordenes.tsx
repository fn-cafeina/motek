import { useMemo, useState } from "react";
import { Alert, FlatList, Modal, Pressable, RefreshControl, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ClipboardList, PackagePlus, Pencil, Plus, Trash2, X } from "lucide-react-native";
import { useCollection } from "../../hooks/useCollection";
import { api } from "../../lib/api";
import { getErrorMessage } from "../../lib/errors";
import { buildMap, formatFecha, formatMoney } from "../../lib/format";
import type { Cliente, Factura, Moto, OrdenEstado, OrdenRepuesto, OrdenTrabajo, Repuesto } from "../../lib/types";
import { ORDEN_ESTADOS, ORDEN_ESTADO_LABELS } from "../../lib/types";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Dialog } from "../../components/ui/Dialog";
import { EmptyState } from "../../components/ui/EmptyState";
import { EstadoBadge } from "../../components/ui/EstadoBadge";
import { Field } from "../../components/ui/Field";
import { SelectField } from "../../components/ui/SelectField";
import { Spinner } from "../../components/ui/Spinner";
import { showToast } from "../../components/ui/Toast";

type FormState = { cliente_id: string; moto_id: string; descripcion: string; diagnostico: string; total_mano_obra: string; notas: string };
const emptyForm: FormState = { cliente_id: "", moto_id: "", descripcion: "", diagnostico: "", total_mano_obra: "", notas: "" };

export default function OrdenesScreen() {
  const router = useRouter();
  const { estado: queryEstado } = useLocalSearchParams<{ estado?: string }>();
  const estadoInicial = (ORDEN_ESTADOS as string[]).includes(queryEstado ?? "") ? (queryEstado as OrdenEstado) : "";
  const [filter, setFilter] = useState<OrdenEstado | "">(estadoInicial);
  const ordenes = useCollection<OrdenTrabajo>("/api/ordenes", "Error cargando órdenes");
  const clientes = useCollection<Cliente>("/api/clientes", "Error cargando clientes");
  const motos = useCollection<Moto>("/api/motos", "Error cargando motos");
  const facturas = useCollection<Factura>("/api/facturas", "Error cargando facturas");
  const repuestosCatalogo = useCollection<Repuesto>("/api/repuestos", "Error cargando repuestos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<OrdenTrabajo | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<OrdenTrabajo | null>(null);
  const [detailRepuestos, setDetailRepuestos] = useState<OrdenRepuesto[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [addRepuestoId, setAddRepuestoId] = useState("");
  const [addCantidad, setAddCantidad] = useState("1");
  const [savingRepuesto, setSavingRepuesto] = useState(false);

  const clienteMap = useMemo(() => buildMap(clientes.items), [clientes.items]);
  const motoMap = useMemo(() => buildMap(motos.items), [motos.items]);
  const repuestoMap = useMemo(() => buildMap(repuestosCatalogo.items), [repuestosCatalogo.items]);
  const filtered = filter ? ordenes.items.filter((orden) => orden.estado === filter) : ordenes.items;
  const selectedMotos = form.cliente_id ? motos.items.filter((moto) => moto.cliente_id === Number(form.cliente_id)) : [];
  const selectedMoto = form.moto_id ? motoMap.get(Number(form.moto_id)) : null;
  const facturadasIds = useMemo(() => new Set(facturas.items.map((factura) => factura.orden_id)), [facturas.items]);

  function updateFilter(value: OrdenEstado | "") {
    setFilter(value);
    router.setParams({ estado: value || undefined });
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(orden: OrdenTrabajo) {
    setEditing(orden);
    setForm({ cliente_id: String(orden.cliente_id), moto_id: String(orden.moto_id), descripcion: orden.descripcion, diagnostico: orden.diagnostico ?? "", total_mano_obra: String(orden.total_mano_obra ?? ""), notas: orden.notas ?? "" });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!editing && (!form.cliente_id || !form.moto_id)) {
      showToast("error", "Elegí un cliente y una moto");
      return;
    }
    if (!form.descripcion.trim()) {
      showToast("error", "La descripción es requerida");
      return;
    }
    setSaving(true);
    const body = { cliente_id: Number(form.cliente_id), moto_id: Number(form.moto_id), descripcion: form.descripcion.trim(), diagnostico: form.diagnostico, total_mano_obra: Number(form.total_mano_obra) || 0, notas: form.notas };
    try {
      if (editing) {
        await api(`/api/ordenes/${editing.id}`, { method: "PUT", body });
        showToast("success", "Orden actualizada");
      } else {
        await api("/api/ordenes", { method: "POST", body });
        showToast("success", "Orden creada");
      }
      setDialogOpen(false);
      setEditing(null);
      await ordenes.refresh();
    } catch (error) {
      showToast("error", getErrorMessage(error, "Error guardando orden"));
    } finally {
      setSaving(false);
    }
  }

  async function handleChangeEstado(orden: OrdenTrabajo, estado: OrdenEstado) {
    try {
      await api(`/api/ordenes/${orden.id}/estado`, { method: "PATCH", body: { estado } });
      showToast("success", "Estado actualizado");
      await ordenes.refresh();
      if (detail?.id === orden.id) setDetail({ ...orden, estado });
    } catch (error) {
      showToast("error", getErrorMessage(error, "Error actualizando estado"));
    }
  }

  async function handleDelete(orden: OrdenTrabajo) {
    try {
      await api(`/api/ordenes/${orden.id}`, { method: "DELETE" });
      setDetail(null);
      showToast("success", "Orden eliminada");
      await ordenes.refresh();
    } catch (error) {
      showToast("error", getErrorMessage(error, "Error eliminando orden"));
    }
  }

  function confirmDelete(orden: OrdenTrabajo) {
    if (facturadasIds.has(orden.id)) {
      Alert.alert("No se puede eliminar", "La orden tiene una factura emitida. Cancelá la factura primero si necesitás quitarla.");
      return;
    }
    Alert.alert("Eliminar orden", `Se eliminará “${orden.descripcion}”.`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: () => void handleDelete(orden) },
    ]);
  }

  async function openDetail(orden: OrdenTrabajo) {
    setDetail(orden);
    setDetailRepuestos([]);
    setAddRepuestoId("");
    setAddCantidad("1");
    setDetailLoading(true);
    try {
      const items = await api<OrdenRepuesto[]>(`/api/ordenes/${orden.id}/repuestos`);
      setDetailRepuestos(items ?? []);
    } catch (error) {
      showToast("error", getErrorMessage(error, "Error cargando repuestos"));
    } finally {
      setDetailLoading(false);
    }
  }

  async function loadRepuestos(ordenId: number) {
    const items = await api<OrdenRepuesto[]>(`/api/ordenes/${ordenId}/repuestos`);
    setDetailRepuestos(items ?? []);
  }

  async function addRepuesto() {
    if (!detail || !addRepuestoId) {
      showToast("error", "Elegí un repuesto");
      return;
    }
    const cantidad = Number(addCantidad);
    if (!cantidad || cantidad <= 0) {
      showToast("error", "La cantidad debe ser mayor a cero");
      return;
    }
    setSavingRepuesto(true);
    try {
      await api(`/api/ordenes/${detail.id}/repuestos`, { method: "POST", body: { repuesto_id: Number(addRepuestoId), cantidad } });
      await loadRepuestos(detail.id);
      setAddRepuestoId("");
      setAddCantidad("1");
      showToast("success", "Repuesto agregado");
    } catch (error) {
      showToast("error", getErrorMessage(error, "Error agregando repuesto"));
    } finally {
      setSavingRepuesto(false);
    }
  }

  async function removeRepuesto(linea: OrdenRepuesto) {
    if (!detail) return;
    try {
      await api(`/api/ordenes/${detail.id}/repuestos/${linea.repuesto_id}`, { method: "DELETE" });
      await loadRepuestos(detail.id);
      showToast("success", "Repuesto quitado");
    } catch (error) {
      showToast("error", getErrorMessage(error, "Error quitando repuesto"));
    }
  }

  if (ordenes.loading && ordenes.items.length === 0) return <Spinner text="Cargando órdenes..." />;

  const totalRepuestos = detailRepuestos.reduce((total, linea) => total + linea.subtotal, 0);

  return (
    <View className="flex-1 bg-canvas">
      <FlatList
        data={filtered}
        keyExtractor={(orden) => String(orden.id)}
        refreshControl={<RefreshControl refreshing={ordenes.loading} onRefresh={ordenes.refresh} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 12 }}
        ListHeaderComponent={
          <View className="gap-4">
            <View className="flex-row items-center justify-between">
              <View><Text className="text-2xl font-semibold tracking-tight text-fg">Órdenes</Text><Text className="mt-1 text-sm text-muted">Seguimiento del trabajo en el taller</Text></View>
              <Button size="sm" onPress={openCreate}><Plus size={16} className="text-primary-fg" /><Text className="text-primary-fg font-semibold">Nueva orden</Text></Button>
            </View>
            <ScrollableFilters filter={filter} onChange={updateFilter} />
            {ordenes.error && <Text className="text-sm text-danger">{ordenes.error}</Text>}
          </View>
        }
        ListEmptyComponent={<EmptyState icon={ClipboardList} title={filter ? "Sin órdenes en este estado" : "Aún no hay órdenes"} description={filter ? "Probá con otro estado." : "Elegí un cliente, su moto y el trabajo a realizar."} action={!filter ? <Button onPress={openCreate}>+ Nueva orden</Button> : <Button variant="secondary" onPress={() => updateFilter("")}>Limpiar filtro</Button>} />}
        renderItem={({ item: orden }) => {
          const cliente = clienteMap.get(orden.cliente_id);
          const moto = motoMap.get(orden.moto_id);
          return (
            <Card className="p-4">
              <Pressable onPress={() => void openDetail(orden)} className="gap-2">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1 min-w-0"><Text className="font-semibold text-fg" numberOfLines={2}>{orden.descripcion}</Text><Text className="mt-1 text-sm text-muted" numberOfLines={1}>{cliente?.nombre ?? `#${orden.cliente_id}`} · {moto ? `${moto.marca} ${moto.modelo}` : `#${orden.moto_id}`}</Text></View>
                  <Text className="font-semibold text-fg">{formatMoney(orden.total_mano_obra)}</Text>
                </View>
                <View className="flex-row items-center justify-between"><Text className="text-xs text-subtle">Recibida {formatFecha(orden.fecha_recibido)}</Text><EstadoBadge estado={orden.estado} /></View>
              </Pressable>
              <View className="mt-3 flex-row justify-end gap-3 border-t border-border pt-3">
                <Pressable onPress={() => openEdit(orden)} className="flex-row items-center gap-1 p-1"><Pencil size={16} className="text-muted" /><Text className="text-xs font-medium text-muted">Editar</Text></Pressable>
                <Pressable onPress={() => confirmDelete(orden)} className="flex-row items-center gap-1 p-1"><Trash2 size={16} className="text-danger" /><Text className="text-xs font-medium text-danger">Eliminar</Text></Pressable>
              </View>
            </Card>
          );
        }}
      />

      <Dialog visible={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? "Editar orden" : "Nueva orden"}>
        <View className="gap-4">
          {!editing && <SelectField label="Cliente *" value={form.cliente_id} options={clientes.items.map((cliente) => ({ value: String(cliente.id), label: cliente.nombre, description: cliente.telefono }))} onChange={(value) => setForm({ ...form, cliente_id: value, moto_id: "" })} />}
          {!editing && <SelectField label="Moto *" value={form.moto_id} disabled={!form.cliente_id} options={selectedMotos.map((moto) => ({ value: String(moto.id), label: `${moto.marca} ${moto.modelo}`, description: moto.placa }))} placeholder="Elegí un cliente primero" onChange={(value) => setForm({ ...form, moto_id: value })} />}
          {editing && <View className="rounded-lg bg-raised p-3"><Text className="text-sm text-muted">Cliente: <Text className="text-fg">{clienteMap.get(editing.cliente_id)?.nombre ?? `#${editing.cliente_id}`}</Text></Text><Text className="mt-1 text-sm text-muted">Moto: <Text className="text-fg">{selectedMoto ? `${selectedMoto.marca} ${selectedMoto.modelo}` : `#${editing.moto_id}`}</Text></Text></View>}
          <Field label="Descripción *" value={form.descripcion} onChangeText={(value) => setForm({ ...form, descripcion: value })} placeholder="Cambio de aceite y filtros" multiline numberOfLines={3} />
          <Field label="Diagnóstico" value={form.diagnostico} onChangeText={(value) => setForm({ ...form, diagnostico: value })} placeholder="Diagnóstico" multiline numberOfLines={3} />
          <Field label="Total mano de obra" value={form.total_mano_obra} onChangeText={(value) => setForm({ ...form, total_mano_obra: value })} placeholder="0" keyboardType="numeric" />
          <Field label="Notas" value={form.notas} onChangeText={(value) => setForm({ ...form, notas: value })} placeholder="Notas" multiline numberOfLines={3} />
          <Button onPress={handleSave} disabled={saving}>{saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear orden"}</Button>
        </View>
      </Dialog>

      <Modal visible={Boolean(detail)} transparent animationType="slide" onRequestClose={() => setDetail(null)}>
        {detail && <View className="flex-1 justify-end bg-black/50"><View className="max-h-[92%] rounded-t-2xl bg-surface"><View className="flex-row items-center justify-between border-b border-border px-4 py-3"><View><Text className="text-lg font-semibold text-fg">Orden #{detail.id}</Text><Text className="text-xs text-muted">{formatFecha(detail.fecha_recibido)}</Text></View><Pressable onPress={() => setDetail(null)} className="p-2"><X size={20} className="text-muted" /></Pressable></View><FlatList data={detailRepuestos} keyExtractor={(linea) => String(linea.id)} renderItem={() => null} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 28 }} ListHeaderComponent={<View className="gap-4 pb-2"><View className="flex-row items-center gap-2"><EstadoBadge estado={detail.estado} /><Text className="text-sm text-muted">{clienteMap.get(detail.cliente_id)?.nombre ?? `#${detail.cliente_id}`}</Text></View><Text className="text-lg font-semibold text-fg">{detail.descripcion}</Text><View className="gap-2 rounded-lg bg-raised p-3"><Text className="text-sm text-muted">Moto: <Text className="text-fg">{motoMap.get(detail.moto_id)?.marca} {motoMap.get(detail.moto_id)?.modelo}</Text></Text><Text className="text-sm text-muted">Mano de obra: <Text className="text-fg">{formatMoney(detail.total_mano_obra)}</Text></Text></View>{detail.diagnostico && <View><Text className="text-xs font-medium text-muted">Diagnóstico</Text><Text className="mt-1 text-sm text-fg">{detail.diagnostico}</Text></View>}{detail.notas && <View><Text className="text-xs font-medium text-muted">Notas</Text><Text className="mt-1 text-sm text-fg">{detail.notas}</Text></View>}<View className="flex-row items-center justify-between"><Text className="text-sm font-semibold text-fg">Repuestos</Text><PackagePlus size={18} className="text-muted" /></View>{detailLoading ? <Text className="text-sm text-muted">Cargando repuestos...</Text> : detailRepuestos.length === 0 ? <Text className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted">Sin repuestos en esta orden.</Text> : detailRepuestos.map((linea) => <View key={linea.id} className="flex-row items-center justify-between border-b border-border py-2"><View className="flex-1"><Text className="font-medium text-fg">{repuestoMap.get(linea.repuesto_id)?.nombre ?? `Repuesto #${linea.repuesto_id}`}</Text><Text className="text-xs text-muted">{linea.cantidad} × {formatMoney(linea.precio_unitario)}</Text></View><Text className="font-semibold text-fg">{formatMoney(linea.subtotal)}</Text><Pressable onPress={() => void removeRepuesto(linea)} className="ml-2 p-2"><Trash2 size={16} className="text-danger" /></Pressable></View>)}<View className="flex-row items-center justify-between border-t border-border pt-3"><Text className="text-sm text-muted">Total repuestos</Text><Text className="font-semibold text-fg">{formatMoney(totalRepuestos)}</Text></View><View className="gap-3 border-t border-border pt-4"><SelectField label="Agregar repuesto" value={addRepuestoId} options={repuestosCatalogo.items.map((repuesto) => ({ value: String(repuesto.id), label: repuesto.nombre || repuesto.codigo, description: `Stock: ${repuesto.stock}` }))} placeholder="Elegí un repuesto" onChange={setAddRepuestoId} /><Field label="Cantidad" value={addCantidad} onChangeText={setAddCantidad} keyboardType="numeric" placeholder="1" /><Button onPress={() => void addRepuesto()} disabled={savingRepuesto || !addRepuestoId}><Plus size={16} className="text-primary-fg" /><Text className="text-primary-fg font-semibold">Agregar repuesto</Text></Button></View></View>} ListFooterComponent={<View className="gap-3 pt-4"><Text className="text-sm font-semibold text-fg">Cambiar estado</Text><ScrollableFilters filter={detail.estado} onChange={(value) => value && void handleChangeEstado(detail, value)} /><View className="flex-row gap-3"><Button variant="secondary" onPress={() => { setDetail(null); openEdit(detail); }}>Editar</Button><Button variant="danger" onPress={() => { setDetail(null); confirmDelete(detail); }}>Eliminar</Button></View></View>} /></View></View>}
      </Modal>
    </View>
  );
}

function ScrollableFilters({ filter, onChange }: { filter: OrdenEstado | ""; onChange: (value: OrdenEstado | "") => void }) {
  return <View className="flex-row flex-wrap gap-2"><Pressable onPress={() => onChange("")} className={`rounded-md px-3 py-2 ${!filter ? "bg-primary-soft" : "bg-raised"}`}><Text className={`text-xs font-medium ${!filter ? "text-primary" : "text-muted"}`}>Todas</Text></Pressable>{ORDEN_ESTADOS.map((estado) => <Pressable key={estado} onPress={() => onChange(estado)} className={`rounded-md px-3 py-2 ${filter === estado ? "bg-primary-soft" : "bg-raised"}`}><Text className={`text-xs font-medium ${filter === estado ? "text-primary" : "text-muted"}`}>{ORDEN_ESTADO_LABELS[estado]}</Text></Pressable>)}</View>;
}
