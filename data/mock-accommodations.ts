import { AccommodationListing } from "@/types"

export const mockAccommodationListings: AccommodationListing[] = [
  {
    id: "1",
    title: "Modern Studio Apartment Near Campus",
    description: "Bright and modern studio apartment with all utilities included. Perfect for students looking for peace and quiet. Easy 10-minute walk to main campus buildings.",
    ownerId: "user1",
    owner: {
      id: "user1",
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@example.com",
      role: "student",
      isVerified: true,
      profilePicture: "https://randomuser.me/api/portraits/men/1.jpg",
      createdAt: "2023-08-15T10:30:00Z",
      rating: 4.8
    },
    typeId: "2",
    type: {
      id: "2",
      name: "Studio",
      description: "Open-plan living space with combined bedroom and living area",
      icon: "studio"
    },
    amenities: ["1", "2", "3", "6", "13"],
    amenityDetails: [
      { id: "1", name: "Wi-Fi", icon: "wifi", category: "essential" },
      { id: "2", name: "Kitchen", icon: "kitchen", category: "essential" },
      { id: "3", name: "Washing machine", icon: "wash", category: "essential" },
      { id: "6", name: "TV", icon: "tv", category: "feature" },
      { id: "13", name: "Near campus", icon: "map-pin", category: "location" }
    ],
    pricePerMonth: 650,
    securityDeposit: 650,
    bedrooms: 1,
    bathrooms: 1,
    maxOccupants: 1,
    address: "123 University Avenue, Campus Town",
    locationLat: 40.7128,
    locationLng: -74.0060,
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80",
      "https://images.unsplash.com/photo-1499916078039-922301b0eb9b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80"
    ],
    availableFrom: "2023-09-01",
    minimumStayMonths: 6,
    isFurnished: true,
    isVerified: true,
    isActive: true,
    featured: true,
    createdAt: "2023-08-15T10:30:00Z",
    updatedAt: "2023-08-15T10:30:00Z"
  },
  {
    id: "2",
    title: "Spacious 2-Bedroom Apartment with Balcony",
    description: "Lovely spacious apartment perfect for sharing. Features a modern kitchen, large living room, and a balcony with views of the campus park. Includes high-speed internet and utilities.",
    ownerId: "user2",
    owner: {
      id: "user2",
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah.johnson@example.com",
      role: "student",
      isVerified: true,
      profilePicture: "https://randomuser.me/api/portraits/women/2.jpg",
      createdAt: "2023-07-20T14:45:00Z",
      rating: 4.9
    },
    typeId: "1",
    type: {
      id: "1",
      name: "Apartment",
      description: "Fully furnished apartment with separate bedroom",
      icon: "apartment"
    },
    amenities: ["1", "2", "3", "5", "7", "13", "14"],
    amenityDetails: [
      { id: "1", name: "Wi-Fi", icon: "wifi", category: "essential" },
      { id: "2", name: "Kitchen", icon: "kitchen", category: "essential" },
      { id: "3", name: "Washing machine", icon: "wash", category: "essential" },
      { id: "5", name: "Air conditioning", icon: "wind", category: "feature" },
      { id: "7", name: "Free parking", icon: "car", category: "feature" },
      { id: "13", name: "Near campus", icon: "map-pin", category: "location" },
      { id: "14", name: "Near public transport", icon: "bus", category: "location" }
    ],
    pricePerMonth: 1100,
    securityDeposit: 1100,
    bedrooms: 2,
    bathrooms: 1,
    maxOccupants: 3,
    address: "456 College Street, Campus Town",
    locationLat: 40.7150,
    locationLng: -74.0080,
    images: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80",
      "https://images.unsplash.com/photo-1512916194211-3f2b7f5f7de3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80",
      "https://images.unsplash.com/photo-1560185007-5f0bb1866cab?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80"
    ],
    availableFrom: "2023-09-15",
    minimumStayMonths: 12,
    isFurnished: true,
    isVerified: true,
    isActive: true,
    featured: true,
    createdAt: "2023-07-20T14:45:00Z",
    updatedAt: "2023-07-20T14:45:00Z"
  },
  {
    id: "3",
    title: "Cozy Room in Student House",
    description: "Comfortable private room in a friendly shared house. Shared kitchen, bathroom, and living space with 3 other students. All bills included. Great community atmosphere.",
    ownerId: "user3",
    owner: {
      id: "user3",
      firstName: "Michael",
      lastName: "Brown",
      email: "michael.brown@example.com",
      role: "student",
      isVerified: true,
      profilePicture: "https://randomuser.me/api/portraits/men/3.jpg",
      createdAt: "2023-08-01T09:15:00Z",
      rating: 4.7
    },
    typeId: "3",
    type: {
      id: "3",
      name: "Room in shared house",
      description: "Private room with shared common areas",
      icon: "bed"
    },
    amenities: ["1", "2", "3", "4", "13", "15"],
    amenityDetails: [
      { id: "1", name: "Wi-Fi", icon: "wifi", category: "essential" },
      { id: "2", name: "Kitchen", icon: "kitchen", category: "essential" },
      { id: "3", name: "Washing machine", icon: "wash", category: "essential" },
      { id: "4", name: "Heating", icon: "thermometer", category: "essential" },
      { id: "13", name: "Near campus", icon: "map-pin", category: "location" },
      { id: "15", name: "Near shops", icon: "shopping-bag", category: "location" }
    ],
    pricePerMonth: 450,
    securityDeposit: 450,
    bedrooms: 1,
    bathrooms: 1.5,
    maxOccupants: 1,
    address: "789 Student Lane, Campus Town",
    locationLat: 40.7190,
    locationLng: -74.0100,
    images: [
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80",
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80"
    ],
    availableFrom: "2023-09-01",
    minimumStayMonths: 9,
    isFurnished: true,
    isVerified: true,
    isActive: true,
    featured: false,
    createdAt: "2023-08-01T09:15:00Z",
    updatedAt: "2023-08-01T09:15:00Z"
  },
  {
    id: "4",
    title: "Luxury 3-Bedroom House with Garden",
    description: "Beautiful modern house with three bedrooms, perfect for a group of students. Features a spacious kitchen, large living room, and a private garden. Close to campus with excellent transport links.",
    ownerId: "user4",
    owner: {
      id: "user4",
      firstName: "Emma",
      lastName: "Davis",
      email: "emma.davis@example.com",
      role: "student",
      isVerified: true,
      profilePicture: "https://randomuser.me/api/portraits/women/4.jpg",
      createdAt: "2023-07-10T11:20:00Z",
      rating: 4.9
    },
    typeId: "4",
    type: {
      id: "4",
      name: "Entire house",
      description: "Complete house for rent",
      icon: "home"
    },
    amenities: ["1", "2", "3", "4", "5", "6", "7", "10", "11", "14", "15"],
    amenityDetails: [
      { id: "1", name: "Wi-Fi", icon: "wifi", category: "essential" },
      { id: "2", name: "Kitchen", icon: "kitchen", category: "essential" },
      { id: "3", name: "Washing machine", icon: "wash", category: "essential" },
      { id: "4", name: "Heating", icon: "thermometer", category: "essential" },
      { id: "5", name: "Air conditioning", icon: "wind", category: "feature" },
      { id: "6", name: "TV", icon: "tv", category: "feature" },
      { id: "7", name: "Free parking", icon: "car", category: "feature" },
      { id: "10", name: "Fire extinguisher", icon: "fire-extinguisher", category: "safety" },
      { id: "11", name: "Smoke alarm", icon: "alert-triangle", category: "safety" },
      { id: "14", name: "Near public transport", icon: "bus", category: "location" },
      { id: "15", name: "Near shops", icon: "shopping-bag", category: "location" }
    ],
    pricePerMonth: 1800,
    securityDeposit: 1800,
    bedrooms: 3,
    bathrooms: 2,
    maxOccupants: 4,
    address: "101 Academic Drive, Campus Town",
    locationLat: 40.7220,
    locationLng: -74.0130,
    images: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80",
      "https://images.unsplash.com/photo-1576941089067-2de3c901e126?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80"
    ],
    availableFrom: "2023-09-01",
    minimumStayMonths: 12,
    isFurnished: true,
    isVerified: true,
    isActive: true,
    featured: true,
    createdAt: "2023-07-10T11:20:00Z",
    updatedAt: "2023-07-10T11:20:00Z"
  },
  {
    id: "5",
    title: "University Dormitory Single Room",
    description: "Standard single room in the university dormitory. Includes a bed, desk, wardrobe, and shared bathroom facilities. Meal plan available. Great way to meet other students and get involved in campus life.",
    ownerId: "user5",
    owner: {
      id: "user5",
      firstName: "University",
      lastName: "Housing",
      email: "housing@university.edu",
      role: "admin",
      isVerified: true,
      profilePicture: "https://images.unsplash.com/photo-1594322436404-5a0526db4d13?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2029&q=80",
      createdAt: "2023-05-01T08:00:00Z",
      rating: 4.5
    },
    typeId: "5",
    type: {
      id: "5",
      name: "Dormitory",
      description: "Student dormitory room",
      icon: "door-open"
    },
    amenities: ["1", "4", "11", "12", "13"],
    amenityDetails: [
      { id: "1", name: "Wi-Fi", icon: "wifi", category: "essential" },
      { id: "4", name: "Heating", icon: "thermometer", category: "essential" },
      { id: "11", name: "Smoke alarm", icon: "alert-triangle", category: "safety" },
      { id: "12", name: "First aid kit", icon: "plus", category: "safety" },
      { id: "13", name: "Near campus", icon: "map-pin", category: "location" }
    ],
    pricePerMonth: 550,
    securityDeposit: 300,
    bedrooms: 1,
    bathrooms: 0.5,
    maxOccupants: 1,
    address: "University Dormitory, Central Campus",
    locationLat: 40.7180,
    locationLng: -74.0070,
    images: [
      "https://images.unsplash.com/photo-1626193080272-5392184f5d14?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      "https://images.unsplash.com/photo-1628745277862-bc0b2d68c50c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80"
    ],
    availableFrom: "2023-09-01",
    minimumStayMonths: 4,
    isFurnished: true,
    isVerified: true,
    isActive: true,
    featured: false,
    createdAt: "2023-06-01T10:00:00Z",
    updatedAt: "2023-06-01T10:00:00Z"
  }
] 