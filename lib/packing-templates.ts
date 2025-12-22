// Packing list templates and weather-based recommendations

export interface PackingTemplate {
  id: string
  name: string
  description: string
  icon: string
  items: {
    name: string
    category: string
    quantity: number
    essential: boolean
  }[]
}

export const packingTemplates: PackingTemplate[] = [
  {
    id: "beach-vacation",
    name: "Beach Vacation",
    description: "Perfect for tropical destinations and beach resorts",
    icon: "🏖️",
    items: [
      { name: "Swimsuit", category: "clothing", quantity: 2, essential: true },
      { name: "Beach towel", category: "accessories", quantity: 1, essential: true },
      { name: "Sunscreen SPF 50+", category: "toiletries", quantity: 1, essential: true },
      { name: "Sunglasses", category: "accessories", quantity: 1, essential: true },
      { name: "Sun hat", category: "accessories", quantity: 1, essential: true },
      { name: "Flip flops", category: "clothing", quantity: 1, essential: true },
      { name: "Light cover-up", category: "clothing", quantity: 2, essential: false },
      { name: "Waterproof phone case", category: "electronics", quantity: 1, essential: false },
      { name: "Beach bag", category: "accessories", quantity: 1, essential: false },
      { name: "After-sun lotion", category: "toiletries", quantity: 1, essential: false },
    ],
  },
  {
    id: "city-break",
    name: "City Break",
    description: "Ideal for urban exploration and city tours",
    icon: "🏙️",
    items: [
      { name: "Comfortable walking shoes", category: "clothing", quantity: 1, essential: true },
      { name: "Day backpack", category: "accessories", quantity: 1, essential: true },
      { name: "Portable charger", category: "electronics", quantity: 1, essential: true },
      { name: "City map/guidebook", category: "accessories", quantity: 1, essential: false },
      { name: "Reusable water bottle", category: "accessories", quantity: 1, essential: true },
      { name: "Light jacket", category: "clothing", quantity: 1, essential: true },
      { name: "Crossbody bag", category: "accessories", quantity: 1, essential: false },
      { name: "Camera", category: "electronics", quantity: 1, essential: false },
      { name: "Universal adapter", category: "electronics", quantity: 1, essential: true },
    ],
  },
  {
    id: "winter-trip",
    name: "Winter Trip",
    description: "For cold weather destinations and snow activities",
    icon: "❄️",
    items: [
      { name: "Winter coat", category: "clothing", quantity: 1, essential: true },
      { name: "Thermal underwear", category: "clothing", quantity: 2, essential: true },
      { name: "Warm gloves", category: "accessories", quantity: 1, essential: true },
      { name: "Wool socks", category: "clothing", quantity: 3, essential: true },
      { name: "Winter boots", category: "clothing", quantity: 1, essential: true },
      { name: "Scarf", category: "accessories", quantity: 1, essential: true },
      { name: "Beanie/winter hat", category: "accessories", quantity: 1, essential: true },
      { name: "Hand warmers", category: "accessories", quantity: 5, essential: false },
      { name: "Lip balm", category: "toiletries", quantity: 1, essential: true },
      { name: "Moisturizer", category: "toiletries", quantity: 1, essential: true },
    ],
  },
  {
    id: "hiking-camping",
    name: "Hiking & Camping",
    description: "Essential gear for outdoor adventures",
    icon: "🏕️",
    items: [
      { name: "Hiking boots", category: "clothing", quantity: 1, essential: true },
      { name: "Backpack", category: "accessories", quantity: 1, essential: true },
      { name: "Water bottle", category: "accessories", quantity: 2, essential: true },
      { name: "First aid kit", category: "accessories", quantity: 1, essential: true },
      { name: "Headlamp/flashlight", category: "electronics", quantity: 1, essential: true },
      { name: "Multi-tool", category: "accessories", quantity: 1, essential: true },
      { name: "Rain jacket", category: "clothing", quantity: 1, essential: true },
      { name: "Insect repellent", category: "toiletries", quantity: 1, essential: true },
      { name: "Trail snacks", category: "food", quantity: 5, essential: true },
      { name: "Map and compass", category: "accessories", quantity: 1, essential: true },
    ],
  },
  {
    id: "business-trip",
    name: "Business Trip",
    description: "Professional essentials for work travel",
    icon: "💼",
    items: [
      { name: "Business suit", category: "clothing", quantity: 2, essential: true },
      { name: "Dress shoes", category: "clothing", quantity: 1, essential: true },
      { name: "Laptop", category: "electronics", quantity: 1, essential: true },
      { name: "Laptop charger", category: "electronics", quantity: 1, essential: true },
      { name: "Business cards", category: "accessories", quantity: 20, essential: true },
      { name: "Portfolio/briefcase", category: "accessories", quantity: 1, essential: true },
      { name: "Iron travel steamer", category: "accessories", quantity: 1, essential: false },
      { name: "Tie/accessories", category: "clothing", quantity: 2, essential: true },
      { name: "USB drive", category: "electronics", quantity: 1, essential: false },
    ],
  },
  {
    id: "weekend-getaway",
    name: "Weekend Getaway",
    description: "Quick packing for short trips",
    icon: "🎒",
    items: [
      { name: "Casual outfits", category: "clothing", quantity: 3, essential: true },
      { name: "Underwear", category: "clothing", quantity: 3, essential: true },
      { name: "Toiletries bag", category: "toiletries", quantity: 1, essential: true },
      { name: "Phone charger", category: "electronics", quantity: 1, essential: true },
      { name: "Sneakers", category: "clothing", quantity: 1, essential: true },
      { name: "Light jacket", category: "clothing", quantity: 1, essential: true },
      { name: "Sunglasses", category: "accessories", quantity: 1, essential: false },
      { name: "Book/entertainment", category: "accessories", quantity: 1, essential: false },
    ],
  },
]

