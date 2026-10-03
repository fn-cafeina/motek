import { Text, View } from "react-native";
import { Button } from "./Button";
import { Dialog } from "./Dialog";

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmDialog({ visible, title, message, confirmLabel = "Eliminar", onConfirm, onCancel, loading = false }: ConfirmDialogProps) {
  return (
    <Dialog visible={visible} onClose={() => { if (!loading) onCancel(); }} title={title}>
      <View className="gap-4">
        <Text className="text-sm text-muted">{message}</Text>
        <View className="flex-row justify-end gap-3">
          <Button variant="secondary" onPress={onCancel} disabled={loading}>Cancelar</Button>
          <Button variant="danger" onPress={onConfirm} loading={loading}>{confirmLabel}</Button>
        </View>
      </View>
    </Dialog>
  );
}
