import { StyleSheet, View, TextInput, TouchableOpacity } from "react-native"
import { useColorScheme } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import Colors from "@/constants/Colors"

interface SearchBarProps {
  placeholder: string
  value: string
  onChangeText: (text: string) => void
  onSubmit?: () => void
}

export default function SearchBar({ placeholder, value, onChangeText, onSubmit }: SearchBarProps) {
  const colorScheme = useColorScheme()

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? "light"].cardBackground }]}>
      <Ionicons name="search" size={20} color={Colors[colorScheme ?? "light"].textDim} />
      <TextInput
        style={[styles.input, { color: Colors[colorScheme ?? "light"].text }]}
        placeholder={placeholder}
        placeholderTextColor={Colors[colorScheme ?? "light"].textDim}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText("")}>
          <Ionicons name="close-circle" size={20} color={Colors[colorScheme ?? "light"].textDim} />
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    height: 52,
    borderRadius: 26,
    flex: 1,
    backgroundColor: Colors[colorScheme ?? "light"].cardBackground,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 17,
    fontFamily: 'Poppins-Regular',
  },
})
