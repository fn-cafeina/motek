import { View, Text, type ViewProps } from "react-native";

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <View className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl ${className}`} {...props}>
      {children}
    </View>
  );
}
