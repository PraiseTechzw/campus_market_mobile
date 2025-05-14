import { StyleSheet, ScrollView, Text, TouchableOpacity } from "react-native"
import { useColorScheme } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import Colors from "@/constants/Colors"
import type { Category } from "@/types"

interface CategoryListProps {
  categories: Category[]
  selectedCategoryId?: string | null
  onSelectCategory: (category: Category | null) => void
  showAllOption?: boolean
}

export default function CategoryList({
  categories,
  selectedCategoryId,
  onSelectCategory,
  showAllOption = false,
}: CategoryListProps) {
  const colorScheme = useColorScheme()

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {showAllOption && (
        <TouchableOpacity
          style={[
            styles.categoryItem,
            !selectedCategoryId && styles.selectedItem,
            {
              backgroundColor: !selectedCategoryId
                ? Colors[colorScheme ?? "light"].tint
                : Colors[colorScheme ?? "light"].cardBackground,
            },
          ]}
          onPress={() => onSelectCategory(null)}
        >
          <MaterialIcons
            name="category"
            size={24}
            color={!selectedCategoryId ? "white" : Colors[colorScheme ?? "light"].text}
          />
          <Text
            style={[
              styles.categoryText,
              { color: !selectedCategoryId ? "white" : Colors[colorScheme ?? "light"].text },
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
      )}

      {categories.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryItem,
            selectedCategoryId === category.id && styles.selectedItem,
            {
              backgroundColor:
                selectedCategoryId === category.id
                  ? Colors[colorScheme ?? "light"].tint
                  : Colors[colorScheme ?? "light"].cardBackground,
            },
          ]}
          onPress={() => onSelectCategory(category)}
        >
          <MaterialIcons
            name={category.icon as any}
            size={24}
            color={selectedCategoryId === category.id ? "white" : Colors[colorScheme ?? "light"].text}
          />
          <Text
            style={[
              styles.categoryText,
              { color: selectedCategoryId === category.id ? "white" : Colors[colorScheme ?? "light"].text },
            ]}
          >
            {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingLeft: 8,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  selectedItem: {
    borderWidth: 0,
  },
  categoryText: {
    marginLeft: 6,
    fontWeight: "600",
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
  },
})
