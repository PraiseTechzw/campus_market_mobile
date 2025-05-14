import { supabase } from "@/lib/supabase"
import type { 
  AccommodationListing, 
  AccommodationType, 
  Amenity, 
  AccommodationBooking, 
  AccommodationReview,
  AccommodationFilterOptions,
  User
} from "@/types"

// Mock data for fallbacks
import { mockAccommodationListings } from "@/data/mock-accommodations"

// Accommodation Types
export const getAccommodationTypes = async (): Promise<AccommodationType[]> => {
  try {
    const { data, error } = await supabase
      .from("accommodation_types")
      .select("*")
      .order("name")

    if (error) {
      console.error("Error fetching accommodation types:", error)
      // Fallback to mock data
      return [
        { id: "1", name: "Apartment", description: "Fully furnished apartment with separate bedroom", icon: "apartment" },
        { id: "2", name: "Studio", description: "Open-plan living space with combined bedroom and living area", icon: "studio" },
        { id: "3", name: "Room in shared house", description: "Private room with shared common areas", icon: "bed" },
        { id: "4", name: "Entire house", description: "Complete house for rent", icon: "home" },
        { id: "5", name: "Dormitory", description: "Student dormitory room", icon: "door-open" }
      ]
    }

    return data.map((type) => ({
      id: type.id,
      name: type.name,
      description: type.description,
      icon: type.icon,
    }))
  } catch (error) {
    console.error("Error in getAccommodationTypes:", error)
    // Fallback to mock data
    return [
      { id: "1", name: "Apartment", description: "Fully furnished apartment with separate bedroom", icon: "apartment" },
      { id: "2", name: "Studio", description: "Open-plan living space with combined bedroom and living area", icon: "studio" },
      { id: "3", name: "Room in shared house", description: "Private room with shared common areas", icon: "bed" },
      { id: "4", name: "Entire house", description: "Complete house for rent", icon: "home" },
      { id: "5", name: "Dormitory", description: "Student dormitory room", icon: "door-open" }
    ]
  }
}

// Accommodation Amenities
export const getAmenities = async (): Promise<Amenity[]> => {
  try {
    const { data, error } = await supabase
      .from("accommodation_amenities")
      .select("*")
      .order("name")

    if (error) {
      console.error("Error fetching amenities:", error)
      // Fallback to mock data
      return [
        { id: "1", name: "Wi-Fi", icon: "wifi", category: "essential" },
        { id: "2", name: "Kitchen", icon: "kitchen", category: "essential" },
        { id: "3", name: "Washing machine", icon: "wash", category: "essential" },
        { id: "4", name: "TV", icon: "tv", category: "feature" },
        { id: "5", name: "Near campus", icon: "map-pin", category: "location" }
      ]
    }

    return data.map((amenity) => ({
      id: amenity.id,
      name: amenity.name,
      icon: amenity.icon,
      category: amenity.category,
    }))
  } catch (error) {
    console.error("Error in getAmenities:", error)
    // Fallback to mock data
    return [
      { id: "1", name: "Wi-Fi", icon: "wifi", category: "essential" },
      { id: "2", name: "Kitchen", icon: "kitchen", category: "essential" },
      { id: "3", name: "Washing machine", icon: "wash", category: "essential" },
      { id: "4", name: "TV", icon: "tv", category: "feature" },
      { id: "5", name: "Near campus", icon: "map-pin", category: "location" }
    ]
  }
}

