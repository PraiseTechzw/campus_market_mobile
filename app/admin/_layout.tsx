"use client"

import { Stack } from "expo-router"

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="users" />
      <Stack.Screen name="products" />
      <Stack.Screen name="verifications" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="analytics" />
    </Stack>
  )
} 