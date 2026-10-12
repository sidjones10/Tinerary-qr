import { permanentRedirect } from "next/navigation"
import type { NextRequest } from "next/server"

/**
 * /trip/[id] is a legacy share URL; /event/[id] is canonical.
 *
 * `params` is a Promise in Next 15+, so it must be awaited — reading `.id`
 * off the Promise silently produced `/event/undefined`.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  permanentRedirect(`/event/${id}`)
}
