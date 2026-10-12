"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, RotateCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { logError } from "@/lib/error-logger"

/**
 * Route-level error boundary.
 *
 * Catches a render or data error in any page and shows the Tinerary shell
 * instead of Next's default error screen.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logError({
      type: "client",
      message: error.message,
      stack: error.stack,
      component: "route-error-boundary",
      metadata: { digest: error.digest },
    }).catch(() => {
      // Never let the logger's own failure replace the error screen.
    })
  }, [error])

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950">
        <AlertTriangle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
      </div>

      <h1 className="mt-6 text-2xl font-semibold tracking-tight">
        Something went sideways
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        This page hit an error on our end. Your trips are safe — try again, and
        if it keeps happening let us know.
      </p>

      {error.digest && (
        <p className="mt-3 font-mono text-xs text-muted-foreground">
          Reference: {error.digest}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>
          <RotateCw className="mr-2 h-4 w-4" />
          Try again
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Back home
          </Link>
        </Button>
      </div>
    </div>
  )
}
