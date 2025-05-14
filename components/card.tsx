"use client"
import { View, StyleSheet, type ViewProps, type ViewStyle } from "react-native"
import { useTheme } from "@/providers/theme-provider"

interface CardProps extends ViewProps {
  variant?: "elevated" | "outlined" | "filled"
  style?: ViewStyle
}

export default function Card({ variant = "elevated", style, children, ...props }: CardProps) {
  const { colors, isDark } = useTheme()

  const getCardStyle = () => {
    switch (variant) {
      case "elevated":
        return {
          backgroundColor: colors.cardBackground,
          shadowColor: isDark ? "#000" : "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 4,
          elevation: 3,
        }
      case "outlined":
        return {
          backgroundColor: colors.cardBackground,
          borderWidth: 1,
          borderColor: colors.border,
        }
      case "filled":
        return {
          backgroundColor: colors.neutral2,
        }
      default:
        return {
          backgroundColor: colors.cardBackground,
        }
    }
  }

  return (
    <View style={[styles.card, getCardStyle(), style]} {...props}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
})
