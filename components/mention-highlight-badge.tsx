"use client"

import { useEffect, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Sparkles, ExternalLink, Tag } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface MentionHighlightBadgeProps {
  highlight: {
    id: string
    booking_url: string | null
    offer_text: string | null
    badge_style: string
    business_mentions: {
      matched_text: string
      businesses: {
        name: string
        logo: string | null
      }
    }
  }
}

export function MentionHighlightBadge({ highlight }: MentionHighlightBadgeProps) {
  const business = highlight.business_mentions?.businesses
  const viewTracked = useRef(false)

  // Track view once on mount
  useEffect(() => {
    if (viewTracked.current) return
    viewTracked.current = true
    const timer = setTimeout(() => {
      const supabase = createClient()
      supabase.rpc("increment_highlight_view", { highlight_uuid: highlight.id }).then(() => {}, () => {})
    }, 500)
    return () => clearTimeout(timer)
  }, [highlight.id])

  if (!business) return null

  const handleBookingClick = () => {
    const supabase = createClient()
    supabase.rpc("increment_highlight_click", { highlight_uuid: highlight.id }).then(() => {}, () => {})

    if (highlight.booking_url) {
      window.open(highlight.booking_url, "_blank", "noopener,noreferrer")
    }
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {/* Verified business badge */}
      <Badge className="bg-tinerary-gold/20 text-tinerary-dark border-0 gap-1 text-xs font-medium">
        {business.logo ? (
          <img src={business.logo} alt="" className="size-3 rounded-full object-cover" />
        ) : (
          <Sparkles className="size-3" />
        )}
        {business.name}
      </Badge>

      {/* Booking link */}
      {highlight.booking_url && (
        <button
          onClick={handleBookingClick}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          <ExternalLink className="size-3" />
          Book Now
        </button>
      )}

      {/* Special offer */}
      {highlight.offer_text && (
        <Badge variant="outline" className="gap-1 text-xs border-tinerary-salmon/30 text-tinerary-salmon">
          <Tag className="size-3" />
          {highlight.offer_text}
        </Badge>
      )}
    </div>
  )
}
