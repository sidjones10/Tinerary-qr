"use client"

import { useEffect, useRef } from "react"
import { MapPin } from "lucide-react"

interface EventMapProps {
  location: string
  title: string
  className?: string
}

export function EventMap({ location, title, className = "" }: EventMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    // Dynamically import leaflet only on client side
    const initMap = async () => {
      if (typeof window === "undefined" || !mapRef.current) return

      try {
        const L = (await import("leaflet")).default
        await import("leaflet/dist/leaflet.css")

        // Fix for default markers not showing
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        })

        // Geocode the location to get coordinates
        const coords = await geocodeLocation(location)

        if (!coords) {
          console.error("Could not geocode location:", location)
          return
        }

        // Initialize map if not already done
        if (!mapInstanceRef.current && mapRef.current) {
          const map = L.map(mapRef.current).setView([coords.lat, coords.lon], 13)

          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
          }).addTo(map)

          L.marker([coords.lat, coords.lon])
            .addTo(map)
            .bindPopup(`<b>${title}</b><br>${location}`)
            .openPopup()

          mapInstanceRef.current = map
        }
      } catch (error) {
        console.error("Error initializing map:", error)
      }
    }

    initMap()

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [location, title])

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="w-full h-full rounded-lg overflow-hidden border border-gray-200 dark:border-border" />
    </div>
  )
}

// Simple geocoding function using Nominatim (OpenStreetMap)
async function geocodeLocation(location: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`
    )

    if (!response.ok) {
      throw new Error("Geocoding request failed")
    }

    const data = await response.json()

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
      }
    }

    return null
  } catch (error) {
    console.error("Geocoding error:", error)
    return null
  }
}

// Simplified static map preview (for cases where interactive map is not needed)
export function StaticMapPreview({ location, className = "" }: { location: string; className?: string }) {
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=-0.1,51.5,-0.09,51.51&layer=mapnik`

  return (
    <div className={`relative bg-gray-100 dark:bg-card rounded-lg overflow-hidden border border-gray-200 dark:border-border ${className}`}>
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-100 to-pink-100">
        <div className="text-center">
          <MapPin className="h-12 w-12 mx-auto mb-2 text-orange-500" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{location}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Click to view map</p>
        </div>
      </div>
    </div>
  )
}
