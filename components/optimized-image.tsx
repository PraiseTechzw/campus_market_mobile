"use client"

import { useState } from "react"
import { Image, type ImageProps, View, ActivityIndicator, StyleSheet } from "react-native"
import { useTheme } from "@/providers/theme-provider"

interface OptimizedImageProps extends Omit<ImageProps, "source"> {
  source: string | { uri: string }
  fallbackSource?: string | { uri: string }
  width?: number
  height?: number
  borderRadius?: number
  resizeMode?: "cover" | "contain" | "stretch" | "repeat" | "center"
}

export default function OptimizedImage({
  source,
  fallbackSource,
  width,
  height,
  borderRadius,
  resizeMode = "cover",
  style,
  ...props
}: OptimizedImageProps) {
  const { colors } = useTheme()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const sourceUri = typeof source === "string" ? source : source.uri
  const fallbackUri = fallbackSource
    ? typeof fallbackSource === "string"
      ? fallbackSource
      : fallbackSource.uri
    : "/placeholder.svg?height=200&width=200"

  const handleLoad = () => {
    setLoading(false)
  }

  const handleError = () => {
    setLoading(false)
    setError(true)
  }

  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.neutral2,
        },
        style,
      ]}
    >
      <Image
        source={{ uri: error ? fallbackUri : sourceUri }}
        style={[
          styles.image,
          {
            width,
            height,
            borderRadius,
            opacity: loading ? 0 : 1,
          },
        ]}
        resizeMode={resizeMode}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.tint} size="small" />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
})
