"use client"

import { useState } from "react"
import { Bell, Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function NotificationsHeader() {
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h1 className="text-2xl font-bold">Notifications</h1>
        </div>

        <div className="flex items-center gap-2">
          {showSearch ? (
            <div className="relative">
              <Input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[250px] pr-8"
                autoFocus
              />
              <button
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setSearchQuery("")
                  setShowSearch(false)
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Button variant="outline" size="icon" onClick={() => setShowSearch(true)}>
              <Search className="h-4 w-4" />
            </Button>
          )}

          <Button variant="outline" size="sm">
            Mark all as read
          </Button>
        </div>
      </div>

      <p className="text-muted-foreground">Stay updated with your itinerary RSVPs, bookings, and special deals.</p>
    </div>
  )
}
