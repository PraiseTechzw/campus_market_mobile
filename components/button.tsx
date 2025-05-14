"use client"

import type React from "react"
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View, type TouchableOpacityProps } from "react-native"
import { useTheme } from "@/providers/theme-provider"
import { MaterialIcons } from "@expo/vector-icons"
import { globalStyles } from "@/constants/Styles"

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger"
type ButtonSize = "small" | "medium" | "large"

interface ButtonProps extends TouchableOpacityProps {
  title: string
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: string
  iconPosition?: "left" | "right"
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
}

const Button: React.FC<ButtonProps> = ({
  title,
  variant = "primary",
  size = "medium",
  icon,
  iconPosition = "left",
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  ...props
}) => {
  const { colors } = useTheme()

  const getBackgroundColor = () => {
    if (disabled) return colors.disabled

    switch (variant) {
      case "primary":
        return colors.tint
      case "secondary":
        return colors.secondary
      case "outline":
      case "ghost":
        return "transparent"
      case "danger":
        return colors.error
      default:
        return colors.tint
    }
  }

  const getTextColor = () => {
    if (disabled) return colors.textDim

    switch (variant) {
      case "primary":
      case "secondary":
      case "danger":
        return "white"
      case "outline":
      case "ghost":
        return variant === "outline" ? colors.tint : colors.text
      default:
        return "white"
    }
  }

  const getBorderColor = () => {
    if (disabled) return colors.disabled

    switch (variant) {
      case "outline":
        return colors.tint
      default:
        return "transparent"
    }
  }

  const getHeight = () => {
    switch (size) {
      case "small":
        return 36
      case "medium":
        return 44
      case "large":
        return 52
      default:
        return 44
    }
  }

  const getPadding = () => {
    switch (size) {
      case "small":
        return { paddingHorizontal: 12 }
      case "medium":
        return { paddingHorizontal: 16 }
      case "large":
        return { paddingHorizontal: 20 }
      default:
        return { paddingHorizontal: 16 }
    }
  }

  const getFontSize = () => {
    switch (size) {
      case "small":
        return 14
      case "medium":
        return 16
      case "large":
        return 18
      default:
        return 16
    }
  }

  const getIconSize = () => {
    switch (size) {
      case "small":
        return 16
      case "medium":
        return 20
      case "large":
        return 24
      default:
        return 20
    }
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          height: getHeight(),
          borderWidth: variant === "outline" ? 1.5 : 0,
          width: fullWidth ? "100%" : undefined,
        },
        getPadding(),
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size={size === "small" ? "small" : "small"} />
      ) : (
        <View style={styles.contentContainer}>
          {icon && iconPosition === "left" && (
            <MaterialIcons name={icon as any} size={getIconSize()} color={getTextColor()} style={styles.leftIcon} />
          )}

          <Text
            style={[
              styles.text,
              {
                color: getTextColor(),
                fontSize: getFontSize(),
                fontWeight: variant === "ghost" ? "500" : "600",
              },
            ]}
          >
            {title}
          </Text>

          {icon && iconPosition === "right" && (
            <MaterialIcons name={icon as any} size={getIconSize()} color={getTextColor()} style={styles.rightIcon} />
          )}
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    textAlign: "center",
    fontFamily: 'Poppins-Medium',
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
})

export default Button
