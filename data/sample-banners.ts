import type { Banner } from "@/services/banner-service"

export const sampleBanners: Banner[] = [
  {
    id: "1",
    title: "Back to School Sale",
    description: "Get up to 50% off on textbooks and supplies",
    imageUrl: "/placeholder.svg?height=300&width=600&text=Back+to+School+Sale",
    actionUrl: "/marketplace?category=books",
  },
  {
    id: "2",
    title: "Tech Deals",
    description: "Find the best deals on laptops and electronics",
    imageUrl: "/placeholder.svg?height=300&width=600&text=Tech+Deals",
    actionUrl: "/marketplace?category=tech",
  },
  {
    id: "3",
    title: "Dorm Essentials",
    description: "Everything you need for your dorm room",
    imageUrl: "/placeholder.svg?height=300&width=600&text=Dorm+Essentials",
    actionUrl: "/marketplace?category=room",
  },
]
