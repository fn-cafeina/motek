import { View, Text, type ViewProps } from "react-native";

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <View className={`bg-surface border border-border rounded-xl ${className}`} {...props}>
      {children}
    </View>
  );
}
