import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, type PressableProps } from "react-native";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

interface ButtonProps extends PressableProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary active:bg-primary-hover",
  secondary: "bg-raised active:bg-border",
  ghost: "bg-transparent active:bg-raised",
  danger: "bg-danger active:opacity-90",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5",
  md: "px-4 py-2.5",
};

const textClasses: Record<ButtonVariant, string> = {
  primary: "text-primary-fg font-semibold",
  secondary: "text-fg font-semibold",
  ghost: "text-fg font-semibold",
  danger: "text-danger-fg font-semibold",
};

const spinnerClasses: Record<ButtonVariant, string> = {
  primary: "text-primary-fg",
  secondary: "text-fg",
  ghost: "text-fg",
  danger: "text-danger-fg",
};

export function Button({ variant = "primary", size = "md", loading = false, children, className = "", disabled, ...props }: ButtonProps) {
  const content = typeof children === "string" || typeof children === "number"
    ? <Text className={textClasses[variant]}>{children}</Text>
    : children;

  return (
    <Pressable
      className={`flex-row rounded-lg items-center justify-center gap-2 ${variantClasses[variant]} ${sizeClasses[size]} ${disabled || loading ? "opacity-50" : ""} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <ActivityIndicator size="small" className={spinnerClasses[variant]} />}
      {content}
    </Pressable>
  );
}
