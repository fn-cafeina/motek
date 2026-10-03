import { useState } from "react";
import { Pressable, Text, TextInput, View, type TextInputProps } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { useCSSVariable } from "uniwind";

interface FieldProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  ref?: React.Ref<TextInput>;
}

export function Field({ label, error, hint, className = "", secureTextEntry, ...props }: FieldProps) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(Boolean(secureTextEntry));
  const subtle = useCSSVariable("--color-subtle") as string;

  const border = error ? "border-danger" : focused ? "border-primary" : "border-border-strong";

  return (
    <View className={`gap-1.5 ${className}`}>
      {label ? <Text className="text-sm font-medium text-fg">{label}</Text> : null}
      <View className={`flex-row items-center rounded-lg border ${border} ${focused ? "bg-raised/40" : "bg-surface"}`}>
        <TextInput
          {...props}
          className={`flex-1 px-3 py-2.5 text-base text-fg ${secureTextEntry ? "pr-1" : ""}`}
          placeholderTextColor={subtle}
          secureTextEntry={hidden}
          onFocus={(event) => {
            setFocused(true);
            props.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            props.onBlur?.(event);
          }}
        />
        {secureTextEntry && (
          <Pressable
            onPress={() => setHidden((value) => !value)}
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Mostrar contraseña" : "Ocultar contraseña"}
            className="p-2.5"
            hitSlop={8}
          >
            {hidden ? <Eye size={18} className="text-muted" /> : <EyeOff size={18} className="text-muted" />}
          </Pressable>
        )}
      </View>
      {error ? <Text className="text-xs text-danger">{error}</Text> : hint ? <Text className="text-xs text-muted">{hint}</Text> : null}
    </View>
  );
}