// Accommodation Listings
export const getAccommodationListings = async (filters?: Partial<AccommodationFilterOptions>): Promise<AccommodationListing[]> => {
  try {
    let query = supabase
      .from("accommodation_listings")
      .select("*, owner_id(id, first_name, last_name, avatar_url, is_verified)")
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    // Apply filters if provided
    if (filters) {
      if (filters.priceRange) {
        query = query
          .gte("price_per_month", filters.priceRange[0])
          .lte("price_per_month", filters.priceRange[1])
      }

      if (filters.bedrooms && filters.bedrooms.length > 0) {
        query = query.in("bedrooms", filters.bedrooms)
      }

      if (filters.bathrooms && filters.bathrooms.length > 0) {
        query = query.in("bathrooms", filters.bathrooms)
      }

      if (filters.accommodationType && filters.accommodationType.length > 0) {
        query = query.in("type_id", filters.accommodationType)
      }

      if (filters.isFurnished !== undefined) {
        query = query.eq("is_furnished", filters.isFurnished)
      }

      if (filters.availableFrom) {
        query = query.lte("available_from", filters.availableFrom)
      }

      // Apply sorting
      if (filters.sortBy) {
        switch (filters.sortBy) {
          case "newest":
            query = query.order("created_at", { ascending: false })
            break
          case "oldest":
            query = query.order("created_at", { ascending: true })
            break
          case "price_low_high":
            query = query.order("price_per_month", { ascending: true })
            break
          case "price_high_low":
            query = query.order("price_per_month", { ascending: false })
            break
          // Note: distance sorting is handled client-side after fetching
        }
      }
    }

    const { data: listings, error: listingsError } = await query

    if (listingsError) {
      console.error("Error fetching accommodation listings:", listingsError)
      // Fallback to mock data
      return mockAccommodationListings
    }

    // Fetch accommodation types for all listings in a single query
    const typeIds = [...new Set(listings.map(listing => listing.type_id).filter(Boolean))]
    let typesMap: Record<string, AccommodationType> = {}
    
    if (typeIds.length > 0) {
      const { data: typesData, error: typesError } = await supabase
        .from("accommodation_types")
        .select("*")
        .in("id", typeIds)
        
      if (!typesError && typesData) {
        typesData.forEach(type => {
          typesMap[type.id] = {
            id: type.id,
            name: type.name,
            description: type.description,
            icon: type.icon
          }
        })
      }
    }

    // Fetch amenity details for all listings
    const allAmenitiesIds = listings
      .flatMap(listing => listing.amenities || [])
      .filter(Boolean)
    
    let amenitiesMap: Record<string, Amenity> = {}
    
    if (allAmenitiesIds.length > 0) {
      const { data: amenitiesData, error: amenitiesError } = await supabase
        .from("accommodation_amenities")
        .select("*")
        .in("id", allAmenitiesIds)
        
      if (!amenitiesError && amenitiesData) {
        amenitiesData.forEach(amenity => {
          amenitiesMap[amenity.id] = {
            id: amenity.id,
            name: amenity.name,
            icon: amenity.icon,
            category: amenity.category
          }
        })
      }
    }

    // Map listings to client format
    return listings.map(listing => {
      const ownerData = listing.owner_id
      const owner = ownerData ? {
        id: ownerData.id,
        firstName: ownerData.first_name || "",
        lastName: ownerData.last_name || "",
        email: "",
        role: "student",
        isVerified: ownerData.is_verified || false,
        profilePicture: ownerData.avatar_url,
        createdAt: ""
      } : undefined

      const amenityDetails = (listing.amenities || [])
        .map(id => amenitiesMap[id])
        .filter(Boolean)

      return {
        id: listing.id,
        title: listing.title,
        description: listing.description,
        ownerId: listing.owner_id,
        owner: owner,
        typeId: listing.type_id,
        type: typesMap[listing.type_id],
        amenities: listing.amenities || [],
        amenityDetails: amenityDetails,
        pricePerMonth: listing.price_per_month,
        securityDeposit: listing.security_deposit,
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
        maxOccupants: listing.max_occupants,
        address: listing.address,
        locationLat: listing.location_lat,
        locationLng: listing.location_lng,
        images: listing.images || [],
        availableFrom: listing.available_from,
        minimumStayMonths: listing.minimum_stay_months,
        isFurnished: listing.is_furnished,
        isVerified: listing.is_verified,
        isActive: listing.is_active,
        featured: listing.featured,
        createdAt: listing.created_at,
        updatedAt: listing.updated_at
      }
    })
  } catch (error) {
    console.error("Error in getAccommodationListings:", error)
    // Fallback to mock data
    return mockAccommodationListings
  }
}

