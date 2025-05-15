"\"use client"

import { Text, View } from "@/components/themed"

export default function Page() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 20, fontWeight: "bold" }}>Welcome to UniConnect!</Text>
      <Text>Your campus marketplace.</Text>
    </View>
  )
}
