import { useWindowDimensions } from "react-native";

export const BP = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export interface Breakpoints {
  width: number;
  height: number;
  sm: boolean;
  md: boolean;
  lg: boolean;
  xl: boolean;
}

export function useBreakpoint(): Breakpoints {
  const { width, height } = useWindowDimensions();
  return {
    width,
    height,
    sm: width >= BP.sm,
    md: width >= BP.md,
    lg: width >= BP.lg,
    xl: width >= BP.xl,
  };
}
