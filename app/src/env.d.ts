declare module "*.css" {}

import "react-native";

declare module "react-native" {
  interface ViewProps {
    className?: string;
  }
  interface TextProps {
    className?: string;
  }
  interface TextInputProps {
    className?: string;
  }
  interface ScrollViewProps {
    className?: string;
  }
  interface PressableProps {
    className?: string;
  }
  interface FlatListProps<ItemT> {
    contentContainerClassName?: string;
    ListHeaderComponentClassName?: string;
    ListFooterComponentClassName?: string;
    columnWrapperClassName?: string;
  }
}

declare module "uniwind/metro" {
  export function withUniwindConfig(config: any, options?: any): any;
}
