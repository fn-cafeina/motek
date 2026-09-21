import { Modal, Pressable, View, Text, ScrollView } from "react-native";
import { X } from "lucide-react-native";

interface DialogProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Dialog({ visible, onClose, title, children }: DialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50 items-center justify-center p-4" onPress={onClose}>
        <Pressable className="bg-surface rounded-2xl w-full max-w-md max-h-[85vh]" onPress={(e) => e.stopPropagation()}>
          <View className="flex-row items-center justify-between p-4 border-b border-border">
            <Text className="text-lg font-bold text-fg">{title}</Text>
            <Pressable onPress={onClose} className="p-1">
              <X size={20} className="text-muted" />
            </Pressable>
          </View>
          <ScrollView className="p-4">{children}</ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
