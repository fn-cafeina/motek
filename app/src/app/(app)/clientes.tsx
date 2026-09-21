import { useState } from "react";
import { FlatList, Text, View, Pressable, RefreshControl } from "react-native";
import { useCollection } from "../../hooks/useCollection";
import { api } from "../../lib/api";
import { getErrorMessage } from "../../lib/errors";
import type { Cliente } from "../../lib/types";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Dialog } from "../../components/ui/Dialog";
import { Spinner } from "../../components/ui/Spinner";
import { EmptyState } from "../../components/ui/EmptyState";
import { showToast } from "../../components/ui/Toast";
import { Users, Pencil, Trash2 } from "lucide-react-native";

export default function ClientesScreen() {
  const { items, loading, error, refresh } = useCollection<Cliente>("/api/clientes", "Error cargando clientes");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [form, setForm] = useState({ nombre: "", telefono: "", email: "", direccion: "", notas: "" });
  const [saving, setSaving] = useState(false);

  const filtered = items.filter((c) => c.nombre.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()));

  function openCreate() {
    setEditing(null);
    setForm({ nombre: "", telefono: "", email: "", direccion: "", notas: "" });
    setDialogOpen(true);
  }

  function openEdit(c: Cliente) {
    setEditing(c);
    setForm({ nombre: c.nombre, telefono: c.telefono ?? "", email: c.email ?? "", direccion: c.direccion ?? "", notas: c.notas ?? "" });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.nombre.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await api(`/api/clientes/${editing.id}`, { method: "PUT", body: form });
        showToast("success", "Cliente actualizado");
      } else {
        await api("/api/clientes", { method: "POST", body: form });
        showToast("success", "Cliente creado");
      }
      setDialogOpen(false);
      await refresh();
    } catch (e) {
      showToast("error", getErrorMessage(e, "Error guardando cliente"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(c: Cliente) {
    try {
      await api(`/api/clientes/${c.id}`, { method: "DELETE" });
      showToast("success", "Cliente eliminado");
      await refresh();
    } catch (e) {
      showToast("error", getErrorMessage(e, "Error eliminando cliente"));
    }
  }

  if (loading && items.length === 0) return <Spinner text="Cargando clientes..." />;

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      <View className="p-4 pb-2">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100">Clientes</Text>
          <Button size="sm" onPress={openCreate}>+ Nuevo</Button>
        </View>
        <Field label="" placeholder="Buscar clientes..." value={search} onChangeText={setSearch} />
      </View>

      {error && <Text className="text-sm text-red-600 px-4 mb-2">{error}</Text>}

      <FlatList
        data={filtered}
        keyExtractor={(c) => String(c.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 16 }}
        renderItem={({ item: c }) => (
          <Card className="p-4 mb-3">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 mr-3">
                <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">{c.nombre}</Text>
                {c.telefono ? <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">{c.telefono}</Text> : null}
                {c.email ? <Text className="text-sm text-gray-500 dark:text-gray-400">{c.email}</Text> : null}
              </View>
              <View className="flex-row gap-2">
                <Pressable onPress={() => openEdit(c)} className="p-2"><Pencil size={18} className="text-gray-500" /></Pressable>
                <Pressable onPress={() => handleDelete(c)} className="p-2"><Trash2 size={18} className="text-red-500" /></Pressable>
              </View>
            </View>
          </Card>
        )}
        ListEmptyComponent={<EmptyState icon={Users} title="Sin clientes" description="Agregá tu primer cliente." action={<Button onPress={openCreate}>+ Nuevo cliente</Button>} />}
      />

      <Dialog visible={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? "Editar cliente" : "Nuevo cliente"}>
        <View className="gap-4">
          <Field label="Nombre *" value={form.nombre} onChangeText={(v) => setForm({ ...form, nombre: v })} placeholder="Nombre del cliente" />
          <Field label="Teléfono" value={form.telefono} onChangeText={(v) => setForm({ ...form, telefono: v })} placeholder="Teléfono" />
          <Field label="Email" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} placeholder="Email" autoCapitalize="none" keyboardType="email-address" />
          <Field label="Dirección" value={form.direccion} onChangeText={(v) => setForm({ ...form, direccion: v })} placeholder="Dirección" />
          <Field label="Notas" value={form.notas} onChangeText={(v) => setForm({ ...form, notas: v })} placeholder="Notas" multiline numberOfLines={3} />
          <Button onPress={handleSave} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
        </View>
      </Dialog>
    </View>
  );
}