// Get accommodation listing by ID
export const getAccommodationById = async (id: string): Promise<AccommodationListing | null> => {
  try {
    const { data: listing, error: listingError } = await supabase
      .from("accommodation_listings")
      .select("*")
      .eq("id", id)
      .single()
      
    if (listingError) {
      console.error("Error fetching accommodation:", listingError)
      // Fallback to mock data
      return mockAccommodationListings.find(item => item.id === id) || null
    }
    
    // Fetch owner data
    const { data: owner, error: ownerError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", listing.owner_id)
      .single()
      
    if (ownerError) {
      console.error("Error fetching owner:", ownerError)
    }
    
    // Fetch accommodation type
    const { data: accommodationType, error: typeError } = await supabase
      .from("accommodation_types")
      .select("*")
      .eq("id", listing.type_id)
      .single()
      
    if (typeError) {
      console.error("Error fetching accommodation type:", typeError)
    }
    
    // Fetch amenities details
    let amenityDetails: Amenity[] = []
    if (listing.amenities && listing.amenities.length > 0) {
      const { data: amenities, error: amenitiesError } = await supabase
        .from("accommodation_amenities")
        .select("*")
        .in("id", listing.amenities)
        
      if (amenitiesError) {
        console.error("Error fetching amenities:", amenitiesError)
      } else if (amenities) {
        amenityDetails = amenities.map(amenity => ({
          id: amenity.id,
          name: amenity.name,
          icon: amenity.icon,
          category: amenity.category,
        }))
      }
    }
    
    return {
      id: listing.id,
      title: listing.title,
      description: listing.description,
      ownerId: listing.owner_id,
      owner: owner ? {
        id: owner.id,
        firstName: owner.first_name || "",
        lastName: owner.last_name || "",
        email: owner.email || "",
        role: owner.role || "student",
        isVerified: owner.is_verified || false,
        profilePicture: owner.avatar_url,
        createdAt: owner.created_at,
        rating: owner.rating
      } : undefined,
      typeId: listing.type_id,
      type: accommodationType ? {
        id: accommodationType.id,
        name: accommodationType.name,
        description: accommodationType.description,
        icon: accommodationType.icon
      } : undefined,
      amenities: listing.amenities || [],
      amenityDetails: amenityDetails,
      pricePerMonth: listing.price_per_month,
      securityDeposit: listing.security_deposit,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      maxOccupants: listing.max_occupants,
      address: listing.address,
      locationLat: listing.location_lat,
      locationLng: listing.location_lng,
      images: listing.images || [],
      availableFrom: listing.available_from,
      minimumStayMonths: listing.minimum_stay_months,
      isFurnished: listing.is_furnished,
      isVerified: listing.is_verified,
      isActive: listing.is_active,
      featured: listing.featured,
      createdAt: listing.created_at,
      updatedAt: listing.updated_at
    }
  } catch (error) {
    console.error("Error in getAccommodationById:", error)
    // Fallback to mock data
    return mockAccommodationListings.find(item => item.id === id) || null
  }
}

// Get user's accommodation listings
export const getUserAccommodations = async (userId: string): Promise<AccommodationListing[]> => {
  try {
    const { data, error } = await supabase
      .from("accommodation_listings")
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false })
      
    if (error) {
      console.error("Error fetching user accommodations:", error)
      // Fallback to mock data filtered by user ID
      return mockAccommodationListings.filter(item => item.ownerId === userId)
    }
    
    return data.map(listing => ({
      id: listing.id,
      title: listing.title,
      description: listing.description,
      ownerId: listing.owner_id,
      typeId: listing.type_id,
      amenities: listing.amenities || [],
      pricePerMonth: listing.price_per_month,
      securityDeposit: listing.security_deposit,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      maxOccupants: listing.max_occupants,
      address: listing.address,
      locationLat: listing.location_lat,
      locationLng: listing.location_lng,
      images: listing.images || [],
      availableFrom: listing.available_from,
      minimumStayMonths: listing.minimum_stay_months,
      isFurnished: listing.is_furnished,
      isVerified: listing.is_verified,
      isActive: listing.is_active,
      featured: listing.featured,
      createdAt: listing.created_at,
      updatedAt: listing.updated_at
    }))
  } catch (error) {
    console.error("Error in getUserAccommodations:", error)
    // Fallback to mock data filtered by user ID
    return mockAccommodationListings.filter(item => item.ownerId === userId)
  }
}

