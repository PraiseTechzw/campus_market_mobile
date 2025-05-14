"use client"

import { useState } from "react"
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native"
import { router } from "expo-router"
import { useTheme } from "@/providers/theme-provider"
import { useSupabaseQuery } from "@/hooks/use-supabase-query"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/providers/auth-provider"
import type { Product, Category } from "@/types"
import ScreenContainer from "@/components/screen-container"
import SearchBar from "@/components/search-bar"
import CategoryList from "@/components/category-list"
import ProductCard from "@/components/product-card"
import BannerCarousel from "@/components/banner-carousel"
import PromotionalBanner from "@/components/promotional-banner"
import Button from "@/components/button"
import Card from "@/components/card"
import { Banner } from "@/services/banner-service"

export default function HomeScreen() {
  const { colors } = useTheme()
  const { user, profile } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [refreshing, setRefreshing] = useState(false)

  // Fetch banners
  const {
    data: banners,
    loading: bannersLoading,
    refetch: refetchBanners,
  } = useSupabaseQuery<Banner>({
    key: "banners",
    query: () => supabase.from("banners").select("*").eq("isActive", true).order("order"),
  })

  // Fetch featured products
  const {
    data: featuredProducts,
    loading: featuredLoading,
    refetch: refetchFeatured,
  } = useSupabaseQuery<Product>({
    key: "featured_products",
    query: () =>
      supabase
        .from("products")
        .select(`
          *,
          seller:profiles(id, firstName, lastName, profilePicture, isVerified)
        `)
        .eq("isActive", true)
        .eq("isFeatured", true)
        .order("createdAt", { ascending: false })
        .limit(6),
  })

  // Fetch recent products
  const {
    data: recentProducts,
    loading: recentLoading,
    refetch: refetchRecent,
  } = useSupabaseQuery<Product>({
    key: "recent_products",
    query: () =>
      supabase
        .from("products")
        .select(`
          *,
          seller:profiles(id, firstName, lastName, profilePicture, isVerified)
        `)
        .eq("isActive", true)
        .order("createdAt", { ascending: false })
        .limit(10),
  })

  // Fetch categories
  const {
    data: categories,
    loading: categoriesLoading,
    refetch: refetchCategories,
  } = useSupabaseQuery<Category>({
    key: "categories",
    query: () => supabase.from("categories").select("*").order("name"),
  })

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push({
        pathname: "/marketplace",
        params: { search: searchQuery },
      })
    }
  }

  const handleCategorySelect = (category: Category | null) => {
    router.push({
      pathname: "/marketplace",
      params: { category: category?.id },
    })
  }

  const handleBannerPress = (banner: Banner) => {
    if (banner.actionUrl) {
      // Handle navigation based on action URL
      if (banner.actionUrl.startsWith("/")) {
        router.push(banner.actionUrl)
      }
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await Promise.all([refetchBanners(), refetchFeatured(), refetchRecent(), refetchCategories()])
    setRefreshing(false)
  }

  const renderWelcomeSection = () => (
    <View style={[styles.welcomeSection, { backgroundColor: colors.background }]}>
      <Text style={[styles.welcomeText, { color: colors.text }]}>
        {user ? `Welcome back, ${profile?.full_name}!` : "Welcome to Campus Market!"}
      </Text>
      <View style={styles.searchContainer}>
        <SearchBar
          placeholder="Search products, books, tech..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmit={handleSearch}
        />
      </View>
    </View>
  )

  const renderCategoriesSection = () => (
    <View style={[styles.sectionContainer, { backgroundColor: colors.background }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Categories</Text>
      <CategoryList
        categories={categories || []}
        selectedCategoryId={null}
        onSelectCategory={handleCategorySelect}
        showAllOption={false}
      />
    </View>
  )

  const renderFeaturedSection = () => (
    <View style={[styles.sectionContainer, { backgroundColor: colors.background }]}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Featured Items</Text>
        <TouchableOpacity onPress={() => router.push("/marketplace")}>
          <Text style={[styles.seeAllText, { color: colors.tint }]}>See All</Text>
        </TouchableOpacity>
      </View>

      {featuredLoading ? (
        <ActivityIndicator size="small" color={colors.tint} style={styles.loader} />
      ) : featuredProducts && featuredProducts.length > 0 ? (
        <FlatList
          data={featuredProducts}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => router.push(`/product/${item.id}`)}
              style={styles.featuredProductCard}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredList}
        />
      ) : (
        <Card variant="outlined" style={styles.emptyCard}>
          <Text style={[styles.emptyText, { color: colors.textDim }]}>No featured items available</Text>
        </Card>
      )}
    </View>
  )

  const renderPromotionalBanner = () => {
    if (!banners || banners.length === 0 || bannersLoading) return null

    // Find a promotional banner that's not in the carousel
    const promotionalBanner = banners.find((banner) => banner.type === "promotional")

    if (!promotionalBanner) return null

    return <PromotionalBanner banner={promotionalBanner} onPress={handleBannerPress} />
  }

  const renderRecentSection = () => (
    <View style={[styles.sectionContainer, { backgroundColor: colors.background }]}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recently Added</Text>
        <TouchableOpacity onPress={() => router.push("/marketplace")}>
          <Text style={[styles.seeAllText, { color: colors.tint }]}>See All</Text>
        </TouchableOpacity>
      </View>

      {recentLoading ? (
        <ActivityIndicator size="small" color={colors.tint} style={styles.loader} />
      ) : recentProducts && recentProducts.length > 0 ? (
        <View style={styles.recentProductsGrid}>
          {recentProducts.slice(0, 4).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onPress={() => router.push(`/product/${product.id}`)}
              style={styles.recentProductCard}
            />
          ))}
        </View>
      ) : (
        <Card variant="outlined" style={styles.emptyCard}>
          <Text style={[styles.emptyText, { color: colors.textDim }]}>No recent items available</Text>
        </Card>
      )}

      {recentProducts && recentProducts.length > 4 && (
        <Button
          title="View More"
          variant="outline"
          onPress={() => router.push("/marketplace")}
          style={styles.viewMoreButton}
        />
      )}
    </View>
  )

  const renderSellSection = () => (
    <Card variant="elevated" style={[styles.sellCard, { backgroundColor: colors.cardBackground }]}>
      <View style={styles.sellCardContent}>
        <View style={styles.sellCardTextContainer}>
          <Text style={[styles.sellCardTitle, { color: colors.text }]}>Have something to sell?</Text>
          <Text style={[styles.sellCardDescription, { color: colors.textDim }]}>
            List your items and reach thousands of students on campus
          </Text>
        </View>
        <Button title="Sell Now" icon="add-circle-outline" onPress={() => router.push("/sell")} />
      </View>
    </Card>
  )

  return (
    <ScreenContainer scrollable refreshing={refreshing} onRefresh={onRefresh}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderWelcomeSection()}

        {/* Banner Carousel */}
        {bannersLoading ? (
          <View style={styles.bannerPlaceholder}>
            <ActivityIndicator size="small" color={colors.tint} />
          </View>
        ) : banners && banners.filter((b) => b.type === "carousel").length > 0 ? (
          <BannerCarousel banners={banners.filter((b) => b.type === "carousel")} onBannerPress={handleBannerPress} />
        ) : null}

        {renderCategoriesSection()}
        {renderFeaturedSection()}
        {renderPromotionalBanner()}
        {renderRecentSection()}
        {renderSellSection()}
      </View>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 32,
  },
  welcomeSection: {
"use client"

import { useState } from "react"
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native"
import { router } from "expo-router"
import { useTheme } from "@/providers/theme-provider"
import { useSupabaseQuery } from "@/hooks/use-supabase-query"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/providers/auth-provider"
import type { Product, Category } from "@/types"
import ScreenContainer from "@/components/screen-container"
import SearchBar from "@/components/search-bar"
import CategoryList from "@/components/category-list"
import ProductCard from "@/components/product-card"
import BannerCarousel from "@/components/banner-carousel"
import PromotionalBanner from "@/components/promotional-banner"
import Button from "@/components/button"
import Card from "@/components/card"
import { Banner } from "@/services/banner-service"

export default function HomeScreen() {
  const { colors } = useTheme()
  const { user, profile } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [refreshing, setRefreshing] = useState(false)

  // Fetch banners
  const {
    data: banners,
    loading: bannersLoading,
    refetch: refetchBanners,
  } = useSupabaseQuery<Banner>({
    key: "banners",
    query: () => supabase.from("banners").select("*").eq("isActive", true).order("order"),
  })

  // Fetch featured products
  const {
    data: featuredProducts,
    loading: featuredLoading,
    refetch: refetchFeatured,
  } = useSupabaseQuery<Product>({
    key: "featured_products",
    query: () =>
      supabase
        .from("products")
        .select(`
          *,
          seller:profiles(id, firstName, lastName, profilePicture, isVerified)
        `)
        .eq("isActive", true)
        .eq("isFeatured", true)
        .order("createdAt", { ascending: false })
        .limit(6),
  })

  // Fetch recent products
  const {
    data: recentProducts,
    loading: recentLoading,
    refetch: refetchRecent,
  } = useSupabaseQuery<Product>({
    key: "recent_products",
    query: () =>
      supabase
        .from("products")
        .select(`
          *,
          seller:profiles(id, firstName, lastName, profilePicture, isVerified)
        `)
        .eq("isActive", true)
        .order("createdAt", { ascending: false })
        .limit(10),
  })

  // Fetch categories
  const {
    data: categories,
    loading: categoriesLoading,
    refetch: refetchCategories,
  } = useSupabaseQuery<Category>({
    key: "categories",
    query: () => supabase.from("categories").select("*").order("name"),
  })

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push({
        pathname: "/marketplace",
        params: { search: searchQuery },
      })
    }
  }

  const handleCategorySelect = (category: Category | null) => {
    router.push({
      pathname: "/marketplace",
      params: { category: category?.id },
    })
  }

  const handleBannerPress = (banner: Banner) => {
    if (banner.actionUrl) {
      // Handle navigation based on action URL
      if (banner.actionUrl.startsWith("/")) {
        router.push(banner.actionUrl)
      }
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await Promise.all([refetchBanners(), refetchFeatured(), refetchRecent(), refetchCategories()])
    setRefreshing(false)
  }

  const renderWelcomeSection = () => (
    <View style={styles.welcomeSection}>
      <Text style={[styles.welcomeText, { color: colors.text }]}>
        {user ? `Welcome back, ${profile?.full_name}!` : "Welcome to Campus Market!"}
      </Text>
      <View style={styles.searchContainer}>
        <SearchBar
          placeholder="Search products, books, tech..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmit={handleSearch}
        />
      </View>
    </View>
  )

  const renderCategoriesSection = () => (
    <View style={styles.sectionContainer}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Categories</Text>
      <CategoryList
        categories={categories || []}
        selectedCategoryId={null}
        onSelectCategory={handleCategorySelect}
        showAllOption={false}
      />
    </View>
  )

  const renderFeaturedSection = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Featured Items</Text>
        <TouchableOpacity onPress={() => router.push("/marketplace")}>
          <Text style={[styles.seeAllText, { color: colors.tint }]}>See All</Text>
        </TouchableOpacity>
      </View>

      {featuredLoading ? (
        <ActivityIndicator size="small" color={colors.tint} style={styles.loader} />
      ) : featuredProducts && featuredProducts.length > 0 ? (
        <FlatList
          data={featuredProducts}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => router.push(`/product/${item.id}`)}
              style={styles.featuredProductCard}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredList}
        />
      ) : (
        <Card variant="outlined" style={styles.emptyCard}>
          <Text style={[styles.emptyText, { color: colors.textDim }]}>No featured items available</Text>
        </Card>
      )}
    </View>
  )

  const renderPromotionalBanner = () => {
    if (!banners || banners.length === 0 || bannersLoading) return null

    // Find a promotional banner that's not in the carousel
    const promotionalBanner = banners.find((banner) => banner.type === "promotional")

    if (!promotionalBanner) return null

    return <PromotionalBanner banner={promotionalBanner} onPress={handleBannerPress} />
  }

  const renderRecentSection = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recently Added</Text>
        <TouchableOpacity onPress={() => router.push("/marketplace")}>
          <Text style={[styles.seeAllText, { color: colors.tint }]}>See All</Text>
        </TouchableOpacity>
      </View>

      {recentLoading ? (
        <ActivityIndicator size="small" color={colors.tint} style={styles.loader} />
      ) : recentProducts && recentProducts.length > 0 ? (
        <View style={styles.recentProductsGrid}>
          {recentProducts.slice(0, 4).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onPress={() => router.push(`/product/${product.id}`)}
              style={styles.recentProductCard}
            />
          ))}
        </View>
      ) : (
        <Card variant="outlined" style={styles.emptyCard}>
          <Text style={[styles.emptyText, { color: colors.textDim }]}>No recent items available</Text>
        </Card>
      )}

      {recentProducts && recentProducts.length > 4 && (
        <Button
          title="View More"
          variant="outline"
          onPress={() => router.push("/marketplace")}
          style={styles.viewMoreButton}
        />
      )}
    </View>
  )

  const renderSellSection = () => (
    <Card variant="elevated" style={styles.sellCard}>
      <View style={styles.sellCardContent}>
        <View style={styles.sellCardTextContainer}>
          <Text style={[styles.sellCardTitle, { color: colors.text }]}>Have something to sell?</Text>
          <Text style={[styles.sellCardDescription, { color: colors.textDim }]}>
            List your items and reach thousands of students on campus
          </Text>
        </View>
        <Button title="Sell Now" icon="add-circle-outline" onPress={() => router.push("/sell")} />
      </View>
    </Card>
  )

  return (
    <ScreenContainer scrollable refreshing={refreshing} onRefresh={onRefresh}>
      <View style={styles.container}>
        {renderWelcomeSection()}

        {/* Banner Carousel */}
        {bannersLoading ? (
          <View style={styles.bannerPlaceholder}>
            <ActivityIndicator size="small" color={colors.tint} />
          </View>
        ) : banners && banners.filter((b) => b.type === "carousel").length > 0 ? (
          <BannerCarousel banners={banners.filter((b) => b.type === "carousel")} onBannerPress={handleBannerPress} />
        ) : null}

        {renderCategoriesSection()}
        {renderFeaturedSection()}
        {renderPromotionalBanner()}
        {renderRecentSection()}
        {renderSellSection()}
      </View>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 32,
    backgroundColor: colors.background,
  },
  welcomeSection: {
    padding: 24,
    paddingTop: 32,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: "bold",
    fontFamily: 'Poppins-Bold',
    marginBottom: 18,
  },
  searchContainer: {
    marginBottom: 12,
  },
  bannerPlaceholder: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    marginHorizontal: 16,
    backgroundColor: colors.cardBackground,
  },
  sectionContainer: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: 'Poppins-SemiBold',
  },
  seeAllText: {
    fontSize: 15,
    fontFamily: 'Poppins-Regular',
  },
  featuredList: {
    paddingHorizontal: 12,
  },
  featuredProductCard: {
    width: 220,
    marginHorizontal: 10,
  },
  recentProductsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
  },
  recentProductCard: {
    width: "50%",
    padding: 10,
  },
  viewMoreButton: {
    marginHorizontal: 20,
    marginTop: 18,
  },
  loader: {
    padding: 24,
  },
  emptyCard: {
    marginHorizontal: 20,
    alignItems: "center",
    padding: 32,
    borderRadius: 18,
    backgroundColor: colors.cardBackground,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Poppins-Regular',
    color: colors.textDim,
  },
  sellCard: {
    margin: 20,
    borderRadius: 22,
    overflow: 'hidden',
    padding: 0,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 3,
  },
  sellCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 24,
    backgroundColor: 'linear-gradient(90deg, #2CB67D 0%, #7EE2A8 100%)',
    borderRadius: 22,
  },
  sellCardTextContainer: {
    flex: 1,
    marginRight: 18,
  },
  sellCardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: 'Poppins-Bold',
    marginBottom: 6,
    color: colors.text,
  },
  sellCardDescription: {
    fontSize: 15,
    fontFamily: 'Poppins-Regular',
    color: colors.textDim,
  },
})
