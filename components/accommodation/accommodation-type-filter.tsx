import { StyleSheet, ScrollView, TouchableOpacity, Text, View } from "react-native"
import { useQuery } from "@tanstack/react-query"
import { getAccommodationTypes } from "@/services/accommodation"
import type { AccommodationType } from "@/types"
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons"
import Colors from "@/constants/Colors"
import { useColorScheme } from "@/hooks/use-color-scheme"

type AccommodationTypeFilterProps = {
  selectedType: AccommodationType | null
  onSelectType: (type: AccommodationType | null) => void
}

export default function AccommodationTypeFilter({ selectedType, onSelectType }: AccommodationTypeFilterProps) {
  const { data: types, isLoading } = useQuery({
    queryKey: ["accommodationTypes"],
    queryFn: getAccommodationTypes,
  })

  const colorScheme = useColorScheme()
  const tintColor = Colors[colorScheme ?? "light"].tint

  const getIconForType = (typeName: string) => {
    switch (typeName.toLowerCase()) {
      case "single room":
        return <FontAwesome5 name="home" size={24} color={tintColor} />
      case "2-share":
      case "3-share":
        return <FontAwesome5 name="users" size={24} color={tintColor} />
      case "self-contained":
        return <FontAwesome5 name="building" size={24} color={tintColor} />
      case "apartment":
      case "house":
        return <MaterialIcons name="apartment" size={24} color={tintColor} />
      default:
        return <FontAwesome5 name="home" size={24} color={tintColor} />
    }
  }

  if (isLoading || !types) {
    return null
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          style={[styles.typeItem, !selectedType && styles.selectedTypeItem]}
          onPress={() => onSelectType(null)}
        >
          <View style={styles.iconContainer}>
            <MaterialIcons name="apartment" size={24} color={tintColor} />
          </View>
          <Text style={[styles.typeText, !selectedType && styles.selectedTypeText]}>All</Text>
        </TouchableOpacity>

        {types.map((type) => (
          <TouchableOpacity
            key={type.id.toString()}
            style={[styles.typeItem, selectedType?.id === type.id && styles.selectedTypeItem]}
            onPress={() => onSelectType(type)}
          >
            <View style={styles.iconContainer}>{getIconForType(type.name)}</View>
            <Text style={[styles.typeText, selectedType?.id === type.id && styles.selectedTypeText]}>{type.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  scrollContent: {
    paddingVertical: 8,
  },
  typeItem: {
    alignItems: "center",
    marginRight: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    minWidth: 100,
  },
  selectedTypeItem: {
    backgroundColor: "#e6f7ff",
    borderWidth: 1,
    borderColor: "#10b981",
  },
  iconContainer: {
    marginBottom: 4,
  },
  typeText: {
    fontSize: 14,
    color: "#333",
    textAlign: "center",
  },
  selectedTypeText: {
    fontWeight: "bold",
    color: "#10b981",
  },
})
