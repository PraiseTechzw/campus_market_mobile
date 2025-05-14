import { StyleSheet, View, Text } from "react-native"
import { Ionicons } from "@expo/vector-icons"

export default function OfflineBanner() {
  return (
    <View style={styles.container}>
      <Ionicons name="cloud-offline" size={16} color="white" />
      <Text style={styles.text}>You are offline. Some features may be limited.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FF9800",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  text: {
    color: "white",
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  },
})
