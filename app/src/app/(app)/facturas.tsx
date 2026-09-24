import { useMemo, useState } from "react";
import { Alert, FlatList, Modal, Pressable, RefreshControl, Text, View } from "react-native";
import { Banknote, Ban, FileText, Pencil, Plus, Trash2, X } from "lucide-react-native";
import { useCollection } from "../../hooks/useCollection";
import { api } from "../../lib/api";
import { getErrorMessage } from "../../lib/errors";
import { formatFecha, formatMoney } from "../../lib/format";
import type { Factura, FacturaEstado, OrdenTrabajo, Pago } from "../../lib/types";
import { FACTURA_ESTADOS, FACTURA_ESTADO_LABELS } from "../../lib/types";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Dialog } from "../../components/ui/Dialog";
import { EmptyState } from "../../components/ui/EmptyState";
import { EstadoBadge } from "../../components/ui/EstadoBadge";
import { Field } from "../../components/ui/Field";
import { SelectField } from "../../components/ui/SelectField";
import { Spinner } from "../../components/ui/Spinner";
import { showToast } from "../../components/ui/Toast";

const paymentMethods = ["efectivo", "transferencia", "tarjeta"] as const;

function toApiDate(value: string) {
  return value ? new Date(`${value}T12:00:00`).toISOString() : null;
}

