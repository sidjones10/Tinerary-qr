import { redirect } from "next/navigation"

// /browse is the public brand URL. It is NOT a separate browser — it routes
// to the existing Explore/Discover feed in guest mode so logged-out visitors
// can read itineraries without an account (the "read about the film without
// buying a ticket" model).
export default function BrowsePage() {
  redirect("/discover?guest=true")
}
