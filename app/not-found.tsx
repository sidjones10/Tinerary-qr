import Link from "next/link"
import type { Metadata } from "next"
import { Compass, Home, Search } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Not found",
  description: "This page doesn't exist — or the trip behind it is private.",
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950">
        <Compass className="h-8 w-8 text-amber-600 dark:text-amber-400" />
      </div>

      <h1 className="mt-6 text-2xl font-semibold tracking-tight">
        This one&rsquo;s off the map
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        The page you&rsquo;re looking for doesn&rsquo;t exist. If someone sent
        you a trip link, it may have been made private or deleted.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Back home
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/discover">
            <Search className="mr-2 h-4 w-4" />
            Discover trips
          </Link>
        </Button>
      </div>
    </div>
  )
}
