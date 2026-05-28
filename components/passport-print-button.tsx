"use client"

import Link from "next/link"
import { Printer } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Navigates the user to the dedicated passport print route, which handles
 * template selection, day picking, layout (4-up or 1-up), crop marks, and
 * printing in one place.
 */
export function PassportPrintButton({ event }: { event: { id: string } }) {
  return (
    <Button
      asChild
      variant="outline"
      size="sm"
      className="bg-white/20 backdrop-blur-sm border-white/40 text-white hover:bg-white/30"
      aria-label="Print passport-sized itinerary"
    >
      <Link href={`/itinerary/${event.id}/print`}>
        <Printer className="h-4 w-4" />
        <span className="hidden sm:inline ml-2">Print</span>
      </Link>
    </Button>
  )
}