// Create accommodation listing
export const createAccommodation = async (data: Partial<AccommodationListing>): Promise<AccommodationListing> => {
  try {
    const { data: newListing, error } = await supabase
      .from("accommodation_listings")
      .insert({
        title: data.title,
        description: data.description,
        owner_id: data.ownerId,
        type_id: data.typeId,
        amenities: data.amenities || [],
        price_per_month: data.pricePerMonth,
        security_deposit: data.securityDeposit,
        bedrooms: data.bedrooms || 1,
        bathrooms: data.bathrooms || 1,
        max_occupants: data.maxOccupants || 1,
        address: data.address,
        location_lat: data.locationLat,
        location_lng: data.locationLng,
        images: data.images || [],
        available_from: data.availableFrom,
        minimum_stay_months: data.minimumStayMonths || 1,
        is_furnished: data.isFurnished || false,
        is_verified: false,
        is_active: true,
        featured: false
      })
      .select()
      .single()
      
    if (error) {
      console.error("Error creating accommodation:", error)
      throw new Error(error.message)
    }
    
    return {
      id: newListing.id,
      title: newListing.title,
      description: newListing.description,
      ownerId: newListing.owner_id,
      typeId: newListing.type_id,
      amenities: newListing.amenities || [],
      pricePerMonth: newListing.price_per_month,
      securityDeposit: newListing.security_deposit,
      bedrooms: newListing.bedrooms,
      bathrooms: newListing.bathrooms,
      maxOccupants: newListing.max_occupants,
      address: newListing.address,
      locationLat: newListing.location_lat,
      locationLng: newListing.location_lng,
      images: newListing.images || [],
      availableFrom: newListing.available_from,
      minimumStayMonths: newListing.minimum_stay_months,
      isFurnished: newListing.is_furnished,
      isVerified: newListing.is_verified,
      isActive: newListing.is_active,
      featured: newListing.featured,
      createdAt: newListing.created_at,
      updatedAt: newListing.updated_at
    }
  } catch (error) {
    console.error("Error in createAccommodation:", error)
    throw error
  }
}

// Update accommodation listing
export const updateAccommodation = async (id: string, data: Partial<AccommodationListing>): Promise<AccommodationListing> => {
  try {
    const { data: updatedListing, error } = await supabase
      .from("accommodation_listings")
      .update({
        title: data.title,
        description: data.description,
        type_id: data.typeId,
        amenities: data.amenities,
        price_per_month: data.pricePerMonth,
        security_deposit: data.securityDeposit,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        max_occupants: data.maxOccupants,
        address: data.address,
        location_lat: data.locationLat,
        location_lng: data.locationLng,
        images: data.images,
        available_from: data.availableFrom,
        minimum_stay_months: data.minimumStayMonths,
        is_furnished: data.isFurnished,
        is_active: data.isActive
      })
      .eq("id", id)
      .select()
      .single()
      
    if (error) {
      console.error("Error updating accommodation:", error)
      throw new Error(error.message)
    }
    
    return {
      id: updatedListing.id,
      title: updatedListing.title,
      description: updatedListing.description,
      ownerId: updatedListing.owner_id,
      typeId: updatedListing.type_id,
      amenities: updatedListing.amenities || [],
      pricePerMonth: updatedListing.price_per_month,
      securityDeposit: updatedListing.security_deposit,
      bedrooms: updatedListing.bedrooms,
      bathrooms: updatedListing.bathrooms,
      maxOccupants: updatedListing.max_occupants,
      address: updatedListing.address,
      locationLat: updatedListing.location_lat,
      locationLng: updatedListing.location_lng,
      images: updatedListing.images || [],
      availableFrom: updatedListing.available_from,
      minimumStayMonths: updatedListing.minimum_stay_months,
      isFurnished: updatedListing.is_furnished,
      isVerified: updatedListing.is_verified,
      isActive: updatedListing.is_active,
      featured: updatedListing.featured,
      createdAt: updatedListing.created_at,
      updatedAt: updatedListing.updated_at
    }
  } catch (error) {
    console.error("Error in updateAccommodation:", error)
    throw error
  }
}

