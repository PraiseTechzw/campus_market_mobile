import React from "react"
import { StyleSheet, ScrollView, TouchableOpacity } from "react-native"
import { Text, View } from "@/components/themed"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"

type FilterOption = {
  key: string
  label: string
}

type FilterBarProps = {
  filters: FilterOption[]
  activeFilter: string
  onFilterChange: (key: string) => void
}

export default function FilterBar({ filters, activeFilter, onFilterChange }: FilterBarProps) {
  const colorScheme = useColorScheme()
  
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        {filters.map((filter) => {
          const isActive = filter.key === activeFilter
          return (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                isActive && { backgroundColor: Colors[colorScheme ?? "light"].tint }
              ]}
              onPress={() => onFilterChange(filter.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  isActive && { color: "#fff" }
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  filtersContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  filterText: {
    fontWeight: "500",
    fontSize: 14,
  },
}) 