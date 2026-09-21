import { useState } from "react";
import { FlatList, Text, View, Pressable, RefreshControl } from "react-native";
import { useCollection } from "../../hooks/useCollection";
import { api } from "../../lib/api";
import { getErrorMessage } from "../../lib/errors";
import { formatMoney } from "../../lib/format";
import type { OrdenTrabajo, Cliente, Moto, OrdenEstado } from "../../lib/types";
import { ORDEN_ESTADOS, ORDEN_ESTADO_LABELS } from "../../lib/types";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Dialog } from "../../components/ui/Dialog";
import { EstadoBadge } from "../../components/ui/EstadoBadge";
import { Spinner } from "../../components/ui/Spinner";
import { EmptyState } from "../../components/ui/EmptyState";
import { showToast } from "../../components/ui/Toast";
import { ClipboardList, Pencil, Trash2 } from "lucide-react-native";

export default function OrdenesScreen() {
  const ordenes = useCollection<OrdenTrabajo>("/api/ordenes", "Error cargando órdenes");
  const clientes = useCollection<Cliente>("/api/clientes", "Error cargando clientes");
  const motos = useCollection<Moto>("/api/motos", "Error cargando motos");

  const [filter, setFilter] = useState<OrdenEstado | "">("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<OrdenTrabajo | null>(null);
  const [form, setForm] = useState({ cliente_id: "", moto_id: "", descripcion: "", diagnostico: "", costo_mano_obra: "", notas: "" });
  const [saving, setSaving] = useState(false);

  const clienteMap = new Map(clientes.items.map((c) => [c.id, c]));
  const motoMap = new Map(motos.items.map((m) => [m.id, m]));

  const filtered = filter ? ordenes.items.filter((o) => o.estado === filter) : ordenes.items;

  function openCreate() {
    setEditing(null);
    setForm({ cliente_id: "", moto_id: "", descripcion: "", diagnostico: "", costo_mano_obra: "", notas: "" });
    setDialogOpen(true);
  }

  function openEdit(o: OrdenTrabajo) {
    setEditing(o);
    setForm({
      cliente_id: String(o.cliente_id),
      moto_id: String(o.moto_id),
      descripcion: o.descripcion,
      diagnostico: o.diagnostico ?? "",
      costo_mano_obra: String(o.costo_mano_obra ?? ""),
      notas: o.notas ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.descripcion.trim()) return;
    setSaving(true);
    try {
      const body = {
        cliente_id: Number(form.cliente_id),
        moto_id: Number(form.moto_id),
        descripcion: form.descripcion,
        diagnostico: form.diagnostico,
        costo_mano_obra: Number(form.costo_mano_obra) || 0,
        notas: form.notas,
      };
      if (editing) {
        await api(`/api/ordenes/${editing.id}`, { method: "PUT", body });
        showToast("success", "Orden actualizada");
      } else {
        await api("/api/ordenes", { method: "POST", body });
        showToast("success", "Orden creada");
      }
      setDialogOpen(false);
      await ordenes.refresh();
    } catch (e) {
      showToast("error", getErrorMessage(e, "Error guardando orden"));
    } finally {
      setSaving(false);
    }
  }

  async function handleChangeEstado(o: OrdenTrabajo, estado: OrdenEstado) {
    try {
      await api(`/api/ordenes/${o.id}/estado`, { method: "PATCH", body: { estado } });
      showToast("success", "Estado actualizado");
      await ordenes.refresh();
    } catch (e) {
      showToast("error", getErrorMessage(e, "Error actualizando estado"));
    }
  }

  async function handleDelete(o: OrdenTrabajo) {
    try {
      await api(`/api/ordenes/${o.id}`, { method: "DELETE" });
      showToast("success", "Orden eliminada");
      await ordenes.refresh();
    } catch (e) {
      showToast("error", getErrorMessage(e, "Error eliminando orden"));
    }
  }

  if (ordenes.loading && ordenes.items.length === 0) return <Spinner text="Cargando órdenes..." />;

  return (
    <View className="flex-1 bg-canvas">
      <View className="p-4 pb-2">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-2xl font-bold text-fg">Órdenes</Text>
          <Button size="sm" onPress={openCreate}>+ Nueva</Button>
        </View>
        <View className="flex-row gap-2">
          <Pressable onPress={() => setFilter("")} className={`px-3 py-1.5 rounded-full ${!filter ? "bg-primary-soft" : "bg-raised"}`}>
            <Text className={`text-xs font-medium ${!filter ? "text-primary" : "text-muted"}`}>Todas</Text>
          </Pressable>
          {ORDEN_ESTADOS.map((e) => (
            <Pressable key={e} onPress={() => setFilter(e)} className={`px-3 py-1.5 rounded-full ${filter === e ? "bg-primary-soft" : "bg-raised"}`}>
              <Text className={`text-xs font-medium ${filter === e ? "text-primary" : "text-muted"}`}>{ORDEN_ESTADO_LABELS[e]}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(o) => String(o.id)}
        refreshControl={<RefreshControl refreshing={ordenes.loading} onRefresh={ordenes.refresh} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 16 }}
        renderItem={({ item: o }) => (
          <Card className="p-4 mb-3">
            <View className="flex-row items-start justify-between mb-2">
              <View className="flex-1 mr-3">
                <Text className="text-base font-semibold text-fg">#{o.id} — {o.descripcion}</Text>
                {clienteMap.get(o.cliente_id) && <Text className="text-sm text-muted mt-1">{clienteMap.get(o.cliente_id)!.nombre}</Text>}
              </View>
              <EstadoBadge estado={o.estado} />
            </View>
            <Text className="text-sm text-muted mb-2">{formatMoney(o.costo_mano_obra ?? 0)}</Text>
            <View className="flex-row gap-2">
              <Pressable onPress={() => openEdit(o)} className="p-2"><Pencil size={18} className="text-muted" /></Pressable>
              <Pressable onPress={() => handleDelete(o)} className="p-2"><Trash2 size={18} className="text-danger" /></Pressable>
            </View>
          </Card>
        )}
        ListEmptyComponent={<EmptyState icon={ClipboardList} title="Sin órdenes" description="Creá tu primera orden." action={<Button onPress={openCreate}>+ Nueva orden</Button>} />}
      />

      <Dialog visible={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? "Editar orden" : "Nueva orden"}>
        <View className="gap-4">
          <Field label="Cliente ID" value={form.cliente_id} onChangeText={(v) => setForm({ ...form, cliente_id: v })} placeholder="ID del cliente" keyboardType="numeric" />
          <Field label="Moto ID" value={form.moto_id} onChangeText={(v) => setForm({ ...form, moto_id: v })} placeholder="ID de la moto" keyboardType="numeric" />
          <Field label="Descripción *" value={form.descripcion} onChangeText={(v) => setForm({ ...form, descripcion: v })} placeholder="Descripción del trabajo" multiline numberOfLines={3} />
          <Field label="Diagnóstico" value={form.diagnostico} onChangeText={(v) => setForm({ ...form, diagnostico: v })} placeholder="Diagnóstico" multiline numberOfLines={3} />
          <Field label="Costo mano de obra" value={form.costo_mano_obra} onChangeText={(v) => setForm({ ...form, costo_mano_obra: v })} placeholder="0" keyboardType="numeric" />
          <Field label="Notas" value={form.notas} onChangeText={(v) => setForm({ ...form, notas: v })} placeholder="Notas" multiline numberOfLines={3} />
          <Button onPress={handleSave} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
        </View>
      </Dialog>
    </View>
  );
}
