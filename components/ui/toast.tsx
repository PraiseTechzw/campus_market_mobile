"use client"

import { useEffect, useRef } from "react"
import { Animated, StyleSheet, TouchableOpacity, View, Dimensions } from "react-native"
import { Text } from "@/components/themed"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"
import { MaterialIcons } from "@expo/vector-icons"

const { width } = Dimensions.get("window")

export type ToastType = "success" | "error" | "info" | "warning"

export interface ToastProps {
  visible: boolean
  message: string
  type?: ToastType
  duration?: number
  onDismiss?: () => void
}

export function Toast({ visible, message, type = "success", duration = 3000, onDismiss }: ToastProps) {
  const colorScheme = useColorScheme()
  const translateY = useRef(new Animated.Value(-100)).current
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start()

      const timer = setTimeout(() => {
        hideToast()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [visible])

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onDismiss) onDismiss()
    })
  }

  const getIconName = () => {
    switch (type) {
      case "success":
        return "check-circle"
      case "error":
        return "error"
      case "info":
        return "info"
      case "warning":
        return "warning"
      default:
        return "info"
    }
  }

  const getBackgroundColor = () => {
    const colors = Colors[colorScheme ?? "light"]
    switch (type) {
      case "success":
        return colors.success
      case "error":
        return colors.error
      case "info":
        return colors.info
      case "warning":
        return colors.warning
      default:
        return colors.success
    }
  }

  if (!visible) return null

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
          backgroundColor: getBackgroundColor(),
        },
      ]}
    >
      <View style={styles.content}>
        <MaterialIcons name={getIconName()} size={24} color="white" style={styles.icon} />
        <Text style={styles.message}>{message}</Text>
      </View>
      <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
        <MaterialIcons name="close" size={20} color="white" />
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    backgroundColor: "#10b981",
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
    maxWidth: width - 32,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  icon: {
    marginRight: 12,
  },
  message: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  closeButton: {
    marginLeft: 8,
  },
})
