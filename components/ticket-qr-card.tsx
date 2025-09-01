"use client"

import { useState } from "react"
import Image from "next/image"
import { Calendar, Clock, MapPin, Share2, Download } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface TicketQRCardProps {
  ticketId: string
  qrCodeUrl: string
  title: string
  date: string
  time?: string
  location: string
  quantity: number
  businessName?: string
  totalAmount: number
  currency: string
}

export function TicketQRCard({
  ticketId,
  qrCodeUrl,
  title,
  date,
  time,
  location,
  quantity,
  businessName,
  totalAmount,
  currency,
}: TicketQRCardProps) {
  const [showShareOptions, setShowShareOptions] = useState(false)

  // Format date
  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Format currency
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(totalAmount)

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Ticket for ${title}`,
          text: `My ticket for ${title} on ${formattedDate}`,
          url: window.location.href,
        })
      } catch (error) {
        console.error("Error sharing:", error)
        setShowShareOptions(true)
      }
    } else {
      setShowShareOptions(true)
    }
  }

  const handleDownload = () => {
    // Create a temporary link
    const link = document.createElement("a")
    link.href = qrCodeUrl
    link.download = `ticket-${ticketId}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      <div className="bg-gradient-to-r from-violet-500 via-pink-500 to-orange-400 p-4 text-white">
        <h3 className="text-xl font-bold">{title}</h3>
        {businessName && <p className="text-sm opacity-90">Provided by {businessName}</p>}
      </div>

      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                {formattedDate}
              </div>

              {time && (
                <div className="flex items-center text-sm">
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  {time}
                </div>
              )}

              <div className="flex items-center text-sm">
                <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                {location}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Quantity</span>
                <span className="font-medium">
                  {quantity} ticket{quantity !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="font-medium">{formattedAmount}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Ticket ID</span>
                <span className="font-medium text-xs">{ticketId}</span>
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>

          <div className="bg-gray-50 p-6 flex flex-col items-center justify-center">
            <p className="text-sm font-medium text-center mb-2">Scan at the venue</p>
            <div className="bg-white p-2 rounded-lg shadow-sm">
              <Image
                src={qrCodeUrl || "/placeholder.svg"}
                alt="Ticket QR Code"
                width={180}
                height={180}
                className="rounded"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Valid for entry on event date</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
