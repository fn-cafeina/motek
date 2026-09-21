import { Pressable, Text, type PressableProps } from "react-native";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

interface ButtonProps extends PressableProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-blue-600 active:bg-blue-700",
  secondary: "bg-gray-200 active:bg-gray-300 dark:bg-gray-700 dark:active:bg-gray-600",
  ghost: "bg-transparent active:bg-gray-100 dark:active:bg-gray-800",
  danger: "bg-red-600 active:bg-red-700",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5",
  md: "px-4 py-2.5",
};

const textClasses: Record<ButtonVariant, string> = {
  primary: "text-white font-semibold",
  secondary: "text-gray-900 dark:text-gray-100 font-semibold",
  ghost: "text-gray-700 dark:text-gray-300 font-semibold",
  danger: "text-white font-semibold",
};

export function Button({ variant = "primary", size = "md", children, className = "", disabled, ...props }: ButtonProps) {
  return (
    <Pressable
      className={`rounded-lg items-center ${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? "opacity-50" : ""} ${className}`}
      disabled={disabled}
      {...props}
    >
      <Text className={textClasses[variant]}>{children}</Text>
    </Pressable>
  );
}
