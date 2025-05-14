"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useColorScheme } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Colors from "@/constants/Colors"

type ThemeMode = "light" | "dark" | "system"

interface ThemeContextType {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  colors: typeof Colors.light | typeof Colors.dark
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme() || "light"
  const [mode, setModeState] = useState<ThemeMode>("system")

  useEffect(() => {
    // Load saved theme preference
    const loadThemePreference = async () => {
      try {
        const savedMode = await AsyncStorage.getItem("themeMode")
        if (savedMode && (savedMode === "light" || savedMode === "dark" || savedMode === "system")) {
          setModeState(savedMode as ThemeMode)
        }
      } catch (error) {
        console.error("Failed to load theme preference:", error)
      }
    }

    loadThemePreference()
  }, [])

  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode)
    try {
      await AsyncStorage.setItem("themeMode", newMode)
    } catch (error) {
      console.error("Failed to save theme preference:", error)
    }
  }

  // Determine the actual color scheme based on mode
  const actualColorScheme = mode === "system" ? systemColorScheme : mode
  const isDark = actualColorScheme === "dark"
  const colors = isDark ? Colors.dark : Colors.light

  const value = {
    mode,
    setMode,
    colors,
    isDark,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
