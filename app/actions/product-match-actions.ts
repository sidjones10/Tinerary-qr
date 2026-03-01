"use server"

import { findProductMatch, buildAffiliateProductUrl } from "@/lib/product-catalog"

export interface ProductSuggestion {
  name: string
  partner: string
  url: string
  affiliateUrl: string
  price: number
  category: string
}

/**
 * Get product suggestions for a list of packing item names.
 * Returns a map of item name -> product suggestion.
 */
export async function getProductSuggestions(
  itemNames: string[],
  affiliateCode?: string
): Promise<Record<string, ProductSuggestion>> {
  const suggestions: Record<string, ProductSuggestion> = {}

  for (const name of itemNames) {
    const match = findProductMatch(name)
    if (match) {
      const code = affiliateCode || "tinerary-default"
      suggestions[name] = {
        name: match.name,
        partner: match.partner,
        url: match.url,
        affiliateUrl: buildAffiliateProductUrl(match.url, code),
        price: match.price,
        category: match.category,
      }
    }
  }

  return suggestions
}
