import { useState } from "react";
import { FlatList, Pressable, RefreshControl, Switch, Text, View } from "react-native";
import { Pencil, Plus, UserCog } from "lucide-react-native";
import { useCollection } from "../../hooks/useCollection";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { getErrorMessage } from "../../lib/errors";
import type { Rol, User } from "../../lib/types";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Dialog } from "../../components/ui/Dialog";
import { EmptyState } from "../../components/ui/EmptyState";
import { Field } from "../../components/ui/Field";
import { SelectField } from "../../components/ui/SelectField";
import { Spinner } from "../../components/ui/Spinner";
import { showToast } from "../../components/ui/Toast";

const ROL_LABELS: Record<Rol, string> = {
  admin: "Admin",
  recepcionista: "Recepción",
  tecnico: "Taller",
};

const ROL_VARIANT: Record<Rol, "info" | "success" | "warning"> = {
  admin: "info",
  recepcionista: "success",
  tecnico: "warning",
};

const ROL_OPTIONS = [
  { value: "admin", label: "Admin", description: "Acceso total, incluidos usuarios e historial" },
  { value: "recepcionista", label: "Recepción", description: "Clientes, órdenes y facturación" },
  { value: "tecnico", label: "Taller", description: "Solo sus órdenes asignadas" },
];

type CreateForm = { email: string; nombre: string; password: string; rol: Rol };
type EditForm = { nombre: string; rol: Rol; activo: boolean };

export default function UsuariosScreen() {
  const { user: actual } = useAuth();
  const usuarios = useCollection<User>("/api/usuarios", "Error cargando usuarios");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<CreateForm>({ email: "", nombre: "", password: "", rol: "recepcionista" });
  const [editing, setEditing] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ nombre: "", rol: "recepcionista", activo: true });
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!form.email.trim()) {
      showToast("error", "El email es requerido");
      return;
    }
    if (form.password.length < 6) {
      showToast("error", "La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setSaving(true);
    try {
      await api("/api/usuarios", { method: "POST", body: form });
      setDialogOpen(false);
      setForm({ email: "", nombre: "", password: "", rol: "recepcionista" });
      showToast("success", "Usuario creado");
      await usuarios.refresh();
    } catch (error) {
      showToast("error", getErrorMessage(error, "Error creando usuario"));
    } finally {
      setSaving(false);
    }
  }

  function openEdit(usuario: User) {
    setEditing(usuario);
    setEditForm({ nombre: usuario.nombre, rol: usuario.rol, activo: usuario.activo });
  }

  async function handleUpdate() {
    if (!editing) return;
    setSaving(true);
    try {
      await api(`/api/usuarios/${editing.id}`, { method: "PATCH", body: editForm });
      setEditing(null);
      showToast("success", "Usuario actualizado");
      await usuarios.refresh();
    } catch (error) {
      showToast("error", getErrorMessage(error, "Error actualizando usuario"));
    } finally {
      setSaving(false);
    }
  }

  if (usuarios.loading && usuarios.items.length === 0) return <Spinner text="Cargando usuarios..." />;

  return (
    <View className="flex-1 bg-canvas">
      <FlatList
        data={usuarios.items}
        keyExtractor={(usuario) => String(usuario.id)}
        refreshControl={<RefreshControl refreshing={usuarios.loading} onRefresh={usuarios.refresh} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 12 }}
        ListHeaderComponent={
          <View className="gap-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-2xl font-semibold tracking-tight text-fg">Usuarios</Text>
                <Text className="mt-1 text-sm text-muted">Cuentas del taller y sus permisos</Text>
              </View>
              <Button size="sm" onPress={() => setDialogOpen(true)}><Plus size={16} className="text-primary-fg" /><Text className="text-primary-fg font-semibold">Nuevo</Text></Button>
            </View>
            {usuarios.error && <Text className="text-sm text-danger">{usuarios.error}</Text>}
          </View>
        }
        ListEmptyComponent={<EmptyState icon={UserCog} title="Sin usuarios" description="Creá la primera cuenta del taller." action={<Button onPress={() => setDialogOpen(true)}>+ Nuevo usuario</Button>} />}
        renderItem={({ item: usuario }) => (
          <Card className="p-4">
            <View className="flex-row items-center gap-3">
              <View className="flex-1 min-w-0">
                <Text className="font-semibold text-fg" numberOfLines={1}>{usuario.nombre || usuario.email}</Text>
                <Text className="mt-0.5 text-xs text-muted" numberOfLines={1}>{usuario.email}</Text>
                <View className="mt-2 flex-row items-center gap-2">
                  <Badge label={ROL_LABELS[usuario.rol]} variant={ROL_VARIANT[usuario.rol]} />
                  {!usuario.activo && <Badge label="Desactivado" variant="danger" />}
                  {usuario.id === actual?.id && <Badge label="Vos" />}
                </View>
              </View>
              <Pressable onPress={() => openEdit(usuario)} className="p-2"><Pencil size={18} className="text-muted" /></Pressable>
            </View>
          </Card>
        )}
      />

      <Dialog visible={dialogOpen} onClose={() => setDialogOpen(false)} title="Nuevo usuario">
        <View className="gap-4">
          <Field label="Email *" value={form.email} onChangeText={(value) => setForm({ ...form, email: value })} placeholder="persona@motek.local" autoCapitalize="none" keyboardType="email-address" />
          <Field label="Nombre" value={form.nombre} onChangeText={(value) => setForm({ ...form, nombre: value })} placeholder="Nombre y apellido" />
          <Field label="Contraseña *" value={form.password} onChangeText={(value) => setForm({ ...form, password: value })} placeholder="Mínimo 6 caracteres" secureTextEntry />
          <SelectField label="Rol" value={form.rol} options={ROL_OPTIONS} onChange={(value) => setForm({ ...form, rol: value as Rol })} />
          <Button onPress={handleCreate} disabled={saving}>{saving ? "Creando..." : "Crear usuario"}</Button>
        </View>
      </Dialog>

      <Dialog visible={Boolean(editing)} onClose={() => setEditing(null)} title={editing ? `Editar: ${editing.nombre || editing.email}` : "Editar usuario"}>
        <View className="gap-4">
          <Field label="Nombre" value={editForm.nombre} onChangeText={(value) => setEditForm({ ...editForm, nombre: value })} placeholder="Nombre y apellido" />
          <SelectField label="Rol" value={editForm.rol} options={ROL_OPTIONS} disabled={editing?.id === actual?.id} onChange={(value) => setEditForm({ ...editForm, rol: value as Rol })} />
          <View className="flex-row items-center justify-between rounded-lg border border-border bg-raised px-3 py-3">
            <View className="flex-1 pr-3">
              <Text className="text-sm font-medium text-fg">Acceso activo</Text>
              <Text className="text-xs text-muted">Un usuario desactivado no puede iniciar sesión</Text>
            </View>
            <Switch value={editForm.activo} onValueChange={(value) => setEditForm({ ...editForm, activo: value })} disabled={editing?.id === actual?.id} />
          </View>
          {editing?.id === actual?.id && <Text className="text-xs text-subtle">No podés cambiar tu propio rol ni desactivar tu cuenta.</Text>}
          <Button onPress={handleUpdate} disabled={saving}>{saving ? "Guardando..." : "Guardar cambios"}</Button>
        </View>
      </Dialog>
    </View>
  );
}
