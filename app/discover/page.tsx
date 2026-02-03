"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function DiscoverRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the main page which has the discovery feed
    router.replace("/")
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}
