"use client"

import { useColorScheme as useNativeColorScheme } from "react-native"
import { useTheme } from "@/components/theme-provider"

export function useColorScheme() {
  const nativeColorScheme = useNativeColorScheme()
  
  try {
    const { theme } = useTheme()
    
    if (theme === "system") {
      return nativeColorScheme
    }
    
    return theme
  } catch (error) {
    // Fallback to native color scheme if ThemeProvider is not available
    return nativeColorScheme
  }
}