// Delete accommodation listing
export const deleteAccommodation = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("accommodation_listings")
      .delete()
      .eq("id", id)
      
    if (error) {
      console.error("Error deleting accommodation:", error)
      return false
    }
    
    return true
  } catch (error) {
    console.error("Error in deleteAccommodation:", error)
    return false
  }
}

// Bookings
export const getBookings = async (userId: string, role: "tenant" | "owner" = "tenant"): Promise<AccommodationBooking[]> => {
  try {
    const query = supabase
      .from("accommodation_bookings")
      .select(`
        *,
        listing:listing_id(
          id,
          title,
          price_per_month,
          images,
          bedrooms,
          bathrooms,
          address
        ),
        owner:owner_id(
          id, 
          first_name, 
          last_name, 
          avatar_url, 
          is_verified
        ),
        tenant:tenant_id(
          id, 
          first_name, 
          last_name, 
          avatar_url, 
          is_verified
        )
      `)
      
    // Filter by user role
    const { data, error } = await query
      .eq(role === "tenant" ? "tenant_id" : "owner_id", userId)
      .order("created_at", { ascending: false })
      
    if (error) {
      console.error("Error fetching bookings:", error)
      return []
    }
    
    return data.map(booking => {
      const tenant = booking.tenant ? {
        id: booking.tenant.id,
        firstName: booking.tenant.first_name || "",
        lastName: booking.tenant.last_name || "",
        email: "",
        role: "student",
        isVerified: booking.tenant.is_verified || false,
        profilePicture: booking.tenant.avatar_url,
        createdAt: ""
      } : undefined
      
      const owner = booking.owner ? {
        id: booking.owner.id,
        firstName: booking.owner.first_name || "",
        lastName: booking.owner.last_name || "",
        email: "",
        role: "student",
        isVerified: booking.owner.is_verified || false,
        profilePicture: booking.owner.avatar_url,
        createdAt: ""
      } : undefined
      
      const listing = booking.listing ? {
        id: booking.listing.id,
        title: booking.listing.title,
        pricePerMonth: booking.listing.price_per_month,
        images: booking.listing.images || [],
        bedrooms: booking.listing.bedrooms,
        bathrooms: booking.listing.bathrooms,
        address: booking.listing.address,
        ownerId: booking.owner_id,
        typeId: "", // Not included in the select
        amenities: [],
        description: "",
        maxOccupants: 1,
        locationLat: 0,
        locationLng: 0,
        availableFrom: "",
        minimumStayMonths: 1,
        isFurnished: false,
        isVerified: false,
        isActive: true,
        featured: false,
        createdAt: "",
        updatedAt: ""
      } : undefined
      
      return {
        id: booking.id,
        listingId: booking.listing_id,
        listing: listing,
        tenantId: booking.tenant_id,
        tenant: tenant,
        ownerId: booking.owner_id,
        owner: owner,
        status: booking.status,
        moveInDate: booking.move_in_date,
        moveOutDate: booking.move_out_date,
        monthlyRent: booking.monthly_rent,
        securityDeposit: booking.security_deposit,
        isDepositPaid: booking.is_deposit_paid,
        specialRequests: booking.special_requests,
        createdAt: booking.created_at,
        updatedAt: booking.updated_at
      }
    })
  } catch (error) {
    console.error("Error in getBookings:", error)
    return []
  }
}

