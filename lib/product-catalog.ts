// Product catalog for packing list auto-matching
// Maps common packing list item names to affiliate product suggestions
// Partner URLs are placeholders — swap with real affiliate partner URLs when ready

export interface ProductMatch {
  itemKeywords: string[]
  product: {
    name: string
    partner: string
    url: string
    price: number
    category: string
  }
}

export const PRODUCT_CATALOG: ProductMatch[] = [
  // Electronics
  {
    itemKeywords: ["portable charger", "power bank", "battery pack"],
    product: {
      name: "Anker PowerCore 10000mAh",
      partner: "Amazon",
      url: "https://www.amazon.com/dp/B0194WDVHI",
      price: 25.99,
      category: "Travel Tech",
    },
  },
  {
    itemKeywords: ["universal adapter", "travel adapter", "power adapter", "plug adapter"],
    product: {
      name: "Epicka Universal Travel Adapter",
      partner: "Amazon",
      url: "https://www.amazon.com/dp/B078S3M1BW",
      price: 13.99,
      category: "Travel Tech",
    },
  },
  {
    itemKeywords: ["earbuds", "headphones", "noise cancelling", "earphones"],
    product: {
      name: "Sony WF-1000XM5 Earbuds",
      partner: "Amazon",
      url: "https://www.amazon.com/dp/B0C33XXS56",
      price: 279.99,
      category: "Electronics",
    },
  },
  {
    itemKeywords: ["phone charger", "charging cable", "usb cable"],
    product: {
      name: "Anker USB-C Fast Charging Cable 2-Pack",
      partner: "Amazon",
      url: "https://www.amazon.com/dp/B07DC5PPFV",
      price: 9.99,
      category: "Travel Tech",
    },
  },
  {
    itemKeywords: ["waterproof phone case", "phone pouch"],
    product: {
      name: "JOTO Waterproof Phone Pouch",
      partner: "Amazon",
      url: "https://www.amazon.com/dp/B00LBK7OSY",
      price: 8.99,
      category: "Travel Tech",
    },
  },
  {
    itemKeywords: ["camera"],
    product: {
      name: "Sony ZV-1F Vlog Camera",
      partner: "Amazon",
      url: "https://www.amazon.com/dp/B0BHKJMMGL",
      price: 398.0,
      category: "Electronics",
    },
  },
  {
    itemKeywords: ["headlamp", "flashlight"],
    product: {
      name: "Petzl Actik Core Headlamp",
      partner: "REI",
      url: "https://www.rei.com/product/171793/petzl-actik-core-headlamp",
      price: 69.95,
      category: "Travel Tech",
    },
  },

  // Toiletries & Sun
  {
    itemKeywords: ["sunscreen", "sun cream", "spf", "reef-safe sunscreen"],
    product: {
      name: "Sun Bum SPF 50 Sunscreen Lotion",
      partner: "Amazon",
      url: "https://www.amazon.com/dp/B004XDSBCE",
      price: 16.98,
      category: "Beach & Sun",
    },
  },
  {
    itemKeywords: ["after-sun", "aloe vera", "after sun lotion"],
    product: {
      name: "Sun Bum Cool Down Aloe Vera Gel",
      partner: "Amazon",
      url: "https://www.amazon.com/dp/B00NQSN0SU",
      price: 12.99,
      category: "Beach & Sun",
    },
  },
  {
    itemKeywords: ["insect repellent", "bug spray", "mosquito"],
    product: {
      name: "Sawyer Picaridin Insect Repellent",
      partner: "REI",
      url: "https://www.rei.com/product/113340/sawyer-products-picaridin-insect-repellent-spray",
      price: 10.95,
      category: "Outdoor",
    },
  },
  {
    itemKeywords: ["lip balm"],
    product: {
      name: "Sun Bum SPF 30 Lip Balm",
      partner: "Amazon",
      url: "https://www.amazon.com/dp/B00ED23TN8",
      price: 5.49,
      category: "Toiletries",
    },
  },
  {
    itemKeywords: ["moisturizer", "lotion"],
    product: {
      name: "CeraVe Daily Moisturizing Lotion Travel",
      partner: "Amazon",
      url: "https://www.amazon.com/dp/B000YJ2SLG",
      price: 11.99,
      category: "Toiletries",
    },
  },

  // Bags & Organization
  {
    itemKeywords: ["packing cubes", "packing cube"],
    product: {
      name: "Peak Design Packing Cubes",
      partner: "REI",
      url: "https://www.rei.com/product/190543/peak-design-packing-cube-medium",
      price: 39.95,
      category: "Organization",
    },
  },
  {
    itemKeywords: ["day backpack", "daypack", "day pack"],
    product: {
      name: "Osprey Daylite Plus Pack",
      partner: "REI",
      url: "https://www.rei.com/product/168485/osprey-daylite-plus-pack",
      price: 65.0,
      category: "Organization",
    },
  },
  {
    itemKeywords: ["backpack"],
    product: {
      name: "Osprey Farpoint 40 Travel Pack",
      partner: "REI",
      url: "https://www.rei.com/product/168569/osprey-farpoint-40-travel-pack",
      price: 185.0,
      category: "Organization",
    },
  },
  {
    itemKeywords: ["beach bag", "tote bag"],
    product: {
      name: "L.L.Bean Boat and Tote Bag",
      partner: "Amazon",
      url: "https://www.amazon.com/dp/B07RQ4Z7QW",
      price: 39.95,
      category: "Organization",
    },
  },
  {
    itemKeywords: ["crossbody bag", "sling bag"],
    product: {
      name: "Pacsafe Citysafe CX Anti-Theft Crossbody",
      partner: "REI",
      url: "https://www.rei.com/product/177405/pacsafe-citysafe-cx-anti-theft-crossbody-bag",
      price: 79.95,
      category: "Organization",
    },
  },
  {
    itemKeywords: ["dry bag"],
    product: {
      name: "Sea to Summit Lightweight Dry Bag 20L",
      partner: "REI",
      url: "https://www.rei.com/product/866374/sea-to-summit-lightweight-dry-sack",
      price: 24.95,
      category: "Organization",
    },
  },
  {
    itemKeywords: ["toiletries bag", "dopp kit", "toiletry bag"],
    product: {
      name: "Gravel Explorer PLUS Toiletry Bag",
      partner: "Amazon",
      url: "https://www.amazon.com/dp/B07QSGH6WL",
      price: 49.0,
      category: "Organization",
    },
  },

  // Accessories
  {
    itemKeywords: ["water bottle", "reusable water bottle"],
    product: {
      name: "Hydro Flask 32 oz Wide Mouth",
      partner: "REI",
      url: "https://www.rei.com/product/115371/hydro-flask-wide-mouth-vacuum-water-bottle-32-fl-oz",
      price: 44.95,
      category: "Accessories",
    },
  },
  {
    itemKeywords: ["sunglasses"],
    product: {
      name: "Goodr Running Sunglasses",
      partner: "REI",
      url: "https://www.rei.com/product/141692/goodr-og-running-sunglasses",
      price: 25.0,
      category: "Accessories",
    },
  },
  {
    itemKeywords: ["sun hat", "wide brim hat"],
    product: {
      name: "Sunday Afternoons Ultra Adventure Hat",
      partner: "REI",
      url: "https://www.rei.com/product/884800/sunday-afternoons-ultra-adventure-hat",
      price: 44.0,
      category: "Accessories",
    },
  },
  {
    itemKeywords: ["travel pillow", "neck pillow"],
    product: {
      name: "Trtl Pillow Plus",
      partner: "Amazon",
      url: "https://www.amazon.com/dp/B07K6PKFHB",
      price: 59.99,
      category: "Comfort",
    },
  },
  {
    itemKeywords: ["first aid kit"],
    product: {
      name: "Adventure Medical Kits Ultralight/Watertight",
      partner: "REI",
      url: "https://www.rei.com/product/707610/adventure-medical-kits-ultralightwatertight-7-first-aid-kit",
      price: 19.95,
      category: "Safety",
    },
  },
  {
    itemKeywords: ["multi-tool", "multitool"],
    product: {
      name: "Leatherman FREE P4 Multi-Tool",
      partner: "REI",
      url: "https://www.rei.com/product/156498/leatherman-free-p4-multi-tool",
      price: 149.95,
      category: "Outdoor",
    },
  },
  {
    itemKeywords: ["hand warmers", "hand warmer"],
    product: {
      name: "HotHands Hand Warmers 10-Pack",
      partner: "Amazon",
      url: "https://www.amazon.com/dp/B0007ZF4OA",
      price: 9.04,
      category: "Cold Weather",
    },
  },

  // Footwear
  {
    itemKeywords: ["hiking boots", "hiking shoes"],
    product: {
      name: "Salomon X Ultra 4 GTX Hiking Shoes",
      partner: "REI",
      url: "https://www.rei.com/product/185790/salomon-x-ultra-4-gtx-hiking-shoes-mens",
      price: 165.0,
      category: "Footwear",
    },
  },
  {
    itemKeywords: ["walking shoes", "comfort shoes", "sneakers"],
    product: {
      name: "Allbirds Tree Runners",
      partner: "Amazon",
      url: "https://www.amazon.com/dp/B09T3X8CDG",
      price: 98.0,
      category: "Footwear",
    },
  },
  {
    itemKeywords: ["flip flops", "sandals"],
    product: {
      name: "Rainbow Sandals Premier Leather",
      partner: "Amazon",
      url: "https://www.amazon.com/dp/B000H53OKS",
      price: 54.95,
      category: "Footwear",
    },
  },
  {
    itemKeywords: ["winter boots", "waterproof boots", "snow boots"],
    product: {
      name: "Sorel Caribou Waterproof Boots",
      partner: "REI",
      url: "https://www.rei.com/product/783464/sorel-caribou-waterproof-boots-mens",
      price: 175.0,
      category: "Footwear",
    },
  },

  // Clothing
  {
    itemKeywords: ["rain jacket", "raincoat"],
    product: {
      name: "Patagonia Torrentshell 3L Jacket",
      partner: "REI",
      url: "https://www.rei.com/product/178075/patagonia-torrentshell-3l-jacket-mens",
      price: 159.0,
      category: "Outerwear",
    },
  },
  {
    itemKeywords: ["winter coat", "heavy coat", "down jacket"],
    product: {
      name: "North Face ThermoBall Eco Jacket",
      partner: "REI",
      url: "https://www.rei.com/product/166403/the-north-face-thermoball-eco-jacket-2-0-mens",
      price: 230.0,
      category: "Outerwear",
    },
  },
  {
    itemKeywords: ["thermal underwear", "thermal layers", "base layer"],
    product: {
      name: "Smartwool Merino 250 Base Layer",
      partner: "REI",
      url: "https://www.rei.com/product/127756/smartwool-merino-250-base-layer-crew-top-mens",
      price: 100.0,
      category: "Clothing",
    },
  },
]

