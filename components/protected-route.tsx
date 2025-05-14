"use client"

import type React from "react"

import { useEffect } from "react"
import { View, Text, ActivityIndicator, StyleSheet } from "react-native"
import { router } from "expo-router"
import { useAuth } from "@/providers/auth-provider"
import { useTheme } from "@/providers/theme-provider"
import Button from "@/components/button"

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, profile, loading, initialized, isAdmin } = useAuth()
  const { colors } = useTheme()

  useEffect(() => {
    if (initialized && !loading) {
      if (!user) {
        router.replace("/(auth)/login")
      } else if (requireAdmin && !isAdmin()) {
        router.replace("/")
      }
    }
  }, [user, profile, loading, initialized, requireAdmin, isAdmin])

  if (loading || !initialized) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
      </View>
    )
  }

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>Sign In Required</Text>
        <Text style={[styles.message, { color: colors.textDim }]}>You need to be signed in to access this page</Text>
        <Button title="Sign In" onPress={() => router.replace("/(auth)/login")} style={styles.button} />
      </View>
    )
  }

  if (requireAdmin && !isAdmin()) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>Access Denied</Text>
        <Text style={[styles.message, { color: colors.textDim }]}>You don't have permission to access this page</Text>
        <Button title="Go Home" onPress={() => router.replace("/")} style={styles.button} />
      </View>
    )
  }

  return <>{children}</>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: "center",
  },
  button: {
    minWidth: 200,
  },
})
