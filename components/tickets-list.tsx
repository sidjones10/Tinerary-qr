"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Ticket } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { TicketQRCard } from "./ticket-qr-card"
import { createClient } from "@/lib/supabase/client"

interface TicketsListProps {
  upcoming?: boolean
  limit?: number
}

interface BookingData {
  id: string
  user_id: string
  promotion_id: string
  quantity: number
  total_price: number
  currency: string | null
  attendee_names: string | null
  attendee_emails: string | null
  status: string
  created_at: string
  promotion: {
    id: string
    title: string
    description: string | null
    location: string
    start_date: string
    end_date: string
    image: string | null
    business_id: string
    businesses?: {
      name: string
    } | null
  } | null
}

export function TicketsList({ upcoming = true, limit = 20 }: TicketsListProps) {
  const router = useRouter()
  const [bookings, setBookings] = useState<BookingData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBookings() {
      try {
        setLoading(true)

        const supabase = createClient()

        // Get user session
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) {
          router.push("/login?redirect=/tickets")
          return
        }

        const userId = session.user.id
        const now = new Date().toISOString()

        let query = supabase
          .from("bookings")
          .select(`
            *,
            promotion:promotion_id(
              id, title, description, location, start_date, end_date, image, business_id,
              businesses(name)
            )
          `)
          .eq("user_id", userId)
          .neq("status", "cancelled")
          .order("created_at", { ascending: false })
          .limit(limit)

        const { data, error: fetchError } = await query

        if (fetchError) {
          setError("Failed to load tickets")
          console.error(fetchError)
          return
        }

        // Filter bookings based on upcoming/past using promotion end_date
        const filteredBookings =
          data?.filter((booking: BookingData) => {
            const endDate = booking.promotion?.end_date
            if (!endDate) return upcoming // show bookings without dates in upcoming

            if (upcoming) {
              return new Date(endDate) >= new Date(now)
            } else {
              return new Date(endDate) < new Date(now)
            }
          }) || []

        setBookings(filteredBookings)
      } catch (err) {
        setError("An error occurred while loading tickets")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [upcoming, limit, router])

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(2)].map((_, i) => (
          <Skeleton key={i} className="h-64 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    )
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-10">
        <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No {upcoming ? "upcoming" : "past"} tickets</h3>
        <p className="text-muted-foreground">
          {upcoming
            ? "When you book events, your tickets will appear here."
            : "Your past event tickets will be shown here for reference."}
        </p>
        {upcoming && (
          <Button variant="default" className="mt-4" onClick={() => router.push("/explore")}>
            Explore Events
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {bookings.map((booking) => {
        const promotion = booking.promotion
        if (!promotion) return null

        return (
          <TicketQRCard
            key={booking.id}
            ticketId={booking.id}
            title={promotion.title}
            date={promotion.start_date}
            location={promotion.location || "TBD"}
            quantity={booking.quantity}
            businessName={promotion.businesses?.name}
            totalAmount={booking.total_price}
            currency={booking.currency || "USD"}
          />
        )
      })}
    </div>
  )
}
