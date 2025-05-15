import { StyleSheet, ScrollView, TouchableOpacity, Text, View } from "react-native"
import { useQuery } from "@tanstack/react-query"
import { getListingCategories } from "@/services/marketplace"
import type { ListingCategory } from "@/types"
import { Book, Smartphone, Shirt, Armchair, Utensils, Briefcase, Package } from "lucide-react"

type CategoryFilterProps = {
  selectedCategory: ListingCategory | null
  onSelectCategory: (category: ListingCategory | null) => void
}

export default function CategoryFilter({ selectedCategory, onSelectCategory }: CategoryFilterProps) {
  const { data: categories, isLoading } = useQuery({
    queryKey: ["listingCategories"],
    queryFn: getListingCategories,
  })

  const getIconForCategory = (iconName?: string) => {
    switch (iconName) {
      case "book-open":
        return <Book size={24} color="#0891b2" />
      case "smartphone":
        return <Smartphone size={24} color="#0891b2" />
      case "shirt":
        return <Shirt size={24} color="#0891b2" />
      case "armchair":
        return <Armchair size={24} color="#0891b2" />
      case "utensils":
        return <Utensils size={24} color="#0891b2" />
      case "briefcase":
        return <Briefcase size={24} color="#0891b2" />
      default:
        return <Package size={24} color="#0891b2" />
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
            <Package size={24} color="#0891b2" />
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
    borderColor: "#0891b2",
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
    color: "#0891b2",
  },
})