export interface WeatherRecommendation {
  condition: string
  items: string[]
  notes: string
}

export function getWeatherRecommendations(weatherCondition: string, temperature: number): WeatherRecommendation {
  // Temperature ranges in Fahrenheit
  const isHot = temperature >= 80
  const isWarm = temperature >= 65 && temperature < 80
  const isCool = temperature >= 45 && temperature < 65
  const isCold = temperature < 45

  const recommendations: WeatherRecommendation = {
    condition: "",
    items: [],
    notes: "",
  }

  // Base items for all conditions
  const baseItems = ["Phone charger", "Toiletries", "Underwear", "Socks"]

  if (weatherCondition.toLowerCase().includes("rain") || weatherCondition.toLowerCase().includes("shower")) {
    recommendations.condition = "Rainy"
    recommendations.items = [
      ...baseItems,
      "Raincoat or umbrella",
      "Waterproof shoes",
      "Waterproof bag",
      "Extra socks",
      "Quick-dry clothing",
    ]
    recommendations.notes = "Pack waterproof gear and quick-dry materials. Consider bringing plastic bags for electronics."
  } else if (weatherCondition.toLowerCase().includes("snow")) {
    recommendations.condition = "Snowy"
    recommendations.items = [
      ...baseItems,
      "Winter coat",
      "Waterproof boots",
      "Thermal underwear",
      "Gloves",
      "Warm hat",
      "Scarf",
      "Hand warmers",
      "Moisturizer",
    ]
    recommendations.notes = "Layer your clothing and protect extremities. Moisturize frequently in cold, dry conditions."
  } else if (isHot) {
    recommendations.condition = "Hot & Sunny"
    recommendations.items = [
      ...baseItems,
      "Sunscreen SPF 50+",
      "Sunglasses",
      "Sun hat",
      "Light, breathable clothing",
      "Sandals",
      "Reusable water bottle",
      "After-sun lotion",
    ]
    recommendations.notes = "Stay hydrated and protect yourself from the sun. Wear light colors and breathable fabrics."
  } else if (isWarm) {
    recommendations.condition = "Warm & Pleasant"
    recommendations.items = [
      ...baseItems,
      "Light jacket",
      "Comfortable walking shoes",
      "Sunglasses",
      "Sunscreen",
      "Light layers",
    ]
    recommendations.notes = "Perfect weather for outdoor activities. Bring layers for evening temperature drops."
  } else if (isCool) {
    recommendations.condition = "Cool"
    recommendations.items = [
      ...baseItems,
      "Medium-weight jacket",
      "Long pants",
      "Closed-toe shoes",
      "Light sweater",
      "Scarf (optional)",
    ]
    recommendations.notes = "Layer your clothing for flexibility. Mornings and evenings may be chilly."
  } else if (isCold) {
    recommendations.condition = "Cold"
    recommendations.items = [
      ...baseItems,
      "Heavy coat",
      "Warm boots",
      "Thermal layers",
      "Gloves",
      "Warm hat",
      "Scarf",
      "Lip balm",
    ]
    recommendations.notes = "Bundle up with multiple layers. Protect exposed skin from cold and wind."
  }

  return recommendations
}

export function getTemplateByType(type: string): PackingTemplate | undefined {
  return packingTemplates.find((t) => t.id === type)
}

export function getAllTemplates(): PackingTemplate[] {
  return packingTemplates
}
