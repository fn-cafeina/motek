import { useMemo, useState } from "react";
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useCollection } from "../../hooks/useCollection";
import { api } from "../../lib/api";
import { getErrorMessage } from "../../lib/errors";
import type { Cliente, Moto } from "../../lib/types";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Dialog } from "../../components/ui/Dialog";
import { EmptyState } from "../../components/ui/EmptyState";
import { Field } from "../../components/ui/Field";
import { Spinner } from "../../components/ui/Spinner";
import { showToast } from "../../components/ui/Toast";
import { Bike, ChevronDown, ChevronRight, Pencil, Plus, Trash2, Users } from "lucide-react-native";

type ClienteForm = { nombre: string; telefono: string; email: string; direccion: string; notas: string };
type MotoForm = { marca: string; modelo: string; anio: string; placa: string; color: string; vin: string; kilometraje: string };

const emptyCliente: ClienteForm = { nombre: "", telefono: "", email: "", direccion: "", notas: "" };
const emptyMoto: MotoForm = { marca: "", modelo: "", anio: "", placa: "", color: "", vin: "", kilometraje: "" };

export default function ClientesScreen() {
  const clientes = useCollection<Cliente>("/api/clientes", "Error cargando clientes");
  const motos = useCollection<Moto>("/api/motos", "Error cargando motos");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [clienteDialog, setClienteDialog] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [clienteForm, setClienteForm] = useState<ClienteForm>(emptyCliente);
  const [savingCliente, setSavingCliente] = useState(false);
  const [motoDialog, setMotoDialog] = useState(false);
  const [motoCliente, setMotoCliente] = useState<Cliente | null>(null);
  const [editingMoto, setEditingMoto] = useState<Moto | null>(null);
  const [motoForm, setMotoForm] = useState<MotoForm>(emptyMoto);
  const [savingMoto, setSavingMoto] = useState(false);

  const motosPorCliente = useMemo(() => {
    const grouped = new Map<number, Moto[]>();
    for (const moto of motos.items) {
      const list = grouped.get(moto.cliente_id) ?? [];
      list.push(moto);
      grouped.set(moto.cliente_id, list);
    }
    return grouped;
  }, [motos.items]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return clientes.items;
    return clientes.items.filter((cliente) => [cliente.nombre, cliente.telefono, cliente.email].some((value) => value.toLowerCase().includes(term)));
  }, [clientes.items, search]);

  function openCreateCliente() {
    setEditingCliente(null);
    setClienteForm(emptyCliente);
    setClienteDialog(true);
  }

  function openEditCliente(cliente: Cliente) {
    setEditingCliente(cliente);
    setClienteForm({ nombre: cliente.nombre, telefono: cliente.telefono ?? "", email: cliente.email ?? "", direccion: cliente.direccion ?? "", notas: cliente.notas ?? "" });
    setClienteDialog(true);
  }

  async function handleSaveCliente() {
    if (!clienteForm.nombre.trim()) {
      showToast("error", "El nombre es requerido");
      return;
    }
    setSavingCliente(true);
    try {
      const editing = Boolean(editingCliente);
      if (editingCliente) {
        await api(`/api/clientes/${editingCliente.id}`, { method: "PUT", body: clienteForm });
      } else {
        await api("/api/clientes", { method: "POST", body: clienteForm });
      }
      setClienteDialog(false);
      setEditingCliente(null);
      showToast("success", editing ? "Cliente actualizado" : "Cliente creado");
      await clientes.refresh();
    } catch (error) {
      showToast("error", getErrorMessage(error, "Error guardando cliente"));
    } finally {
      setSavingCliente(false);
    }
  }

  function confirmDeleteCliente(cliente: Cliente) {
    const motoCount = motosPorCliente.get(cliente.id)?.length ?? 0;
    Alert.alert("Eliminar cliente", `Se eliminarán también sus datos y ${motoCount === 1 ? "su moto" : `sus ${motoCount} motos`}.`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: () => void handleDeleteCliente(cliente) },
    ]);
  }

  async function handleDeleteCliente(cliente: Cliente) {
    try {
      await api(`/api/clientes/${cliente.id}`, { method: "DELETE" });
      if (expandedId === cliente.id) setExpandedId(null);
      showToast("success", "Cliente eliminado");
      await Promise.all([clientes.refresh(), motos.refresh()]);
    } catch (error) {
      showToast("error", getErrorMessage(error, "Error eliminando cliente"));
    }
  }

  function openCreateMoto(cliente: Cliente) {
    setMotoCliente(cliente);
    setEditingMoto(null);
    setMotoForm(emptyMoto);
    setMotoDialog(true);
  }

  function openEditMoto(moto: Moto) {
    setMotoCliente(clientes.items.find((cliente) => cliente.id === moto.cliente_id) ?? null);
    setEditingMoto(moto);
    setMotoForm({ marca: moto.marca, modelo: moto.modelo, anio: String(moto.anio ?? ""), placa: moto.placa ?? "", color: moto.color ?? "", vin: moto.vin ?? "", kilometraje: String(moto.kilometraje ?? "") });
    setMotoDialog(true);
  }

  async function handleSaveMoto() {
    if (!motoCliente || !motoForm.marca.trim()) {
      showToast("error", "La marca es requerida");
      return;
    }
    setSavingMoto(true);
    const body = { ...motoForm, anio: Number(motoForm.anio) || 0, kilometraje: Number(motoForm.kilometraje) || 0 };
    try {
      if (editingMoto) {
        await api(`/api/motos/${editingMoto.id}`, { method: "PUT", body });
        showToast("success", "Moto actualizada");
      } else {
        await api(`/api/motos/${motoCliente.id}`, { method: "POST", body });
        showToast("success", "Moto agregada");
      }
      setMotoDialog(false);
      setEditingMoto(null);
      await Promise.all([clientes.refresh(), motos.refresh()]);
    } catch (error) {
      showToast("error", getErrorMessage(error, "Error guardando moto"));
    } finally {
      setSavingMoto(false);
    }
  }

  function confirmDeleteMoto(moto: Moto) {
    Alert.alert("Eliminar moto", "Se eliminará esta moto del cliente.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: () => void handleDeleteMoto(moto) },
    ]);
  }

  async function handleDeleteMoto(moto: Moto) {
    try {
      await api(`/api/motos/${moto.id}`, { method: "DELETE" });
      showToast("success", "Moto eliminada");
      await Promise.all([clientes.refresh(), motos.refresh()]);
    } catch (error) {
      showToast("error", getErrorMessage(error, "Error eliminando moto"));
    }
  }

  if (clientes.loading && clientes.items.length === 0) return <Spinner text="Cargando clientes..." />;

  const header = (
    <View className="gap-4">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-semibold tracking-tight text-fg">Clientes</Text>
          <Text className="mt-1 text-sm text-muted">Directorio y motos del taller</Text>
        </View>
        <Button size="sm" onPress={openCreateCliente}>+ Nuevo</Button>
      </View>
      <Field label="" placeholder="Buscar por nombre, teléfono o email" value={search} onChangeText={setSearch} />
      {(clientes.error || motos.error) && <Text className="text-sm text-danger">{clientes.error ?? motos.error}</Text>}
    </View>
  );

  return (
    <View className="flex-1 bg-canvas">
      <FlatList
        data={filtered}
        keyExtractor={(cliente) => String(cliente.id)}
        refreshControl={<RefreshControl refreshing={clientes.loading || motos.loading} onRefresh={async () => { await Promise.all([clientes.refresh(), motos.refresh()]); }} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 12 }}
        ListHeaderComponent={header}
        ListEmptyComponent={<EmptyState icon={Users} title="Sin clientes" description={search ? "Probá con otro término de búsqueda." : "Agregá tu primer cliente para empezar a trabajar."} action={!search ? <Button onPress={openCreateCliente}>+ Nuevo cliente</Button> : undefined} />}
        renderItem={({ item: cliente }) => {
          const clienteMotos = motosPorCliente.get(cliente.id) ?? [];
          const expanded = expandedId === cliente.id;
          return (
            <Card className="overflow-hidden">
              <Pressable onPress={() => setExpandedId(expanded ? null : cliente.id)} className="flex-row items-center gap-3 p-4 active:bg-raised">
                <View className="flex-1 min-w-0">
                  <Text className="text-base font-semibold text-fg" numberOfLines={1}>{cliente.nombre}</Text>
                  <Text className="mt-1 text-sm text-muted" numberOfLines={1}>{[cliente.telefono, cliente.email].filter(Boolean).join(" · ") || "Sin datos de contacto"}</Text>
                </View>
                <View className="items-end gap-1">
                  <Text className="text-xs font-medium text-primary">{clienteMotos.length} {clienteMotos.length === 1 ? "moto" : "motos"}</Text>
                  {expanded ? <ChevronDown size={18} className="text-subtle" /> : <ChevronRight size={18} className="text-subtle" />}
                </View>
              </Pressable>
              {expanded && (
                <View className="border-t border-border bg-raised/40 px-4 pb-3">
                  <View className="flex-row items-center justify-between py-3">
                    <Text className="text-sm font-semibold text-fg">Motos</Text>
                    <Button size="sm" variant="secondary" onPress={() => openCreateMoto(cliente)}><Plus size={14} className="text-fg" /><Text className="text-fg font-semibold">Agregar</Text></Button>
                  </View>
                  {clienteMotos.length === 0 ? (
                    <Text className="pb-3 text-sm text-muted">Este cliente todavía no tiene motos cargadas.</Text>
                  ) : clienteMotos.map((moto) => (
                    <View key={moto.id} className="flex-row items-center gap-3 border-t border-border py-3">
                      <Bike size={18} className="text-subtle" />
                      <View className="flex-1 min-w-0">
                        <Text className="font-medium text-fg">{moto.marca} {moto.modelo}</Text>
                        <Text className="text-xs text-muted">{[moto.placa, moto.color, moto.anio ? String(moto.anio) : ""].filter(Boolean).join(" · ")}</Text>
                      </View>
                      <Pressable onPress={() => openEditMoto(moto)} className="p-2"><Pencil size={17} className="text-muted" /></Pressable>
                      <Pressable onPress={() => confirmDeleteMoto(moto)} className="p-2"><Trash2 size={17} className="text-danger" /></Pressable>
                    </View>
                  ))}
                  <View className="flex-row justify-end gap-3 border-t border-border pt-3">
                    <Pressable onPress={() => openEditCliente(cliente)} className="px-2 py-2"><Text className="text-sm font-medium text-primary">Editar cliente</Text></Pressable>
                    <Pressable onPress={() => confirmDeleteCliente(cliente)} className="px-2 py-2"><Text className="text-sm font-medium text-danger">Eliminar cliente</Text></Pressable>
                  </View>
                </View>
              )}
            </Card>
          );
        }}
      />

      <Dialog visible={clienteDialog} onClose={() => setClienteDialog(false)} title={editingCliente ? "Editar cliente" : "Nuevo cliente"}>
        <View className="gap-4">
          <Field label="Nombre *" value={clienteForm.nombre} onChangeText={(value) => setClienteForm({ ...clienteForm, nombre: value })} placeholder="Nombre del cliente" />
          <Field label="Teléfono" value={clienteForm.telefono} onChangeText={(value) => setClienteForm({ ...clienteForm, telefono: value })} placeholder="Teléfono" />
          <Field label="Email" value={clienteForm.email} onChangeText={(value) => setClienteForm({ ...clienteForm, email: value })} placeholder="Email" autoCapitalize="none" keyboardType="email-address" />
          <Field label="Dirección" value={clienteForm.direccion} onChangeText={(value) => setClienteForm({ ...clienteForm, direccion: value })} placeholder="Dirección" />
          <Field label="Notas" value={clienteForm.notas} onChangeText={(value) => setClienteForm({ ...clienteForm, notas: value })} placeholder="Notas" multiline numberOfLines={3} />
          <Button onPress={handleSaveCliente} disabled={savingCliente}>{savingCliente ? "Guardando..." : "Guardar cliente"}</Button>
        </View>
      </Dialog>

      <Dialog visible={motoDialog} onClose={() => setMotoDialog(false)} title={editingMoto ? "Editar moto" : `Agregar moto a ${motoCliente?.nombre ?? "cliente"}`}>
        <View className="gap-4">
          <Field label="Marca *" value={motoForm.marca} onChangeText={(value) => setMotoForm({ ...motoForm, marca: value })} placeholder="Honda" />
          <Field label="Modelo" value={motoForm.modelo} onChangeText={(value) => setMotoForm({ ...motoForm, modelo: value })} placeholder="CBR600" />
          <Field label="Año" value={motoForm.anio} onChangeText={(value) => setMotoForm({ ...motoForm, anio: value })} placeholder="2020" keyboardType="numeric" />
          <Field label="Placa" value={motoForm.placa} onChangeText={(value) => setMotoForm({ ...motoForm, placa: value })} placeholder="AB123CD" autoCapitalize="characters" />
          <Field label="Color" value={motoForm.color} onChangeText={(value) => setMotoForm({ ...motoForm, color: value })} placeholder="Negra" />
          <Field label="VIN" value={motoForm.vin} onChangeText={(value) => setMotoForm({ ...motoForm, vin: value })} placeholder="Número de chasis" autoCapitalize="characters" />
          <Field label="Kilometraje" value={motoForm.kilometraje} onChangeText={(value) => setMotoForm({ ...motoForm, kilometraje: value })} placeholder="0" keyboardType="numeric" />
          <Button onPress={handleSaveMoto} disabled={savingMoto}>{savingMoto ? "Guardando..." : "Guardar moto"}</Button>
        </View>
      </Dialog>
    </View>
  );
}
