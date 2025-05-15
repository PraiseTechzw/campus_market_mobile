import { StyleSheet, ScrollView, TouchableOpacity, Text, View } from "react-native"
import { useQuery } from "@tanstack/react-query"
import { getListingCategories } from "@/services/marketplace"
import type { ListingCategory } from "@/types"
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons"
import Colors from "@/constants/Colors"
import { useColorScheme } from "@/hooks/use-color-scheme"

type CategoryFilterProps = {
  selectedCategory: ListingCategory | null
  onSelectCategory: (category: ListingCategory | null) => void
}

export default function CategoryFilter({ selectedCategory, onSelectCategory }: CategoryFilterProps) {
  const { data: categories, isLoading } = useQuery({
    queryKey: ["listingCategories"],
    queryFn: getListingCategories,
  })

  const colorScheme = useColorScheme()
  const tintColor = Colors[colorScheme ?? "light"].tint

  const getIconForCategory = (iconName?: string) => {
    switch (iconName) {
      case "book-open":
        return <FontAwesome5 name="book-open" size={24} color={tintColor} />
      case "smartphone":
        return <MaterialIcons name="smartphone" size={24} color={tintColor} />
      case "shirt":
        return <Ionicons name="shirt-outline" size={24} color={tintColor} />
      case "armchair":
        return <MaterialIcons name="chair" size={24} color={tintColor} />
      case "utensils":
        return <FontAwesome5 name="utensils" size={24} color={tintColor} />
      case "briefcase":
        return <FontAwesome5 name="briefcase" size={24} color={tintColor} />
      default:
        return <FontAwesome5 name="box" size={24} color={tintColor} />
    }
  }

  if (isLoading || !categories) {
    return null
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          style={[styles.categoryItem, !selectedCategory && styles.selectedCategoryItem]}
          onPress={() => onSelectCategory(null)}
        >
          <View style={styles.iconContainer}>
            <FontAwesome5 name="box" size={24} color={tintColor} />
          </View>
          <Text style={[styles.categoryText, !selectedCategory && styles.selectedCategoryText]}>All</Text>
        </TouchableOpacity>

        {categories.map((category) => (
          <TouchableOpacity
            key={category.id.toString()}
            style={[styles.categoryItem, selectedCategory?.id === category.id && styles.selectedCategoryItem]}
            onPress={() => onSelectCategory(category)}
          >
            <View style={styles.iconContainer}>{getIconForCategory(category.icon)}</View>
            <Text style={[styles.categoryText, selectedCategory?.id === category.id && styles.selectedCategoryText]}>
              {category.name}
            </Text>
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
  categoryItem: {
    alignItems: "center",
    marginRight: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    minWidth: 80,
  },
  selectedCategoryItem: {
    backgroundColor: "#e6f7ff",
    borderWidth: 1,
    borderColor: "#10b981",
  },
  iconContainer: {
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 14,
    color: "#333",
  },
  selectedCategoryText: {
    fontWeight: "bold",
    color: "#10b981",
  },
})
