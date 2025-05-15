import type React from "react"
import { StyleSheet, View, type ViewStyle } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

type SafeAreaWrapperProps = {
  children: React.ReactNode
  style?: ViewStyle
  edges?: Array<"top" | "right" | "bottom" | "left">
}

export default function SafeAreaWrapper({
  children,
  style,
  edges = ["top", "right", "bottom", "left"],
}: SafeAreaWrapperProps) {
  const insets = useSafeAreaInsets()

  const safeAreaStyle = {
    paddingTop: edges.includes("top") ? insets.top : 0,
    paddingRight: edges.includes("right") ? insets.right : 0,
    paddingBottom: edges.includes("bottom") ? insets.bottom : 0,
    paddingLeft: edges.includes("left") ? insets.left : 0,
  }

  return <View style={[styles.container, safeAreaStyle, style]}>{children}</View>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
