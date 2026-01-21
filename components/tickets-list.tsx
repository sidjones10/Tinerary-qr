"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Ticket } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { TicketQRCard } from "./ticket-qr-card"
import { createClient } from "@/lib/supabase-client"

interface TicketsListProps {
  upcoming?: boolean
  limit?: number
}

interface TicketData {
  id: string
  user_id: string
  booking_id: string
  qr_code: string
  status: string
  created_at: string
  booking: {
    id: string
    promotion_id: string
    booking_date: string
    status: string
    promotion: {
      id: string
      title: string
      description: string | null
      location: string
      start_date: string
      end_date: string
      image: string | null
      [key: string]: unknown
    } | null
    [key: string]: unknown
  } | null
  [key: string]: unknown
}

export function TicketsList({ upcoming = true, limit = 20 }: TicketsListProps) {
  const router = useRouter()
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTickets() {
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
        const today = new Date().toISOString()

        const { data, error: fetchError } = await supabase
          .from("tickets")
          .select(`
            *,
            booking:booking_id(
              *,
              promotion:promotion_id(*)
            )
          `)
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(limit)

        if (fetchError) {
          setError("Failed to load tickets")
          console.error(fetchError)
          return
        }

        // Filter tickets based on date
        const filteredTickets =
          data?.filter((ticket) => {
            const bookingDate = ticket.booking?.date
            if (!bookingDate) return false

            if (upcoming) {
              return new Date(bookingDate) >= new Date(today)
            } else {
              return new Date(bookingDate) < new Date(today)
            }
          }) || []

        setTickets(filteredTickets)
      } catch (err) {
        setError("An error occurred while loading tickets")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchTickets()
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

  if (tickets.length === 0) {
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
      {tickets.map((ticket) => {
        const promotion = ticket.booking?.promotion
        if (!promotion) return null

        return (
          <TicketQRCard
            key={ticket.id}
            ticketId={ticket.ticket_number}
            qrCodeUrl={ticket.qr_code_url}
            title={promotion.title}
            date={ticket.booking.date}
            location={promotion.location || "TBD"}
            quantity={1}
            businessName={promotion.business_name}
            totalAmount={ticket.booking.total_amount / ticket.booking.quantity}
            currency={ticket.booking.currency || "USD"}
          />
        )
      })}
    </div>
  )
}
