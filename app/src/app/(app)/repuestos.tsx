import { useState } from "react";
import { FlatList, Text, View, Pressable, RefreshControl } from "react-native";
import { useCollection } from "../../hooks/useCollection";
import { api } from "../../lib/api";
import { getErrorMessage } from "../../lib/errors";
import { formatMoney } from "../../lib/format";
import type { Repuesto } from "../../lib/types";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Dialog } from "../../components/ui/Dialog";
import { Spinner } from "../../components/ui/Spinner";
import { EmptyState } from "../../components/ui/EmptyState";
import { showToast } from "../../components/ui/Toast";
import { Package, Pencil, Trash2 } from "lucide-react-native";

export default function RepuestosScreen() {
  const { items, loading, error, refresh } = useCollection<Repuesto>("/api/repuestos", "Error cargando repuestos");
  const [search, setSearch] = useState("");
  const [stockBajo, setStockBajo] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Repuesto | null>(null);
  const [form, setForm] = useState({ codigo: "", nombre: "", categoria: "", ubicacion: "", precio_compra: "", precio_venta: "", stock: "", stock_minimo: "", descripcion: "" });
  const [saving, setSaving] = useState(false);

  const filtered = items.filter((r) => {
    const matchSearch = r.nombre.toLowerCase().includes(search.toLowerCase()) || r.codigo.toLowerCase().includes(search.toLowerCase());
    const matchStock = stockBajo ? r.stock <= r.stock_minimo : true;
    return matchSearch && matchStock;
  });

  function openCreate() {
    setEditing(null);
    setForm({ codigo: "", nombre: "", categoria: "", ubicacion: "", precio_compra: "", precio_venta: "", stock: "", stock_minimo: "", descripcion: "" });
    setDialogOpen(true);
  }

  function openEdit(r: Repuesto) {
    setEditing(r);
    setForm({
      codigo: r.codigo,
      nombre: r.nombre,
      categoria: r.categoria ?? "",
      ubicacion: r.ubicacion ?? "",
      precio_compra: String(r.precio_compra ?? ""),
      precio_venta: String(r.precio_venta ?? ""),
      stock: String(r.stock),
      stock_minimo: String(r.stock_minimo),
      descripcion: r.descripcion ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.codigo.trim() || !form.nombre.trim()) return;
    setSaving(true);
    try {
      const body = {
        codigo: form.codigo,
        nombre: form.nombre,
        categoria: form.categoria,
        ubicacion: form.ubicacion,
        precio_compra: Number(form.precio_compra) || 0,
        precio_venta: Number(form.precio_venta) || 0,
        stock: Number(form.stock) || 0,
        stock_minimo: Number(form.stock_minimo) || 0,
        descripcion: form.descripcion,
      };
      if (editing) {
        await api(`/api/repuestos/${editing.id}`, { method: "PUT", body });
        showToast("success", "Repuesto actualizado");
      } else {
        await api("/api/repuestos", { method: "POST", body });
        showToast("success", "Repuesto creado");
      }
      setDialogOpen(false);
      await refresh();
    } catch (e) {
      showToast("error", getErrorMessage(e, "Error guardando repuesto"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(r: Repuesto) {
    try {
      await api(`/api/repuestos/${r.id}`, { method: "DELETE" });
      showToast("success", "Repuesto eliminado");
      await refresh();
    } catch (e) {
      showToast("error", getErrorMessage(e, "Error eliminando repuesto"));
    }
  }

  if (loading && items.length === 0) return <Spinner text="Cargando repuestos..." />;

  return (
    <View className="flex-1 bg-canvas">
      <View className="p-4 pb-2">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-2xl font-bold text-fg">Repuestos</Text>
          <Button size="sm" onPress={openCreate}>+ Nuevo</Button>
        </View>
        <Field label="" placeholder="Buscar repuestos..." value={search} onChangeText={setSearch} />
        <Pressable onPress={() => setStockBajo(!stockBajo)} className={`mt-2 self-start px-3 py-1.5 rounded-full ${stockBajo ? "bg-danger-soft" : "bg-raised"}`}>
          <Text className={`text-xs font-medium ${stockBajo ? "text-danger" : "text-muted"}`}>Stock bajo</Text>
        </Pressable>
      </View>

      {error && <Text className="text-sm text-danger px-4 mb-2">{error}</Text>}

      <FlatList
        data={filtered}
        keyExtractor={(r) => String(r.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 16 }}
        renderItem={({ item: r }) => (
          <Card className="p-4 mb-3">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 mr-3">
                <Text className="text-base font-semibold text-fg">{r.nombre}</Text>
                <Text className="text-xs text-muted mt-1">{r.codigo}</Text>
                <View className="flex-row gap-3 mt-2">
                  <Text className="text-sm text-muted">Venta: {formatMoney(r.precio_venta)}</Text>
                  <Text className={`text-sm font-medium ${r.stock <= r.stock_minimo ? "text-danger" : "text-muted"}`}>Stock: {r.stock}</Text>
                </View>
              </View>
              <View className="flex-row gap-2">
                <Pressable onPress={() => openEdit(r)} className="p-2"><Pencil size={18} className="text-muted" /></Pressable>
                <Pressable onPress={() => handleDelete(r)} className="p-2"><Trash2 size={18} className="text-danger" /></Pressable>
              </View>
            </View>
          </Card>
        )}
        ListEmptyComponent={<EmptyState icon={Package} title="Sin repuestos" description="Agregá tu primer repuesto." action={<Button onPress={openCreate}>+ Nuevo repuesto</Button>} />}
      />

      <Dialog visible={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? "Editar repuesto" : "Nuevo repuesto"}>
        <View className="gap-4">
          <Field label="Código *" value={form.codigo} onChangeText={(v) => setForm({ ...form, codigo: v })} placeholder="Código" />
          <Field label="Nombre *" value={form.nombre} onChangeText={(v) => setForm({ ...form, nombre: v })} placeholder="Nombre" />
          <Field label="Categoría" value={form.categoria} onChangeText={(v) => setForm({ ...form, categoria: v })} placeholder="Categoría" />
          <Field label="Ubicación" value={form.ubicacion} onChangeText={(v) => setForm({ ...form, ubicacion: v })} placeholder="Ubicación" />
          <Field label="Precio compra" value={form.precio_compra} onChangeText={(v) => setForm({ ...form, precio_compra: v })} placeholder="0" keyboardType="numeric" />
          <Field label="Precio venta" value={form.precio_venta} onChangeText={(v) => setForm({ ...form, precio_venta: v })} placeholder="0" keyboardType="numeric" />
          <Field label="Stock" value={form.stock} onChangeText={(v) => setForm({ ...form, stock: v })} placeholder="0" keyboardType="numeric" />
          <Field label="Stock mínimo" value={form.stock_minimo} onChangeText={(v) => setForm({ ...form, stock_minimo: v })} placeholder="0" keyboardType="numeric" />
          <Field label="Descripción" value={form.descripcion} onChangeText={(v) => setForm({ ...form, descripcion: v })} placeholder="Descripción" multiline numberOfLines={3} />
          <Button onPress={handleSave} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
        </View>
      </Dialog>
    </View>
  );
}
