import { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import { useTheme } from "@/providers/theme-provider";
import { useSupabaseQuery } from "@/hooks/use-supabase-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/auth-provider";
import type { Product, Category } from "@/types";
import ScreenContainer from "@/components/screen-container";
import SearchBar from "@/components/search-bar";
import CategoryList from "@/components/category-list";
import ProductCard from "@/components/product-card";
import BannerCarousel from "@/components/banner-carousel";
import PromotionalBanner from "@/components/promotional-banner";
import Button from "@/components/button";
import Card from "@/components/card";
import { Banner } from "@/services/banner-service";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function HomeScreen() {
  const { colors } = useTheme();
  const { user, profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [userLocation, setUserLocation] = useState<string | null>("Nearby Campus");
  
  // Load search history on component mount
  useEffect(() => {
    loadSearchHistory();
  }, []);

  const loadSearchHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('search_history');
      if (history) {
        setSearchHistory(JSON.parse(history).slice(0, 5)); // Show only 5 most recent searches
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  const saveSearchQuery = async (query: string) => {
    if (!query.trim()) return;
    
    try {
      // Load existing history
      const history = await AsyncStorage.getItem('search_history');
      let searches = history ? JSON.parse(history) : [];
      
      // Add new search to the beginning (most recent)
      searches = [query, ...searches.filter((s: string) => s !== query)].slice(0, 10);
      
      // Save back to storage
      await AsyncStorage.setItem('search_history', JSON.stringify(searches));
      
      // Update state
      setSearchHistory(searches.slice(0, 5));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  };

  // Fetch banners
  const {
    data: banners,
    loading: bannersLoading,
    refetch: refetchBanners,
  } = useSupabaseQuery<Banner>({
    key: "banners",
    query: () =>
      supabase.from("banners").select("*").eq("isActive", true).order("order"),
  });

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
        .select(
          `
          *,
          seller:profiles(id, firstName, lastName, profilePicture, isVerified)
        `
        )
        .eq("isActive", true)
        .eq("isFeatured", true)
        .order("createdAt", { ascending: false })
        .limit(6),
  });

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
        .select(
          `
          *,
          seller:profiles(id, firstName, lastName, profilePicture, isVerified)
        `
        )
        .eq("isActive", true)
        .order("createdAt", { ascending: false })
        .limit(10),
  });

  // Fetch trending products (based on view count)
  const {
    data: trendingProducts,
    loading: trendingLoading,
    refetch: refetchTrending,
  } = useSupabaseQuery<Product>({
    key: "trending_products",
    query: () =>
      supabase
        .from("products")
        .select(
          `
          *,
          seller:profiles(id, firstName, lastName, profilePicture, isVerified)
        `
        )
        .eq("isActive", true)
        .order("viewCount", { ascending: false })
        .limit(6),
  });

  // Fetch nearby products
  const {
    data: nearbyProducts,
    loading: nearbyLoading,
    refetch: refetchNearby,
  } = useSupabaseQuery<Product>({
    key: "nearby_products",
    query: () =>
      supabase
        .from("products")
        .select(
          `
          *,
          seller:profiles(id, firstName, lastName, profilePicture, isVerified)
        `
        )
        .eq("isActive", true)
        .eq("location", userLocation || "Nearby Campus")
        .limit(6),
  });

  // Fetch personalized recommendations
  const {
    data: recommendedProducts,
    loading: recommendedLoading,
    refetch: refetchRecommended,
  } = useSupabaseQuery<Product>({
    key: "recommended_products",
    query: () => {
      // Only fetch recommendations if user is logged in
      if (!user) return { data: null };
      
      return supabase
        .from("products")
        .select(
          `
          *,
          seller:profiles(id, firstName, lastName, profilePicture, isVerified)
        `
        )
        .eq("isActive", true)
        .not("sellerId", "eq", user.id) // Exclude user's own products
        .limit(6);
    },
    enabled: !!user,
  });

  // Fetch categories
  const {
    data: categories,
    loading: categoriesLoading,
    refetch: refetchCategories,
  } = useSupabaseQuery<Category>({
    key: "categories",
    query: () => supabase.from("categories").select("*").order("name"),
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Save search query to history
      saveSearchQuery(searchQuery);
      
      router.push({
        pathname: "/marketplace",
        params: { search: searchQuery },
      });
    }
  };

  const handleSearchHistorySelect = (query: string) => {
    setSearchQuery(query);
    router.push({
      pathname: "/marketplace",
      params: { search: query },
    });
  };

  const handleCategorySelect = (category: Category | null) => {
    router.push({
      pathname: "/marketplace",
      params: { category: category?.id },
    });
  };

  const handleBannerPress = (banner: Banner) => {
    if (banner.actionUrl) {
      // Handle navigation based on action URL
      if (banner.actionUrl.startsWith("/")) {
        router.push(banner.actionUrl);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchBanners(),
      refetchFeatured(),
      refetchRecent(),
      refetchTrending(),
      refetchNearby(),
      user ? refetchRecommended() : Promise.resolve(),
      refetchCategories(),
      loadSearchHistory(),
    ]);
    setRefreshing(false);
  };

  const renderWelcomeSection = () => (
    <View style={styles.welcomeSection}>
      <Text style={[styles.welcomeText, { color: colors.text }]}>
        {user
          ? `Welcome back, ${profile?.full_name}!`
          : "Welcome to Campus Market!"}
      </Text>
      <View style={styles.searchContainer}>
        <SearchBar
          placeholder="Search products, books, tech..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmit={handleSearch}
        />
        
        {/* Search History */}
        {searchHistory.length > 0 && (
          <View style={styles.searchHistoryContainer}>
            <Text style={[styles.searchHistoryTitle, { color: colors.textDim }]}>
              Recent Searches
            </Text>
            <View style={styles.searchHistoryList}>
              {searchHistory.map((query, index) => (
                <TouchableOpacity
                  key={`search-${index}`}
                  style={[styles.searchHistoryItem, { backgroundColor: colors.neutral1 }]}
                  onPress={() => handleSearchHistorySelect(query)}
                >
                  <Ionicons name="time-outline" size={16} color={colors.textDim} />
                  <Text style={[styles.searchHistoryText, { color: colors.text }]} numberOfLines={1}>
                    {query}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );

  const renderCategoriesSection = () => (
    <View style={styles.sectionContainer}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Categories
      </Text>
      <CategoryList
        categories={categories || []}
        selectedCategoryId={null}
        onSelectCategory={handleCategorySelect}
        showAllOption={false}
      />
    </View>
  );

  const renderFeaturedSection = () => (
    <View
      style={[styles.sectionContainer, { backgroundColor: colors.background }]}
    >
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Featured Items
        </Text>
        <TouchableOpacity onPress={() => router.push("/marketplace")}>
          <Text style={[styles.seeAllText, { color: colors.tint }]}>
            See All
          </Text>
        </TouchableOpacity>
      </View>

      {featuredLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
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
          <Text style={[styles.emptyText, { color: colors.textDim }]}>
            No featured items available
          </Text>
        </Card>
      )}
    </View>
  );

  const renderTrendingSection = () => (
    <View style={[styles.sectionContainer, { backgroundColor: colors.background }]}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Trending Now
        </Text>
        <TouchableOpacity onPress={() => router.push("/marketplace")}>
          <Text style={[styles.seeAllText, { color: colors.tint }]}>
            See All
          </Text>
        </TouchableOpacity>
      </View>

      {trendingLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : trendingProducts && trendingProducts.length > 0 ? (
        <FlatList
          data={trendingProducts}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => router.push(`/product/${item.id}`)}
              style={styles.featuredProductCard}
            />
          )}
          keyExtractor={(item) => `trending-${item.id}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredList}
        />
      ) : (
        <Card variant="outlined" style={styles.emptyCard}>
          <Text style={[styles.emptyText, { color: colors.textDim }]}>
            No trending items available
          </Text>
        </Card>
      )}
    </View>
  );

  const renderNearbySection = () => (
    <View style={[styles.sectionContainer, { backgroundColor: colors.background }]}>
      <View style={styles.sectionHeader}>
        <View style={styles.locationHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Nearby Items
          </Text>
          <TouchableOpacity style={styles.locationButton}>
            <Ionicons name="location" size={16} color={colors.tint} />
            <Text style={[styles.locationText, { color: colors.tint }]}>
              {userLocation || "Nearby Campus"}
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => router.push("/marketplace")}>
          <Text style={[styles.seeAllText, { color: colors.tint }]}>
            See All
          </Text>
        </TouchableOpacity>
      </View>

      {nearbyLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : nearbyProducts && nearbyProducts.length > 0 ? (
        <FlatList
          data={nearbyProducts}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => router.push(`/product/${item.id}`)}
              style={styles.featuredProductCard}
            />
          )}
          keyExtractor={(item) => `nearby-${item.id}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredList}
        />
      ) : (
        <Card variant="outlined" style={styles.emptyCard}>
          <Text style={[styles.emptyText, { color: colors.textDim }]}>
            No nearby items available
          </Text>
        </Card>
      )}
    </View>
  );

  const renderRecommendedSection = () => {
    // Only show recommended section if user is logged in
    if (!user) return null;
    
    return (
      <View style={[styles.sectionContainer, { backgroundColor: colors.background }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recommended For You
          </Text>
          <TouchableOpacity onPress={() => router.push("/marketplace")}>
            <Text style={[styles.seeAllText, { color: colors.tint }]}>
              See All
            </Text>
          </TouchableOpacity>
        </View>

        {recommendedLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
          </View>
        ) : recommendedProducts && recommendedProducts.length > 0 ? (
          <FlatList
            data={recommendedProducts}
            renderItem={({ item }) => (
              <ProductCard
                product={item}
                onPress={() => router.push(`/product/${item.id}`)}
                style={styles.featuredProductCard}
              />
            )}
            keyExtractor={(item) => `recommended-${item.id}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredList}
          />
        ) : (
          <Card variant="outlined" style={styles.emptyCard}>
            <Text style={[styles.emptyText, { color: colors.textDim }]}>
              No recommendations available
            </Text>
          </Card>
        )}
      </View>
    );
  };

  const renderPromotionalBanner = () => {
    if (!banners || banners.length === 0 || bannersLoading) return null;

    // Find a promotional banner that's not in the carousel
    const promotionalBanner = banners.find(
      (banner) => banner.type === "promotional"
    );

    if (!promotionalBanner) return null;

    return (
      <PromotionalBanner
        banner={promotionalBanner}
        onPress={handleBannerPress}
      />
    );
  };

  const renderRecentSection = () => (
    <View
      style={[styles.sectionContainer, { backgroundColor: colors.background }]}
    >
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Recent Items
        </Text>
        <TouchableOpacity onPress={() => router.push("/marketplace")}>
          <Text style={[styles.seeAllText, { color: colors.tint }]}>
            See All
          </Text>
        </TouchableOpacity>
      </View>

      {recentLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : recentProducts && recentProducts.length > 0 ? (
        <>
          <View style={styles.recentProductsGrid}>
            {recentProducts.slice(0, 4).map((item) => (
              <View key={`recent-${item.id}`} style={styles.productCardContainer}>
                <ProductCard
                  product={{
                    ...item,
                    // Ensure images array is valid
                    images: Array.isArray(item.images) && item.images.length > 0 
                      ? item.images 
                      : ["/placeholder.svg?height=200&width=200"]
                  }}
                  onPress={() => router.push(`/product/${item.id}`)}
                  style={styles.recentProductCard}
                />
              </View>
            ))}
          </View>
          {recentProducts.length > 4 && (
            <Button
              title="View More"
              variant="outline"
              onPress={() => router.push("/marketplace")}
              style={styles.viewMoreButton}
            />
          )}
        </>
      ) : (
        <Card variant="outlined" style={styles.emptyCard}>
          <Text style={[styles.emptyText, { color: colors.textDim }]}>
            No recent items available
          </Text>
        </Card>
      )}
    </View>
  );

  const renderSellSection = () => (
    <Card variant="elevated" style={styles.sellCard}>
      <View style={styles.sellCardContent}>
        <View style={styles.sellCardTextContainer}>
          <Text style={[styles.sellCardTitle, { color: colors.text }]}>
            Have something to sell?
          </Text>
          <Text style={[styles.sellCardDescription, { color: colors.textDim }]}>
            List your items and reach thousands of students on campus
          </Text>
        </View>
        <Button
          title="Sell Now"
          icon="add-circle-outline"
          onPress={() => router.push("/sell")}
        />
      </View>
    </Card>
  );

  return (
    <ScreenContainer scrollable refreshing={refreshing} onRefresh={onRefresh}>
      <View style={styles.container}>
        {renderWelcomeSection()}

        {/* Banner Carousel */}
        {bannersLoading ? (
          <View style={[styles.bannerPlaceholder, { backgroundColor: colors.neutral2 }]}>
            <ActivityIndicator size="large" color={colors.tint} />
          </View>
        ) : banners &&
          banners.filter((b) => b.type === "carousel").length > 0 ? (
          <BannerCarousel
            banners={banners.filter((b) => b.type === "carousel")}
            onBannerPress={handleBannerPress}
          />
        ) : null}

        {renderCategoriesSection()}
        {renderTrendingSection()}
        {renderNearbySection()}
        {renderRecommendedSection()}
        {renderFeaturedSection()}
        {renderPromotionalBanner()}
        {renderRecentSection()}
        {renderSellSection()}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 32,
  },
  welcomeSection: {
    padding: 24,
    paddingTop: 32,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: "bold",
    fontFamily: "Poppins-Bold",
    marginBottom: 18,
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchHistoryContainer: {
    marginTop: 12,
  },
  searchHistoryTitle: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    marginBottom: 10,
  },
  searchHistoryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  searchHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    margin: 4,
  },
  searchHistoryText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    marginLeft: 6,
    maxWidth: 120,
  },
  locationHeader: {
    flexDirection: 'column',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    marginLeft: 4,
  },
  bannerPlaceholder: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    marginHorizontal: 16,
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
    fontFamily: "Poppins-SemiBold",
  },
  seeAllText: {
    fontSize: 15,
    fontFamily: "Poppins-Regular",
  },
  featuredList: {
    paddingHorizontal: 12,
  },
  featuredProductCard: {
    width: 220,
    marginHorizontal: 10,
  },
  recentProductsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  productCardContainer: {
    width: '50%', 
    padding: 8,
    marginBottom: 8,
    minHeight: 320,
  },
  recentProductCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  viewMoreButton: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 6,
  },
  loader: {
    padding: 24,
  },
  emptyCard: {
    marginHorizontal: 20,
    alignItems: "center",
    padding: 32,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: "Poppins-Regular",
  },
  sellCard: {
    margin: 20,
    borderRadius: 22,
    overflow: "hidden",
    padding: 0,
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  sellCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 24,
    borderRadius: 22,
  },
  sellCardTextContainer: {
    flex: 1,
    marginRight: 18,
  },
  sellCardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "Poppins-Bold",
    marginBottom: 6,
  },
  sellCardDescription: {
    fontSize: 15,
    fontFamily: "Poppins-Regular",
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
});
