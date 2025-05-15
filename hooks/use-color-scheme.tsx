"use client"

import { useColorScheme as useNativeColorScheme } from "react-native"
import { useTheme } from "@/components/theme-provider"

export function useColorScheme() {
  const { theme } = useTheme()
  const nativeColorScheme = useNativeColorScheme()

  if (theme === "system") {
    return nativeColorScheme
  }

  return theme
}
