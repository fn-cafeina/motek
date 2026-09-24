import type { ReactNode } from "react";
import { Pressable, Text, type PressableProps } from "react-native";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

interface ButtonProps extends PressableProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
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

export function Button({ variant = "primary", size = "md", children, className = "", disabled, ...props }: ButtonProps) {
  const content = typeof children === "string" || typeof children === "number"
    ? <Text className={textClasses[variant]}>{children}</Text>
    : children;

  return (
    <Pressable
      className={`flex-row rounded-lg items-center justify-center gap-2 ${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? "opacity-50" : ""} ${className}`}
      disabled={disabled}
      {...props}
    >
      {content}
    </Pressable>
  );
}
