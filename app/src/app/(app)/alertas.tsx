import { useMemo, useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { CheckCircle2, PackagePlus, RotateCw, TriangleAlert } from "lucide-react-native";
import { useCollection } from "../../hooks/useCollection";
import { api } from "../../lib/api";
import { getErrorMessage } from "../../lib/errors";
import type { AlertaStock } from "../../lib/types";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Dialog } from "../../components/ui/Dialog";
import { EmptyState } from "../../components/ui/EmptyState";
import { Field } from "../../components/ui/Field";
import { Spinner } from "../../components/ui/Spinner";
import { showToast } from "../../components/ui/Toast";

export default function AlertasScreen() {
  const { items, loading, error, refresh } = useCollection<AlertaStock>("/api/alertas/stock", "Error cargando alertas");
  const [search, setSearch] = useState("");
  const [target, setTarget] = useState<AlertaStock | null>(null);
  const [delta, setDelta] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => [item.nombre, item.codigo].some((value) => value.toLowerCase().includes(term)));
  }, [items, search]);

  async function handleSurtir() {
    if (!target) return;
    const repuestoId = target.id ?? target.repuesto_id;
    if (!repuestoId) {
      showToast("error", "No se pudo identificar el repuesto");
      return;
    }
    const cantidad = Number(delta);
    if (!cantidad) {
      showToast("error", "Ingresá una cantidad distinta de cero");
      return;
    }
    setSaving(true);
    try {
      await api(`/api/repuestos/${repuestoId}/stock`, { method: "POST", body: { cantidad } });
      setTarget(null);
      setDelta("");
      showToast("success", "Stock actualizado");
      await refresh();
    } catch (caught) {
      showToast("error", getErrorMessage(caught, "Error ajustando stock"));
    } finally {
      setSaving(false);
    }
  }

  if (loading && items.length === 0) return <Spinner text="Cargando alertas..." />;

  return (
    <View className="flex-1 bg-canvas">
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id ?? item.repuesto_id ?? item.codigo)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 12 }}
        ListHeaderComponent={
          <View className="gap-4">
            <View className="flex-row items-center justify-end">
              <Text className="text-sm text-muted">Repuestos que necesitan reposición</Text>
            </View>
            <Field label="" placeholder="Buscar por código o nombre" value={search} onChangeText={setSearch} />
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-muted">{search ? `${filtered.length} de ${items.length} resultados` : `${items.length} en alerta`}</Text>
              <Button size="sm" variant="secondary" onPress={() => void refresh()}><RotateCw size={14} className="text-fg" /><Text className="text-fg font-semibold">Actualizar</Text></Button>
            </View>
            {error && <Text className="text-sm text-danger">{error}</Text>}
          </View>
        }
        ListEmptyComponent={
          search ? (
            <EmptyState icon={TriangleAlert} title="Sin resultados" description="Probá con otro código o nombre." action={<Button variant="secondary" onPress={() => setSearch("")}>Limpiar búsqueda</Button>} />
          ) : (
            <Card className="p-4"><EmptyState icon={CheckCircle2} title="Todo en stock" description="No hay repuestos por debajo del mínimo." /></Card>
          )
        }
        renderItem={({ item: alerta }) => (
          <Card className="p-4">
            <View className="flex-row items-center gap-3">
              <View className="flex-1 min-w-0">
                <Text className="font-semibold text-fg" numberOfLines={1}>{alerta.nombre || alerta.codigo}</Text>
                <Text className="mt-1 text-xs text-muted">{alerta.codigo}</Text>
              </View>
              <View className="items-end">
                <Text className="font-semibold text-accent">{alerta.stock}</Text>
                <Text className="text-xs text-subtle">de {alerta.stock_minimo} mín.</Text>
              </View>
              <Button size="sm" variant="secondary" onPress={() => { setTarget(alerta); setDelta(""); }}><PackagePlus size={14} className="text-fg" /><Text className="text-fg font-semibold">Surtir</Text></Button>
            </View>
          </Card>
        )}
      />

      <Dialog visible={Boolean(target)} onClose={() => !saving && setTarget(null)} title={target ? `Surtir: ${target.nombre || target.codigo}` : "Surtir stock"}>
        <View className="gap-4">
          <Text className="text-sm text-muted">Stock actual: <Text className="font-semibold text-accent">{target?.stock ?? 0}</Text> · Mínimo: <Text className="font-semibold text-fg">{target?.stock_minimo ?? 0}</Text></Text>
          <Field label="Cantidad a sumar" hint="Usá un número negativo para descontar stock." value={delta} onChangeText={setDelta} keyboardType="numeric" placeholder="10" />
          <Button onPress={handleSurtir} disabled={saving}>{saving ? "Actualizando..." : "Aplicar ajuste"}</Button>
        </View>
      </Dialog>
    </View>
  );
}
