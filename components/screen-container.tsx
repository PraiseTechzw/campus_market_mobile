"use client"

import type React from "react"
import { StyleSheet, View, type ViewProps, RefreshControl, ScrollView } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTheme } from "@/providers/theme-provider"
import OfflineBanner from "./offline-banner"
import { useNetwork } from "@/providers/network-provider"

interface ScreenContainerProps extends ViewProps {
  children: React.ReactNode
  scrollable?: boolean
  refreshing?: boolean
  onRefresh?: () => void
  showOfflineBanner?: boolean
  contentContainerStyle?: object
}

export default function ScreenContainer({
  children,
  scrollable = false,
  refreshing = false,
  onRefresh,
  showOfflineBanner = true,
  contentContainerStyle,
  style,
  ...props
}: ScreenContainerProps) {
  const { colors } = useTheme()
  const { isConnected } = useNetwork()

  const content = (
    <>
      {showOfflineBanner && !isConnected && <OfflineBanner />}
      {scrollable ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.tint]} />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.container, style]} {...props}>
          {children}
        </View>
      )}
    </>
  )

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top"]}>
      {content}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
})
