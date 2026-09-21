import { useState } from "react";
import { FlatList, Text, View, Pressable, RefreshControl } from "react-native";
import { useCollection } from "../../hooks/useCollection";
import { api } from "../../lib/api";
import { getErrorMessage } from "../../lib/errors";
import { formatMoney, formatFecha } from "../../lib/format";
import type { Factura, OrdenTrabajo } from "../../lib/types";
import { FACTURA_ESTADOS, FACTURA_ESTADO_LABELS } from "../../lib/types";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Dialog } from "../../components/ui/Dialog";
import { EstadoBadge } from "../../components/ui/EstadoBadge";
import { Spinner } from "../../components/ui/Spinner";
import { EmptyState } from "../../components/ui/EmptyState";
import { showToast } from "../../components/ui/Toast";
import { FileText, Pencil } from "lucide-react-native";

export default function FacturasScreen() {
  const facturas = useCollection<Factura>("/api/facturas", "Error cargando facturas");
  const ordenes = useCollection<OrdenTrabajo>("/api/ordenes", "Error cargando órdenes");

  const [filter, setFilter] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creatingFrom, setCreatingFrom] = useState<OrdenTrabajo | null>(null);
  const [editing, setEditing] = useState<Factura | null>(null);
  const [form, setForm] = useState({ notas: "", vencimiento: "" });
  const [saving, setSaving] = useState(false);

  const filtered = filter ? facturas.items.filter((f) => f.estado === filter) : facturas.items;

  function openCreateFrom(o: OrdenTrabajo) {
    setCreatingFrom(o);
    setForm({ notas: "", vencimiento: "" });
    setDialogOpen(true);
  }

  function openEdit(f: Factura) {
    setEditing(f);
    setForm({ notas: f.notas ?? "", vencimiento: f.vencimiento ?? "" });
    setDialogOpen(true);
  }

  async function handleCreate() {
    if (!creatingFrom) return;
    setSaving(true);
    try {
      await api("/api/facturas", { method: "POST", body: { orden_id: creatingFrom.id, notas: form.notas, vencimiento: form.vencimiento } });
      showToast("success", "Factura creada");
      setDialogOpen(false);
      await facturas.refresh();
    } catch (e) {
      showToast("error", getErrorMessage(e, "Error creando factura"));
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate() {
    if (!editing) return;
    setSaving(true);
    try {
      await api(`/api/facturas/${editing.id}`, { method: "PUT", body: { notas: form.notas, vencimiento: form.vencimiento } });
      showToast("success", "Factura actualizada");
      setDialogOpen(false);
      await facturas.refresh();
    } catch (e) {
      showToast("error", getErrorMessage(e, "Error actualizando factura"));
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel(f: Factura) {
    try {
      await api(`/api/facturas/${f.id}/cancelar`, { method: "PATCH" });
      showToast("success", "Factura cancelada");
      await facturas.refresh();
    } catch (e) {
      showToast("error", getErrorMessage(e, "Error cancelando factura"));
    }
  }

  if (facturas.loading && facturas.items.length === 0) return <Spinner text="Cargando facturas..." />;

  const ordenesSinFactura = ordenes.items.filter((o) => o.estado === "finalizada" && !facturas.items.some((f) => f.orden_id === o.id));

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      <View className="p-4 pb-2">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100">Facturas</Text>
        </View>
        <View className="flex-row gap-2 flex-wrap">
          <Pressable onPress={() => setFilter("")} className={`px-3 py-1.5 rounded-full ${!filter ? "bg-blue-100" : "bg-gray-200 dark:bg-gray-800"}`}>
            <Text className={`text-xs font-medium ${!filter ? "text-blue-700" : "text-gray-600 dark:text-gray-400"}`}>Todas</Text>
          </Pressable>
          {FACTURA_ESTADOS.map((e) => (
            <Pressable key={e} onPress={() => setFilter(e)} className={`px-3 py-1.5 rounded-full ${filter === e ? "bg-blue-100" : "bg-gray-200 dark:bg-gray-800"}`}>
              <Text className={`text-xs font-medium ${filter === e ? "text-blue-700" : "text-gray-600 dark:text-gray-400"}`}>{FACTURA_ESTADO_LABELS[e]}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {ordenesSinFactura.length > 0 && (
        <View className="px-4 mb-3">
          <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Órdenes sin facturar</Text>
          {ordenesSinFactura.slice(0, 3).map((o) => (
            <Card key={o.id} className="p-3 mb-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-gray-900 dark:text-gray-100 flex-1">#{o.id} — {o.descripcion}</Text>
                <Button size="sm" variant="secondary" onPress={() => openCreateFrom(o)}>Facturar</Button>
              </View>
            </Card>
          ))}
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(f) => String(f.id)}
        refreshControl={<RefreshControl refreshing={facturas.loading} onRefresh={facturas.refresh} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 16 }}
        renderItem={({ item: f }) => (
          <Card className="p-4 mb-3">
            <View className="flex-row items-start justify-between mb-2">
              <View className="flex-1 mr-3">
                <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">Factura #{f.id}</Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">Orden #{f.orden_id}</Text>
              </View>
              <EstadoBadge estado={f.estado} />
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-gray-600 dark:text-gray-400">Total: {formatMoney(f.total)}</Text>
              <Text className="text-sm text-gray-600 dark:text-gray-400">Pagado: {formatMoney(f.pagado)}</Text>
            </View>
            <Text className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Saldo: {formatMoney(f.saldo)}</Text>
            <View className="flex-row gap-2">
              <Pressable onPress={() => openEdit(f)} className="p-2"><Pencil size={18} className="text-gray-500" /></Pressable>
              {f.estado !== "cancelada" && f.estado !== "pagada" && (
                <Pressable onPress={() => handleCancel(f)} className="px-3 py-1 rounded bg-red-100"><Text className="text-xs text-red-700 font-medium">Cancelar</Text></Pressable>
              )}
            </View>
          </Card>
        )}
        ListEmptyComponent={<EmptyState icon={FileText} title="Sin facturas" description="No hay facturas para mostrar." />}
      />

      <Dialog visible={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? "Editar factura" : "Crear factura"}>
        <View className="gap-4">
          {creatingFrom && (
            <Text className="text-sm text-gray-600 dark:text-gray-400">Orden: #{creatingFrom.id} — {creatingFrom.descripcion}</Text>
          )}
          <Field label="Notas" value={form.notas} onChangeText={(v) => setForm({ ...form, notas: v })} placeholder="Notas" multiline numberOfLines={3} />
          <Field label="Vencimiento" value={form.vencimiento} onChangeText={(v) => setForm({ ...form, vencimiento: v })} placeholder="AAAA-MM-DD" />
          <Button onPress={editing ? handleUpdate : handleCreate} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
        </View>
      </Dialog>
    </View>
  );
}