export const getBookingById = async (id: string): Promise<AccommodationBooking | null> => {
  try {
    const { data: booking, error } = await supabase
      .from("accommodation_bookings")
      .select(`
        *,
        listing:listing_id(*),
        owner:owner_id(*),
        tenant:tenant_id(*)
      `)
      .eq("id", id)
      .single()
      
    if (error) {
      console.error("Error fetching booking:", error)
      return null
    }
    
    const tenant = booking.tenant ? {
      id: booking.tenant.id,
      firstName: booking.tenant.first_name || "",
      lastName: booking.tenant.last_name || "",
      email: booking.tenant.email || "",
      role: booking.tenant.role || "student",
      isVerified: booking.tenant.is_verified || false,
      profilePicture: booking.tenant.avatar_url,
      createdAt: booking.tenant.created_at
    } : undefined
    
    const owner = booking.owner ? {
      id: booking.owner.id,
      firstName: booking.owner.first_name || "",
      lastName: booking.owner.last_name || "",
      email: booking.owner.email || "",
      role: booking.owner.role || "student",
      isVerified: booking.owner.is_verified || false,
      profilePicture: booking.owner.avatar_url,
      createdAt: booking.owner.created_at
    } : undefined
    
    const listing: AccommodationListing | undefined = booking.listing ? {
      id: booking.listing.id,
      title: booking.listing.title,
      description: booking.listing.description,
      ownerId: booking.listing.owner_id,
      typeId: booking.listing.type_id,
      amenities: booking.listing.amenities || [],
      pricePerMonth: booking.listing.price_per_month,
      securityDeposit: booking.listing.security_deposit,
      bedrooms: booking.listing.bedrooms,
      bathrooms: booking.listing.bathrooms,
      maxOccupants: booking.listing.max_occupants,
      address: booking.listing.address,
      locationLat: booking.listing.location_lat,
      locationLng: booking.listing.location_lng,
      images: booking.listing.images || [],
      availableFrom: booking.listing.available_from,
      minimumStayMonths: booking.listing.minimum_stay_months,
      isFurnished: booking.listing.is_furnished,
      isVerified: booking.listing.is_verified,
      isActive: booking.listing.is_active,
      featured: booking.listing.featured,
      createdAt: booking.listing.created_at,
      updatedAt: booking.listing.updated_at
    } : undefined
    
    return {
      id: booking.id,
      listingId: booking.listing_id,
      listing: listing,
      tenantId: booking.tenant_id,
      tenant: tenant,
      ownerId: booking.owner_id,
      owner: owner,
      status: booking.status,
      moveInDate: booking.move_in_date,
      moveOutDate: booking.move_out_date,
      monthlyRent: booking.monthly_rent,
      securityDeposit: booking.security_deposit,
      isDepositPaid: booking.is_deposit_paid,
      specialRequests: booking.special_requests,
      createdAt: booking.created_at,
      updatedAt: booking.updated_at
    }
  } catch (error) {
    console.error("Error in getBookingById:", error)
    return null
  }
}

export const createBooking = async (data: Partial<AccommodationBooking>): Promise<AccommodationBooking> => {
  try {
    // First get the listing to get the owner ID
    const { data: listing, error: listingError } = await supabase
      .from("accommodation_listings")
      .select("owner_id")
      .eq("id", data.listingId)
      .single()
      
    if (listingError) {
      console.error("Error fetching listing for booking:", listingError)
      throw new Error(listingError.message)
    }
    
    const { data: newBooking, error } = await supabase
      .from("accommodation_bookings")
      .insert({
        listing_id: data.listingId,
        tenant_id: data.tenantId,
        owner_id: listing.owner_id,
        status: "pending",
        move_in_date: data.moveInDate,
        move_out_date: data.moveOutDate,
        monthly_rent: data.monthlyRent,
        security_deposit: data.securityDeposit,
        is_deposit_paid: false,
        special_requests: data.specialRequests
      })
      .select()
      .single()
      
    if (error) {
      console.error("Error creating booking:", error)
      throw new Error(error.message)
    }
    
    return {
      id: newBooking.id,
      listingId: newBooking.listing_id,
      tenantId: newBooking.tenant_id,
      ownerId: newBooking.owner_id,
      status: newBooking.status,
      moveInDate: newBooking.move_in_date,
      moveOutDate: newBooking.move_out_date,
      monthlyRent: newBooking.monthly_rent,
      securityDeposit: newBooking.security_deposit,
      isDepositPaid: newBooking.is_deposit_paid,
      specialRequests: newBooking.special_requests,
      createdAt: newBooking.created_at,
      updatedAt: newBooking.updated_at
    }
  } catch (error) {
    console.error("Error in createBooking:", error)
    throw error
  }
}