/**
 * Find a product match for a packing list item name.
 * Uses keyword matching — returns the first match found.
 */
export function findProductMatch(itemName: string): ProductMatch["product"] | null {
  const normalized = itemName.toLowerCase().trim()

  for (const entry of PRODUCT_CATALOG) {
    for (const keyword of entry.itemKeywords) {
      if (normalized.includes(keyword) || keyword.includes(normalized)) {
        return entry.product
      }
    }
  }

  return null
}

/**
 * Find product matches for multiple packing list items at once.
 */
export function findProductMatches(
  itemNames: string[]
): Map<string, ProductMatch["product"]> {
  const matches = new Map<string, ProductMatch["product"]>()

  for (const name of itemNames) {
    const match = findProductMatch(name)
    if (match) {
      matches.set(name, match)
    }
  }

  return matches
}

/**
 * Build an affiliate-tracked product URL.
 * Wraps a raw product URL through the /api/affiliate/track endpoint.
 */
export function buildAffiliateProductUrl(
  productUrl: string,
  affiliateCode: string,
  appUrl?: string
): string {
  const base = appUrl || process.env.NEXT_PUBLIC_APP_URL || "https://tinerary.app"
  return `${base}/api/affiliate/track?code=${encodeURIComponent(affiliateCode)}&url=${encodeURIComponent(productUrl)}`
}
