import { useMemo, useState } from "react";
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { Package, PackagePlus, Pencil, Plus, RotateCw, Trash2 } from "lucide-react-native";
import { useCollection } from "../../hooks/useCollection";
import { api } from "../../lib/api";
import { getErrorMessage } from "../../lib/errors";
import { formatMoney } from "../../lib/format";
import type { Repuesto } from "../../lib/types";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Dialog } from "../../components/ui/Dialog";
import { EmptyState } from "../../components/ui/EmptyState";
import { Field } from "../../components/ui/Field";
import { Spinner } from "../../components/ui/Spinner";
import { showToast } from "../../components/ui/Toast";

type FormState = {
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  precio_compra: string;
  precio_venta: string;
  stock: string;
  stock_minimo: string;
  ubicacion: string;
};

const emptyForm: FormState = {
  codigo: "",
  nombre: "",
  descripcion: "",
  categoria: "",
  precio_compra: "",
  precio_venta: "",
  stock: "0",
  stock_minimo: "5",
  ubicacion: "",
};

export default function RepuestosScreen() {
  const { items, loading, error, refresh } = useCollection<Repuesto>("/api/repuestos", "Error cargando repuestos");
  const [search, setSearch] = useState("");
  const [soloBajo, setSoloBajo] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Repuesto | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [stockTarget, setStockTarget] = useState<Repuesto | null>(null);
  const [stockDelta, setStockDelta] = useState("");
  const [stockSaving, setStockSaving] = useState(false);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((repuesto) => {
      const matchesSearch = !term || [repuesto.nombre, repuesto.codigo, repuesto.categoria].some((value) => value.toLowerCase().includes(term));
      return matchesSearch && (!soloBajo || repuesto.stock <= repuesto.stock_minimo);
    });
  }, [items, search, soloBajo]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(repuesto: Repuesto) {
    setEditing(repuesto);
    setForm({
      codigo: repuesto.codigo,
      nombre: repuesto.nombre,
      descripcion: repuesto.descripcion ?? "",
      categoria: repuesto.categoria ?? "",
      precio_compra: String(repuesto.precio_compra || 0),
      precio_venta: String(repuesto.precio_venta || 0),
      stock: String(repuesto.stock),
      stock_minimo: String(repuesto.stock_minimo),
      ubicacion: repuesto.ubicacion ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.codigo.trim() || !form.nombre.trim()) {
      showToast("error", "Código y nombre son requeridos");
      return;
    }
    setSaving(true);
    const body = {
      codigo: form.codigo.trim(),
      nombre: form.nombre.trim(),
      descripcion: form.descripcion,
      categoria: form.categoria,
      precio_compra: Number(form.precio_compra) || 0,
      precio_venta: Number(form.precio_venta) || 0,
      stock: Number(form.stock) || 0,
      stock_minimo: Number(form.stock_minimo) || 0,
      ubicacion: form.ubicacion,
    };
    try {
      if (editing) {
        await api(`/api/repuestos/${editing.id}`, { method: "PUT", body });
        showToast("success", "Repuesto actualizado");
      } else {
        await api("/api/repuestos", { method: "POST", body });
        showToast("success", "Repuesto creado");
      }
      setDialogOpen(false);
      setEditing(null);
      await refresh();
    } catch (caught) {
      showToast("error", getErrorMessage(caught, "Error guardando repuesto"));
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(repuesto: Repuesto) {
    Alert.alert("Eliminar repuesto", `Se eliminará “${repuesto.nombre}” del inventario.`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: () => void handleDelete(repuesto) },
    ]);
  }

  async function handleDelete(repuesto: Repuesto) {
    try {
      await api(`/api/repuestos/${repuesto.id}`, { method: "DELETE" });
      showToast("success", "Repuesto eliminado");
      await refresh();
    } catch (caught) {
      showToast("error", getErrorMessage(caught, "Error eliminando repuesto"));
    }
  }

  async function handleStockChange() {
    if (!stockTarget) return;
    const delta = Number(stockDelta);
    if (!delta) {
      showToast("error", "Ingresá una cantidad distinta de cero");
      return;
    }
    setStockSaving(true);
    try {
      await api(`/api/repuestos/${stockTarget.id}/stock`, { method: "POST", body: { cantidad: delta } });
      setStockTarget(null);
      setStockDelta("");
      showToast("success", "Stock actualizado");
      await refresh();
    } catch (caught) {
      showToast("error", getErrorMessage(caught, "Error ajustando stock"));
    } finally {
      setStockSaving(false);
    }
  }

  if (loading && items.length === 0) return <Spinner text="Cargando repuestos..." />;

  return (
    <View className="flex-1 bg-canvas">
      <FlatList
        data={filtered}
        keyExtractor={(repuesto) => String(repuesto.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 12 }}
        ListHeaderComponent={
          <View className="gap-4">
            <View className="flex-row items-center justify-end">
              <Button size="sm" onPress={openCreate}><Plus size={16} className="text-primary-fg" /><Text className="text-primary-fg font-semibold">Nuevo</Text></Button>
            </View>
            <Field label="" placeholder="Buscar por nombre, código o categoría" value={search} onChangeText={setSearch} />
            <View className="flex-row items-center justify-between">
              <Pressable onPress={() => setSoloBajo((value) => !value)} className={`rounded-md px-3 py-2 ${soloBajo ? "bg-accent-soft" : "bg-raised"}`}>
                <Text className={`text-xs font-medium ${soloBajo ? "text-accent" : "text-muted"}`}>Solo stock bajo</Text>
              </Pressable>
              <View className="flex-row items-center gap-3">
                <Text className="text-xs text-muted">{filtered.length} de {items.length}</Text>
                <Pressable onPress={() => void refresh()} className="flex-row items-center gap-1 rounded-md bg-raised px-3 py-2"><RotateCw size={14} className="text-muted" /><Text className="text-xs font-medium text-muted">Actualizar</Text></Pressable>
              </View>
            </View>
            {error && <Text className="text-sm text-danger">{error}</Text>}
          </View>
        }
        ListEmptyComponent={<EmptyState icon={Package} title={search || soloBajo ? "Sin resultados" : "Aún no hay repuestos"} description={search || soloBajo ? "Probá con otra búsqueda o quitá el filtro de stock bajo." : "Cargá el primer repuesto para controlar el inventario."} action={!search && !soloBajo ? <Button onPress={openCreate}>+ Nuevo repuesto</Button> : <Button variant="secondary" onPress={() => { setSearch(""); setSoloBajo(false); }}>Limpiar filtros</Button>} />}
        renderItem={({ item: repuesto }) => (
          <Card className="p-4">
            <View className="flex-row items-start gap-3">
              <View className="flex-1 min-w-0">
                <Text className="font-semibold text-fg" numberOfLines={1}>{repuesto.nombre}</Text>
                <Text className="mt-1 text-xs text-muted">{repuesto.codigo}{repuesto.categoria ? ` · ${repuesto.categoria}` : ""}</Text>
                <View className="mt-2 flex-row flex-wrap gap-x-4 gap-y-1">
                  <Text className="text-sm text-muted">Venta <Text className="font-medium text-fg">{formatMoney(repuesto.precio_venta)}</Text></Text>
                  <Text className={`text-sm font-semibold ${repuesto.stock <= repuesto.stock_minimo ? "text-accent" : "text-ok"}`}>Stock {repuesto.stock} / {repuesto.stock_minimo}</Text>
                </View>
              </View>
              <Pressable onPress={() => { setStockTarget(repuesto); setStockDelta(""); }} className="p-2"><PackagePlus size={19} className="text-primary" /></Pressable>
              <Pressable onPress={() => openEdit(repuesto)} className="p-2"><Pencil size={18} className="text-muted" /></Pressable>
              <Pressable onPress={() => confirmDelete(repuesto)} className="p-2"><Trash2 size={18} className="text-danger" /></Pressable>
            </View>
          </Card>
        )}
      />

      <Dialog visible={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? "Editar repuesto" : "Nuevo repuesto"}>
        <View className="gap-4">
          <Field label="Código *" value={form.codigo} onChangeText={(value) => setForm({ ...form, codigo: value })} placeholder="ACE-001" autoCapitalize="characters" />
          <Field label="Nombre *" value={form.nombre} onChangeText={(value) => setForm({ ...form, nombre: value })} placeholder="Filtro de aceite" />
          <Field label="Categoría" value={form.categoria} onChangeText={(value) => setForm({ ...form, categoria: value })} placeholder="Mantenimiento" />
          <Field label="Ubicación" value={form.ubicacion} onChangeText={(value) => setForm({ ...form, ubicacion: value })} placeholder="Estante A1" />
          <Field label="Precio compra" value={form.precio_compra} onChangeText={(value) => setForm({ ...form, precio_compra: value })} keyboardType="numeric" placeholder="0" />
          <Field label="Precio venta" value={form.precio_venta} onChangeText={(value) => setForm({ ...form, precio_venta: value })} keyboardType="numeric" placeholder="0" />
          <Field label="Stock" value={form.stock} onChangeText={(value) => setForm({ ...form, stock: value })} keyboardType="numeric" placeholder="0" />
          <Field label="Stock mínimo" value={form.stock_minimo} onChangeText={(value) => setForm({ ...form, stock_minimo: value })} keyboardType="numeric" placeholder="5" />
          <Field label="Descripción" value={form.descripcion} onChangeText={(value) => setForm({ ...form, descripcion: value })} placeholder="Descripción" multiline numberOfLines={3} />
          <Button onPress={handleSave} disabled={saving}>{saving ? "Guardando..." : "Guardar repuesto"}</Button>
        </View>
      </Dialog>

      <Dialog visible={Boolean(stockTarget)} onClose={() => setStockTarget(null)} title={`Ajustar stock: ${stockTarget?.nombre ?? ""}`}>
        <View className="gap-4">
          <Text className="text-sm text-muted">Stock actual: <Text className="font-semibold text-fg">{stockTarget?.stock ?? 0}</Text> · Mínimo: <Text className="font-semibold text-fg">{stockTarget?.stock_minimo ?? 0}</Text></Text>
          <Field label="Cantidad" hint="Usá un número negativo para descontar stock." value={stockDelta} onChangeText={setStockDelta} keyboardType="numeric" placeholder="10" />
          <Button onPress={handleStockChange} disabled={stockSaving}>{stockSaving ? "Actualizando..." : "Aplicar ajuste"}</Button>
        </View>
      </Dialog>
    </View>
  );
}
