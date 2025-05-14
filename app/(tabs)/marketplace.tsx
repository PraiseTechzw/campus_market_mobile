"use client"

import { useState, useEffect, useCallback } from "react"
import { StyleSheet, FlatList, View, Text, TouchableOpacity, ActivityIndicator } from "react-native"
import { useLocalSearchParams, router } from "expo-router"
import { MaterialIcons } from "@expo/vector-icons"
import { useTheme } from "@/providers/theme-provider"
import { useNetwork } from "@/providers/network-provider"
import { useSupabaseQuery } from "@/hooks/use-supabase-query"
import { supabase } from "@/lib/supabase"
import type { Product, Category, FilterOptions } from "@/types"
import { getLocalProducts } from "@/utils/storage"
import SearchBar from "@/components/search-bar"
import CategoryList from "@/components/category-list"
import ProductCard from "@/components/product-card"
import FilterModal from "@/components/filter-modal"
import ScreenContainer from "@/components/screen-container"
import Button from "@/components/button"
import { globalStyles } from "@/constants/Styles"

export default function MarketplaceScreen() {
  const params = useLocalSearchParams()
  const { colors } = useTheme()
  const { isConnected } = useNetwork()
  const [selectedCategory, setSelectedCategory] = useState<string | null>((params.category as string) || null)
  const [searchQuery, setSearchQuery] = useState((params.search as string) || "")
  const [filterModalVisible, setFilterModalVisible] = useState(false)
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    priceRange: [0, 1000],
    condition: [],
    sortBy: "newest",
  })
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [refreshing, setRefreshing] = useState(false)

  // Fetch categories
  const {
    data: categories,
    loading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useSupabaseQuery<Category>({
    key: "categories",
    query: () => supabase.from("categories").select("*").order("name"),
  })

  // Fetch products
  const {
    data: products,
    loading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useSupabaseQuery<Product>({
    key: "products",
    query: () =>
      supabase
        .from("products")
        .select(`
          *,
          seller:profiles(id, firstName, lastName, profilePicture, isVerified)
        `)
        .eq("isActive", true)
        .order("createdAt", { ascending: false }),
  })

  useEffect(() => {
    if (params.category) {
      setSelectedCategory(params.category as string)
    }
    if (params.search) {
      setSearchQuery(params.search as string)
    }
  }, [params])

  useEffect(() => {
    if (!isConnected) {
      // Load from local storage when offline
      const loadLocalProducts = async () => {
        const localProducts = await getLocalProducts()
        setFilteredProducts(applyFiltersToProducts(localProducts))
      }
      loadLocalProducts()
    } else if (products) {
      setFilteredProducts(applyFiltersToProducts(products))
    }
  }, [products, selectedCategory, searchQuery, filterOptions, isConnected])

  const applyFiltersToProducts = useCallback(
    (productsToFilter: Product[]) => {
      let filtered = [...productsToFilter]

      // Apply category filter
      if (selectedCategory) {
        filtered = filtered.filter((product) => product.categoryId === selectedCategory)
      }

      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        filtered = filtered.filter(
          (product) => product.name.toLowerCase().includes(query) || product.description.toLowerCase().includes(query),
        )
      }

      // Apply price range filter
      filtered = filtered.filter(
        (product) => product.price >= filterOptions.priceRange[0] && product.price <= filterOptions.priceRange[1],
      )

      // Apply condition filter
      if (filterOptions.condition.length > 0) {
        filtered = filtered.filter((product) => filterOptions.condition.includes(product.condition))
      }

      // Apply sorting
      switch (filterOptions.sortBy) {
        case "newest":
          filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          break
        case "oldest":
          filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          break
        case "price_low_high":
          filtered.sort((a, b) => a.price - b.price)
          break
        case "price_high_low":
          filtered.sort((a, b) => b.price - a.price)
          break
      }

      return filtered
    },
    [selectedCategory, searchQuery, filterOptions],
  )

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleCategorySelect = (category: Category | null) => {
    setSelectedCategory(category ? category.id : null)
  }

  const handleFilterApply = (options: FilterOptions) => {
    setFilterOptions(options)
    setFilterModalVisible(false)
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await Promise.all([refetchCategories(), refetchProducts()])
    setRefreshing(false)
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.searchContainer}>
        <SearchBar placeholder="Search products, books, tech..." value={searchQuery} onChangeText={handleSearch} />
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: colors.cardBackground }]}
          onPress={() => setFilterModalVisible(true)}
        >
          <MaterialIcons name="filter-list" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <CategoryList
        categories={categories || []}
        selectedCategoryId={selectedCategory}
        onSelectCategory={handleCategorySelect}
        showAllOption
      />
    </View>
  )

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="search-off" size={64} color={colors.textDim} />
      <Text style={[styles.emptyText, { color: colors.text }]}>No products found</Text>
      <Text style={[styles.emptySubText, { color: colors.textDim }]}>Try adjusting your filters or search terms</Text>
      <Button
        title="Reset Filters"
        onPress={() => {
          setSearchQuery("")
          setSelectedCategory(null)
          setFilterOptions({
            priceRange: [0, 1000],
            condition: [],
            sortBy: "newest",
          })
        }}
        icon="refresh"
        style={styles.resetButton}
      />
    </View>
  )

  const loading = (productsLoading || categoriesLoading) && !refreshing

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading products...</Text>
        </View>
      </ScreenContainer>
    )
  }

  return (
    <ScreenContainer>
      <FlatList
        data={filteredProducts}
        renderItem={({ item }) => (
          <ProductCard product={item} onPress={() => router.push(`/product/${item.id}`)} style={styles.productCard} />
        )}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[styles.listContent, filteredProducts.length === 0 && styles.emptyList]}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />

      <FilterModal
        visible={filterModalVisible}
        initialOptions={filterOptions}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleFilterApply}
        maxPrice={Math.max(...(products?.map((p) => p.price) || []), 1000)}
      />
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  header: {
    padding: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  productCard: {
    flex: 1,
    margin: 8,
  },
  listContent: {
    paddingBottom: 16,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    minHeight: 400,
  },
  emptyText: {
    ...globalStyles.h2,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    ...globalStyles.bodyMedium,
    textAlign: "center",
    marginBottom: 24,
  },
  resetButton: {
    minWidth: 160,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    ...globalStyles.bodyLarge,
    marginTop: 16,
  },
})
