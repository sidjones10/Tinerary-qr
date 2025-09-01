import { redirect } from "next/navigation"
import type { NextRequest } from "next/server"

export function GET(request: NextRequest, { params }: { params: { id: string } }) {
  // Redirect from /itinerary/[id] to /event/[id]
  return redirect(`/event/${params.id}`)
}
