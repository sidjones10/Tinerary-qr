import { Suspense } from "react"
import { PackingList } from "@/components/packing-list"
import { getPackingItems } from "@/app/actions/packing-items"
import { getTripById } from "@/app/actions/trips"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function PackingPage({ params }: { params: { id: string } }) {
  const tripId = params.id

  // Fetch trip data
  const trip = await getTripById(tripId)
  if (!trip) {
    notFound()
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
