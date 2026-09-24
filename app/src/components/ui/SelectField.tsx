import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { ChevronDown } from "lucide-react-native";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

export function SelectField({ label, value, options, placeholder = "Seleccionar", disabled, onChange }: SelectFieldProps) {
  const [visible, setVisible] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <>
      <View className="gap-1.5">
        <Text className="text-sm font-medium text-fg">{label}</Text>
        <Pressable
          onPress={() => !disabled && setVisible(true)}
          disabled={disabled}
          className={`min-h-11 flex-row items-center justify-between rounded-lg border border-border-strong bg-surface px-3 py-2 ${disabled ? "opacity-50" : "active:border-primary"}`}
        >
          <View className="flex-1">
            <Text className={selected ? "text-base text-fg" : "text-base text-subtle"}>{selected?.label ?? placeholder}</Text>
            {selected?.description && <Text className="text-xs text-muted">{selected.description}</Text>}
          </View>
          <ChevronDown size={18} className="text-muted" />
        </Pressable>
      </View>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable className="flex-1 items-center justify-end bg-black/50 p-3" onPress={() => setVisible(false)}>
          <Pressable className="w-full max-w-lg max-h-[75vh] overflow-hidden rounded-t-2xl border border-border bg-surface" onPress={(event) => event.stopPropagation()}>
            <View className="border-b border-border px-4 py-3">
              <Text className="text-lg font-semibold text-fg">{label}</Text>
            </View>
            <View className="max-h-[60vh] py-2">
              {options.length === 0 ? (
                <Text className="px-4 py-8 text-center text-sm text-muted">No hay opciones disponibles.</Text>
              ) : options.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    onChange(option.value);
                    setVisible(false);
                  }}
                  className="border-b border-border px-4 py-3 last:border-b-0 active:bg-raised"
                >
                  <Text className="font-medium text-fg">{option.label}</Text>
                  {option.description && <Text className="mt-0.5 text-sm text-muted">{option.description}</Text>}
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