export const updateBookingStatus = async (id: string, status: AccommodationBooking["status"]): Promise<AccommodationBooking> => {
  try {
    const { data: updatedBooking, error } = await supabase
      .from("accommodation_bookings")
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single()
      
    if (error) {
      console.error("Error updating booking status:", error)
      throw new Error(error.message)
    }
    
    return {
      id: updatedBooking.id,
      listingId: updatedBooking.listing_id,
      tenantId: updatedBooking.tenant_id,
      ownerId: updatedBooking.owner_id,
      status: updatedBooking.status,
      moveInDate: updatedBooking.move_in_date,
      moveOutDate: updatedBooking.move_out_date,
      monthlyRent: updatedBooking.monthly_rent,
      securityDeposit: updatedBooking.security_deposit,
      isDepositPaid: updatedBooking.is_deposit_paid,
      specialRequests: updatedBooking.special_requests,
      createdAt: updatedBooking.created_at,
      updatedAt: updatedBooking.updated_at
    }
  } catch (error) {
    console.error("Error in updateBookingStatus:", error)
    throw error
  }
}

// Reviews
export const getAccommodationReviews = async (listingId: string): Promise<AccommodationReview[]> => {
  try {
    const { data, error } = await supabase
      .from("accommodation_reviews")
      .select(`
        *,
        reviewer:reviewer_id(
          id, 
          first_name, 
          last_name, 
          avatar_url, 
          is_verified
        )
      `)
      .eq("listing_id", listingId)
      .order("created_at", { ascending: false })
      
    if (error) {
      console.error("Error fetching accommodation reviews:", error)
      return []
    }
    
    return data.map(review => {
      const reviewer = review.reviewer ? {
        id: review.reviewer.id,
        firstName: review.reviewer.first_name || "",
        lastName: review.reviewer.last_name || "",
        email: "",
        role: "student",
        isVerified: review.reviewer.is_verified || false,
        profilePicture: review.reviewer.avatar_url,
        createdAt: ""
      } : undefined
      
      return {
        id: review.id,
        listingId: review.listing_id,
        reviewerId: review.reviewer_id,
        reviewer: reviewer,
        bookingId: review.booking_id,
        rating: review.rating,
        reviewText: review.review_text,
        createdAt: review.created_at
      }
    })
  } catch (error) {
    console.error("Error in getAccommodationReviews:", error)
    return []
  }
}

export const createAccommodationReview = async (data: Partial<AccommodationReview>): Promise<AccommodationReview> => {
  try {
    const { data: newReview, error } = await supabase
      .from("accommodation_reviews")
      .insert({
        listing_id: data.listingId,
        reviewer_id: data.reviewerId,
        booking_id: data.bookingId,
        rating: data.rating,
        review_text: data.reviewText
      })
      .select()
      .single()
      
    if (error) {
      console.error("Error creating accommodation review:", error)
      throw new Error(error.message)
    }
    
    return {
      id: newReview.id,
      listingId: newReview.listing_id,
      reviewerId: newReview.reviewer_id,
      bookingId: newReview.booking_id,
      rating: newReview.rating,
      reviewText: newReview.review_text,
      createdAt: newReview.created_at
    }
  } catch (error) {
    console.error("Error in createAccommodationReview:", error)
    throw error
  }
} 