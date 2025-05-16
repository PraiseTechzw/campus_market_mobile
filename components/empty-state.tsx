import React, { ReactNode } from "react"
import { StyleSheet, View as RNView } from "react-native"
import { Text, View } from "@/components/themed"
import { MaterialIcons } from "@expo/vector-icons"

type EmptyStateProps = {
  icon: string
  title: string
  message: string
  action?: ReactNode
}

export default function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <RNView style={styles.iconContainer}>
        <MaterialIcons name={icon as any} size={64} color="#ccc" />
      </RNView>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {action && <RNView style={styles.actionContainer}>{action}</RNView>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  actionContainer: {
    marginTop: 8,
  },
}) 