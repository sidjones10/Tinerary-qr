"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Heart, Share2, Shield, Lock } from "lucide-react"
import { processBooking } from "@/app/actions/promotion-actions"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { DatePicker } from "@/components/date-picker"
import { useMinorRestriction, MinorRestrictionDialog } from "@/components/minor-restriction-dialog"
import { createClient } from "@/lib/supabase/client"
import { getTierLimits } from "@/lib/business-tier-service"
import type { BusinessTierSlug } from "@/lib/tiers"

interface PromotionBookingPanelProps {
  promotion: any
  userId?: string
}

export function PromotionBookingPanel({ promotion, userId }: PromotionBookingPanelProps) {
  const [liked, setLiked] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    promotion.features?.availableDates?.[0]?.date ? new Date(promotion.features.availableDates[0].date) : new Date(),
  )
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [isBooking, setIsBooking] = useState(false)
  const { toast } = useToast()
  const { isMinor, canUsePayments, checkPaymentAccess, showDialog, restrictionType, closeDialog } = useMinorRestriction()

  const handleBookNow = async () => {
    // Check for minor restrictions before proceeding with booking
    if (!checkPaymentAccess()) {
      return
    }
    if (!selectedDate) {
      toast({
        title: "Date required",
        description: "Please select a date for your booking",
        variant: "destructive",
      })
      return
    }

    if (!name || !email) {
      toast({
        title: "Contact information required",
        description: "Please provide your name and email",
        variant: "destructive",
      })
      return
    }

    setIsBooking(true)

    try {
      const formData = new FormData()
      formData.append("promotionId", promotion.id)
      formData.append("userId", userId || "guest")
      formData.append("quantity", quantity.toString())
      formData.append("date", selectedDate.toISOString())
      formData.append("name", name)
      formData.append("email", email)

      // Add affiliate ID if present in URL
      const urlParams = new URLSearchParams(window.location.search)
      const refCode = urlParams.get("ref")
      if (refCode) {
        formData.append("affiliateCode", refCode)
      }

      const result = await processBooking(formData)

      if (result.success) {
        toast({
          title: "Booking successful!",
          description: "Your booking has been confirmed. Check your email for details.",
          variant: "default",
        })

        // Redirect to tickets page
        window.location.href = "/tickets"
      } else {
        toast({
          title: "Booking failed",
          description: result.error || "There was an error processing your booking",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error processing booking:", error)
      toast({
        title: "Booking failed",
        description: "There was an error processing your booking",
        variant: "destructive",
      })
    } finally {
      setIsBooking(false)
    }
  }

  return (
    <Card className="sticky top-4">
      <CardContent className="p-6">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            {promotion.discount && promotion.original_price ? (
              <div>
                <span className="text-2xl font-bold">
                  {promotion.currency || "$"}
                  {promotion.price}
                </span>
                <span className="text-muted-foreground ml-1">per person</span>
                <div className="flex items-center mt-1">
                  <span className="line-through text-muted-foreground text-sm mr-2">
                    {promotion.currency || "$"}
                    {promotion.original_price}
                  </span>
                  <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                    {promotion.discount}% OFF
                  </Badge>
                </div>
              </div>
            ) : (
              <div>
                <span className="text-2xl font-bold">
                  {promotion.currency || "$"}
                  {promotion.price}
                </span>
                <span className="text-muted-foreground ml-1">per person</span>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={liked ? "text-red-500" : "text-muted-foreground"}
            onClick={() => setLiked(!liked)}
            aria-label={liked ? "Unlike" : "Like"}
          >
            <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
          </Button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <Label className="block text-sm font-medium mb-1">Select Date</Label>
            {promotion.features?.availableDates ? (
              <select className="w-full p-2 border rounded-md">
                {promotion.features.availableDates.map((date: { date: string; spots: number }, index: number) => (
                  <option key={index} value={date.date}>
                    {new Date(date.date).toLocaleDateString()} ({date.spots} spots left)
                  </option>
                ))}
              </select>
            ) : (
              <DatePicker date={selectedDate} setDate={setSelectedDate} />
            )}
          </div>

          <div>
            <Label className="block text-sm font-medium mb-1">Number of People</Label>
            <select
              className="w-full p-2 border rounded-md"
              value={quantity}
              onChange={(e) => setQuantity(Number.parseInt(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? "person" : "people"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="name" className="block text-sm font-medium mb-1">
              Your Name
            </Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
          </div>

          <div>
            <Label htmlFor="email" className="block text-sm font-medium mb-1">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
            />
          </div>
        </div>

        <Button
          className="w-full mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          onClick={handleBookNow}
          disabled={isBooking}
        >
          {isBooking ? "Processing..." : "Book Now"}
        </Button>

        <Button variant="outline" className="w-full flex items-center justify-center">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>

        <div className="mt-4 text-xs text-muted-foreground">
          <p className="mb-1">No payment required to book</p>
          <p>Free cancellation up to 24 hours before the experience</p>
        </div>

        {/* Minor restriction notice */}
        {isMinor && !canUsePayments && (
          <Alert className="mt-4 bg-amber-50 border-amber-200">
            <Shield className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 text-xs">
              Minor accounts require parental consent for bookings.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      {/* Minor restriction dialog */}
      <MinorRestrictionDialog
        isOpen={showDialog}
        onClose={closeDialog}
        restrictionType={restrictionType}
      />
    </Card>
  )
}
