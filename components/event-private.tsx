"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Lock } from "lucide-react"

export function EventPrivate() {
  const router = useRouter()

  return (
    <div className="container px-4 py-8">
      <div className="max-w-3xl mx-auto text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="h-8 w-8 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold mb-4">Private Event</h1>
        <p className="text-muted-foreground mb-6">This event is private and only visible to invited guests.</p>
        <div className="flex justify-center space-x-4">
          <Button onClick={() => router.push("/auth")} className="btn-sunset">
            Sign In
          </Button>
          <Button onClick={() => router.push("/app")} variant="outline">
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  )
}
