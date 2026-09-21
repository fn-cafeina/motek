import { useEffect, useState } from "react";
import { Animated, Text, View } from "react-native";
import { CheckCircle2, X, OctagonAlert, Info } from "lucide-react-native";

interface ToastItem {
  id: number;
  type: "success" | "error" | "info";
  message: string;
}

let toastId = 0;
let listeners: ((toast: ToastItem) => void)[] = [];

export function showToast(type: ToastItem["type"], message: string) {
  const toast = { id: ++toastId, type, message };
  listeners.forEach((l) => l(toast));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (toast: ToastItem) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 3000);
    };
    listeners.push(handler);
    return () => {
      listeners = listeners.filter((l) => l !== handler);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <View className="absolute top-12 left-4 right-4 z-50 gap-2">
      {toasts.map((toast) => (
        <ToastRow key={toast.id} toast={toast} onDismiss={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))} />
      ))}
    </View>
  );
}

function ToastRow({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const [opacity] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, []);

  const icons = { success: CheckCircle2, error: OctagonAlert, info: Info };
  const colors = { success: "bg-green-50 border-green-300", error: "bg-red-50 border-red-300", info: "bg-blue-50 border-blue-300" };
  const textColors = { success: "text-green-800", error: "text-red-800", info: "text-blue-800" };
  const Icon = icons[toast.type];

  return (
    <Animated.View style={{ opacity }} className={`flex-row items-center gap-3 p-3 rounded-lg border ${colors[toast.type]}`}>
      <Icon size={18} className={textColors[toast.type]} />
      <Text className={`flex-1 text-sm ${textColors[toast.type]}`}>{toast.message}</Text>
      <X size={16} className="text-gray-400" onPress={onDismiss} />
    </Animated.View>
  );
}
