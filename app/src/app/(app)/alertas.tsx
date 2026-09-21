import { useState } from "react";
import { FlatList, Text, View, RefreshControl } from "react-native";
import { useCollection } from "../../hooks/useCollection";
import { api } from "../../lib/api";
import { getErrorMessage } from "../../lib/errors";
import type { AlertaStock } from "../../lib/types";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Dialog } from "../../components/ui/Dialog";
import { Spinner } from "../../components/ui/Spinner";
import { EmptyState } from "../../components/ui/EmptyState";
import { showToast } from "../../components/ui/Toast";
import { TriangleAlert } from "lucide-react-native";

export default function AlertasScreen() {
  const { items, loading, error, refresh } = useCollection<AlertaStock>("/api/alertas/stock", "Error cargando alertas");
  const [search, setSearch] = useState("");
  const [surtirItem, setSurtirItem] = useState<AlertaStock | null>(null);
  const [cantidad, setCantidad] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = items.filter((a) => a.nombre.toLowerCase().includes(search.toLowerCase()) || a.codigo.toLowerCase().includes(search.toLowerCase()));

  async function handleSurtir() {
    if (!surtirItem || !cantidad) return;
    setSaving(true);
    try {
      await api(`/api/repuestos/${surtirItem.repuesto_id}/stock`, { method: "POST", body: { cantidad: Number(cantidad) } });
      showToast("success", "Stock actualizado");
      setSurtirItem(null);
      setCantidad("");
      await refresh();
    } catch (e) {
      showToast("error", getErrorMessage(e, "Error actualizando stock"));
    } finally {
      setSaving(false);
    }
  }

  if (loading && items.length === 0) return <Spinner text="Cargando alertas..." />;

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      <View className="p-4 pb-2">
        <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Alertas de stock</Text>
        <Field label="" placeholder="Buscar alertas..." value={search} onChangeText={setSearch} />
      </View>

      {error && <Text className="text-sm text-red-600 px-4 mb-2">{error}</Text>}

      <FlatList
        data={filtered}
        keyExtractor={(a) => String(a.repuesto_id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 16 }}
        renderItem={({ item: a }) => (
          <Card className="p-4 mb-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">{a.nombre}</Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">{a.codigo}</Text>
                <View className="flex-row gap-3 mt-2">
                  <Text className="text-sm text-red-600 font-medium">Stock: {a.stock}</Text>
                  <Text className="text-sm text-gray-500 dark:text-gray-400">Mínimo: {a.stock_minimo}</Text>
                </View>
              </View>
              <Button size="sm" variant="secondary" onPress={() => { setSurtirItem(a); setCantidad(""); }}>Surtir</Button>
            </View>
          </Card>
        )}
        ListEmptyComponent={<EmptyState icon={TriangleAlert} title="Sin alertas" description="No hay stock bajo en este momento." />}
      />

      <Dialog visible={!!surtirItem} onClose={() => setSurtirItem(null)} title="Surtir stock">
        <View className="gap-4">
          {surtirItem && (
            <Text className="text-sm text-gray-600 dark:text-gray-400">{surtirItem.nombre} — Stock actual: {surtirItem.stock}</Text>
          )}
          <Field label="Cantidad a agregar" value={cantidad} onChangeText={setCantidad} placeholder="0" keyboardType="numeric" />
          <Button onPress={handleSurtir} disabled={saving}>{saving ? "Guardando..." : "Confirmar"}</Button>
        </View>
      </Dialog>
    </View>
  );
}
