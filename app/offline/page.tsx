import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { WifiOff } from "lucide-react"

export const metadata: Metadata = {
  title: "Offline · Tinerary",
  description: "You're offline. Reconnect to keep planning your trips.",
}

export default function OfflinePage() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-rose-600">
        <WifiOff className="h-10 w-10" aria-hidden="true" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">You're offline</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Tinerary needs an internet connection to load this page. Check your network and try again.
        </p>
      </div>
      <Button asChild>
        <Link href="/">Try again</Link>
      </Button>
    </main>
  )
}
