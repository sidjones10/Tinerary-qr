import { Suspense } from "react"
import { PackingList } from "@/components/packing-list"
import { getPackingItems } from "@/app/actions/packing-items"
import { getTripById } from "@/app/actions/trips"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function PackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: tripId } = await params

  // Fetch trip data
  const trip = await getTripById(tripId)
  if (!trip) {
    notFound()
  }

  // Check access permissions
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Owner always has access
  const isOwner = user?.id === trip.user_id

  // Try RPC function, fall back to owner check if it fails
  let hasAccess = isOwner
  if (!isOwner) {
    const { data: rpcResult, error } = await supabase.rpc('can_access_private_content', {
      user_uuid: user?.id || null,
      itinerary_uuid: tripId,
      content_type: 'packing'
    })
    hasAccess = rpcResult ?? false
    if (error) console.warn('Packing access RPC error:', error)
  }

  // If user doesn't have access, show access denied page
  if (!hasAccess) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <div className="mb-6">
          <Link href={`/trip/${tripId}`}>
            <Button variant="ghost" className="flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" />
              Back to Trip
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mt-2">{trip.title}: Packing List</h1>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-amber-100 p-4 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-amber-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold mb-2">Packing List is Private</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              This packing list is only visible to the event owner and invited guests.
            </p>
            <Link href={`/trip/${tripId}`}>
              <Button>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Event
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fetch packing items
  const packingItems = await getPackingItems(tripId)

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <Link href={`/trip/${tripId}`}>
          <Button variant="ghost" className="flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" />
            Back to Trip
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mt-2">{trip.title}: Packing List</h1>
      </div>

      <Suspense fallback={<div>Loading packing list...</div>}>
        <PackingList simplified={false} items={packingItems} tripId={tripId} />
      </Suspense>
    </div>
  )
}