export default function FacturasScreen() {
  const facturas = useCollection<Factura>("/api/facturas", "Error cargando facturas");
  const ordenes = useCollection<OrdenTrabajo>("/api/ordenes", "Error cargando órdenes");
  const [filter, setFilter] = useState<FacturaEstado | "">("");
  const [createOpen, setCreateOpen] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [editing, setEditing] = useState<Factura | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ notas: "", fecha_vencimiento: "" });
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<Factura | null>(null);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [pagosLoading, setPagosLoading] = useState(false);
  const [pagoMonto, setPagoMonto] = useState("");
  const [pagoMetodo, setPagoMetodo] = useState<(typeof paymentMethods)[number]>("efectivo");
  const [pagoSaving, setPagoSaving] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Factura | null>(null);
  const [cancelSaving, setCancelSaving] = useState(false);

  const filtered = filter ? facturas.items.filter((factura) => factura.estado === filter) : facturas.items;
  const facturadasIds = useMemo(() => new Set(facturas.items.map((factura) => factura.orden_id)), [facturas.items]);
  const ordenesSinFactura = ordenes.items.filter((orden) => orden.estado === "entregado" && !facturadasIds.has(orden.id));
  const totalPagado = pagos.reduce((total, pago) => total + pago.monto, 0);
  const saldo = detail ? detail.total - totalPagado : 0;

  function openCreate() {
    setOrderId("");
    setCreateOpen(true);
  }

  function openEdit(factura: Factura) {
    setEditing(factura);
    setForm({ notas: factura.notas ?? "", fecha_vencimiento: factura.fecha_vencimiento?.slice(0, 10) ?? "" });
    setEditOpen(true);
  }

  async function handleCreate() {
    if (!orderId) {
      showToast("error", "Elegí una orden para facturar");
      return;
    }
    setSaving(true);
    try {
      await api("/api/facturas", { method: "POST", body: { orden_id: Number(orderId) } });
      setCreateOpen(false);
      showToast("success", "Factura creada");
      await facturas.refresh();
    } catch (error) {
      showToast("error", getErrorMessage(error, "Error creando factura"));
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate() {
    if (!editing) return;
    setSaving(true);
    try {
      await api(`/api/facturas/${editing.id}`, { method: "PUT", body: { notas: form.notas, fecha_vencimiento: toApiDate(form.fecha_vencimiento) } });
      setEditOpen(false);
      showToast("success", "Factura actualizada");
      await facturas.refresh();
      if (detail?.id === editing.id) setDetail({ ...detail, notas: form.notas, fecha_vencimiento: toApiDate(form.fecha_vencimiento) });
    } catch (error) {
      showToast("error", getErrorMessage(error, "Error actualizando factura"));
    } finally {
      setSaving(false);
    }
  }

  function confirmCancel(factura: Factura) {
    setCancelTarget(factura);
  }

  async function handleCancel() {
    if (!cancelTarget) return;
    setCancelSaving(true);
    try {
      await api(`/api/facturas/${cancelTarget.id}/cancelar`, { method: "PATCH", body: {} });
      setCancelTarget(null);
      showToast("success", "Factura cancelada");
      await facturas.refresh();
      if (detail?.id === cancelTarget.id) setDetail(null);
    } catch (error) {
      showToast("error", getErrorMessage(error, "Error cancelando factura"));
    } finally {
      setCancelSaving(false);
    }
  }

  async function openDetail(factura: Factura) {
    setDetail(factura);
    setPagos([]);
    setPagoMonto("");
    setPagosLoading(true);
    try {
      const data = await api<Pago[]>(`/api/facturas/${factura.id}/pagos`);
      setPagos(data ?? []);
    } catch (error) {
      showToast("error", getErrorMessage(error, "Error cargando pagos"));
    } finally {
      setPagosLoading(false);
    }
  }

  async function refreshPagos(facturaId: number) {
    const data = await api<Pago[]>(`/api/facturas/${facturaId}/pagos`);
    setPagos(data ?? []);
  }

  async function addPayment() {
    if (!detail) return;
    const monto = Number(pagoMonto);
    if (!monto || monto <= 0) {
      showToast("error", "Ingresá un monto mayor a cero");
      return;
    }
    if (monto > saldo) {
      showToast("error", "El pago excede el saldo de la factura");
      return;
    }
    setPagoSaving(true);
    try {
      await api(`/api/facturas/${detail.id}/pagos`, { method: "POST", body: { monto, metodo: pagoMetodo } });
      setPagoMonto("");
      await refreshPagos(detail.id);
      const updated = await api<Factura>(`/api/facturas/${detail.id}`);
      setDetail(updated);
      await facturas.refresh();
      showToast("success", "Pago registrado");
    } catch (error) {
      showToast("error", getErrorMessage(error, "Error registrando pago"));
    } finally {
      setPagoSaving(false);
    }
  }

  function confirmDeletePayment(pago: Pago) {
    if (!detail) return;
    Alert.alert("Eliminar pago", `Se eliminará el pago de ${formatMoney(pago.monto)}.`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: () => void deletePayment(pago) },
    ]);
  }

  async function deletePayment(pago: Pago) {
    if (!detail) return;
    try {
      await api(`/api/facturas/${detail.id}/pagos/${pago.id}`, { method: "DELETE" });
      await refreshPagos(detail.id);
      const updated = await api<Factura>(`/api/facturas/${detail.id}`);
      setDetail(updated);
      await facturas.refresh();
      showToast("success", "Pago eliminado");
    } catch (error) {
      showToast("error", getErrorMessage(error, "Error eliminando pago"));
    }
  }

  if (facturas.loading && facturas.items.length === 0) return <Spinner text="Cargando facturas..." />;

  return (
    <View className="flex-1 bg-canvas">
      <FlatList
        data={filtered}
        keyExtractor={(factura) => String(factura.id)}
        refreshControl={<RefreshControl refreshing={facturas.loading} onRefresh={facturas.refresh} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 12 }}
        ListHeaderComponent={
          <View className="gap-4">
            <View className="flex-row items-center justify-between">
              <View><Text className="text-2xl font-semibold tracking-tight text-fg">Facturas</Text><Text className="mt-1 text-sm text-muted">Cobros y pagos del taller</Text></View>
              <Button size="sm" onPress={openCreate} disabled={ordenesSinFactura.length === 0}><Plus size={16} className="text-primary-fg" /><Text className="text-primary-fg font-semibold">Nueva factura</Text></Button>
            </View>
            <View className="flex-row flex-wrap gap-2">
              <FilterButton label="Todas" active={!filter} onPress={() => setFilter("")} />
              {FACTURA_ESTADOS.map((estado) => <FilterButton key={estado} label={FACTURA_ESTADO_LABELS[estado]} active={filter === estado} onPress={() => setFilter(estado)} />)}
            </View>
            {facturas.error && <Text className="text-sm text-danger">{facturas.error}</Text>}
            {ordenesSinFactura.length > 0 && <View className="rounded-lg border border-primary-soft bg-primary-soft/50 p-3"><Text className="text-sm font-semibold text-fg">Órdenes listas para facturar</Text><Text className="mt-1 text-sm text-muted">{ordenesSinFactura.length} orden(es) entregadas sin factura.</Text></View>}
          </View>
        }
        ListEmptyComponent={<EmptyState icon={FileText} title={filter ? "Sin facturas en este estado" : "Aún no hay facturas"} description={filter ? "Probá con otro estado." : "Facturá una orden entregada para liquidar mano de obra y repuestos."} action={!filter && ordenesSinFactura.length > 0 ? <Button onPress={openCreate}>+ Nueva factura</Button> : undefined} />}
        renderItem={({ item: factura }) => (
          <Card className="p-4">
            <Pressable onPress={() => void openDetail(factura)} className="flex-row items-start justify-between gap-3">
              <View className="flex-1 min-w-0"><Text className="font-semibold text-fg">Factura #{factura.id}</Text><Text className="mt-1 text-sm text-muted">Orden #{factura.orden_id} · Emitida {formatFecha(factura.fecha_emision)}</Text></View>
              <View className="items-end gap-2"><Text className="font-semibold text-fg">{formatMoney(factura.total)}</Text><EstadoBadge estado={factura.estado} /></View>
            </Pressable>
            <View className="mt-3 flex-row justify-end gap-3 border-t border-border pt-3">
              <Pressable onPress={() => openEdit(factura)} className="flex-row items-center gap-1 p-1"><Pencil size={16} className="text-muted" /><Text className="text-xs font-medium text-muted">Editar</Text></Pressable>
              {factura.estado !== "cancelada" && <Pressable onPress={() => confirmCancel(factura)} className="flex-row items-center gap-1 p-1"><Ban size={16} className="text-danger" /><Text className="text-xs font-medium text-danger">Cancelar</Text></Pressable>}
            </View>
          </Card>
        )}
      />

      <Dialog visible={createOpen} onClose={() => setCreateOpen(false)} title="Nueva factura">
        <View className="gap-4">
          <SelectField label="Orden de trabajo *" value={orderId} options={ordenesSinFactura.map((orden) => ({ value: String(orden.id), label: `#${orden.id} · ${orden.descripcion}`, description: formatMoney(orden.total_mano_obra) }))} onChange={setOrderId} />
          <Button onPress={handleCreate} disabled={saving || !orderId}>{saving ? "Creando..." : "Crear factura"}</Button>
        </View>
      </Dialog>

      <Dialog visible={editOpen} onClose={() => setEditOpen(false)} title={`Editar factura #${editing?.id ?? ""}`}>
        <View className="gap-4">
          <Field label="Notas" value={form.notas} onChangeText={(value) => setForm({ ...form, notas: value })} placeholder="Notas" multiline numberOfLines={3} />
          <Field label="Fecha de vencimiento" value={form.fecha_vencimiento} onChangeText={(value) => setForm({ ...form, fecha_vencimiento: value })} placeholder="AAAA-MM-DD" />
          <Button onPress={handleUpdate} disabled={saving}>{saving ? "Guardando..." : "Guardar cambios"}</Button>
        </View>
      </Dialog>

      <Dialog visible={Boolean(cancelTarget)} onClose={() => !cancelSaving && setCancelTarget(null)} title="Cancelar factura">
        <View className="gap-4"><Text className="text-sm text-muted">La factura #{cancelTarget?.id} quedará cancelada de forma irreversible.</Text><Button variant="danger" onPress={handleCancel} disabled={cancelSaving}>{cancelSaving ? "Cancelando..." : "Cancelar factura"}</Button></View>
      </Dialog>

      <Modal visible={Boolean(detail)} transparent animationType="slide" onRequestClose={() => setDetail(null)}>
        {detail && <View className="flex-1 justify-end bg-black/50"><View className="max-h-[92%] rounded-t-2xl bg-surface"><View className="flex-row items-center justify-between border-b border-border px-4 py-3"><View><Text className="text-lg font-semibold text-fg">Factura #{detail.id}</Text><Text className="text-xs text-muted">Emitida el {formatFecha(detail.fecha_emision)}</Text></View><Pressable onPress={() => setDetail(null)} className="p-2"><X size={20} className="text-muted" /></Pressable></View><FlatList data={pagos} keyExtractor={(pago) => String(pago.id)} renderItem={({ item: pago }) => <View className="flex-row items-center justify-between border-b border-border px-4 py-3"><View><Text className="font-semibold text-ok">{formatMoney(pago.monto)}</Text><Text className="text-xs text-muted">{pago.metodo} · {formatFecha(pago.fecha)}</Text></View><Pressable onPress={() => confirmDeletePayment(pago)} className="p-2"><Trash2 size={16} className="text-danger" /></Pressable></View>} contentContainerStyle={{ paddingBottom: 24 }} ListHeaderComponent={<View className="gap-4 p-4"><View className="flex-row items-center gap-2"><EstadoBadge estado={detail.estado} /><Text className="text-sm text-muted">Orden #{detail.orden_id}</Text></View><View className="gap-2 rounded-lg border border-border bg-raised p-3"><AmountRow label="Mano de obra" value={formatMoney(detail.subtotal_mano_obra)} /><AmountRow label="Repuestos" value={formatMoney(detail.subtotal_repuestos)} /><AmountRow label="Total" value={formatMoney(detail.total)} strong /><AmountRow label="Pagado" value={formatMoney(totalPagado)} /><AmountRow label="Saldo" value={formatMoney(saldo)} /></View>{detail.notas && <View><Text className="text-xs font-medium text-muted">Notas</Text><Text className="mt-1 text-sm text-fg">{detail.notas}</Text></View>}<View className="flex-row items-center justify-between"><Text className="text-base font-semibold text-fg">Pagos</Text><Banknote size={19} className="text-muted" /></View>{pagosLoading ? <Text className="text-sm text-muted">Cargando pagos...</Text> : pagos.length === 0 ? <Text className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted">Sin pagos registrados.</Text> : null}{detail.estado !== "cancelada" && detail.estado !== "pagada" && <View className="gap-3 border-t border-border pt-4"><Field label="Monto" value={pagoMonto} onChangeText={setPagoMonto} keyboardType="numeric" placeholder={`Hasta ${formatMoney(saldo)}`} /><SelectField label="Método" value={pagoMetodo} options={paymentMethods.map((method) => ({ value: method, label: method[0].toUpperCase() + method.slice(1) }))} onChange={(value) => setPagoMetodo(value as (typeof paymentMethods)[number])} /><Button onPress={addPayment} disabled={pagoSaving}><Plus size={16} className="text-primary-fg" /><Text className="text-primary-fg font-semibold">Registrar pago</Text></Button></View>}</View>} /></View></View>}
      </Modal>
    </View>
  );
}

function FilterButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} className={`rounded-md px-3 py-2 ${active ? "bg-primary-soft" : "bg-raised"}`}><Text className={`text-xs font-medium ${active ? "text-primary" : "text-muted"}`}>{label}</Text></Pressable>;
}

function AmountRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <View className="flex-row items-center justify-between"><Text className={`text-sm ${strong ? "font-semibold text-fg" : "text-muted"}`}>{label}</Text><Text className={`${strong ? "text-base font-semibold text-fg" : "font-medium text-fg"}`}>{value}</Text></View>;
}
