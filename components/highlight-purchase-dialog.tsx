"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Sparkles, Check, Link2, Tag } from "lucide-react"
import { MENTION_HIGHLIGHTS } from "@/lib/tiers"
import { purchaseHighlightPlan, highlightMention } from "@/app/actions/mention-actions"

interface HighlightPurchaseDialogProps {
  mentionId: string
  itineraryTitle: string
  hasActivePlan: boolean
  remainingHighlights: number
  onHighlighted?: () => void
  trigger?: React.ReactNode
}

const PLAN_MAP: Record<string, string> = {
  "Single Mention": "single",
  "Bundle (5 mentions)": "bundle",
  "Monthly Unlimited": "monthly_unlimited",
  "Annual Unlimited": "annual_unlimited",
}

export function HighlightPurchaseDialog({
  mentionId,
  itineraryTitle,
  hasActivePlan,
  remainingHighlights,
  onHighlighted,
  trigger,
}: HighlightPurchaseDialogProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<"plan" | "details">(hasActivePlan ? "details" : "plan")
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [bookingUrl, setBookingUrl] = useState("")
  const [offerText, setOfferText] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handlePurchasePlan = async (planType: string) => {
    setLoading(true)
    try {
      const result = await purchaseHighlightPlan(planType)
      if (result.success) {
        toast({ title: "Plan purchased!", description: "You can now highlight mentions." })
        setStep("details")
      } else {
        toast({ title: "Error", description: result.error || "Failed to purchase plan", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleHighlight = async () => {
    setLoading(true)
    try {
      const result = await highlightMention(mentionId, {
        bookingUrl: bookingUrl || undefined,
        offerText: offerText || undefined,
      })
      if (result.success) {
        toast({ title: "Mention highlighted!", description: `Your badge and link now appear on "${itineraryTitle}"` })
        setOpen(false)
        onHighlighted?.()
      } else {
        if (result.error?.includes("No active plan")) {
          setStep("plan")
        } else {
          toast({ title: "Error", description: result.error || "Failed to highlight", variant: "destructive" })
        }
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setStep(hasActivePlan ? "details" : "plan"); setSelectedPlan(null) } }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="shrink-0">
            <Sparkles className="size-3.5 mr-1.5" />
            Highlight
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        {step === "plan" ? (
          <>
            <DialogHeader>
              <DialogTitle>Choose a Highlight Plan</DialogTitle>
              <DialogDescription>
                Purchase a plan to add your badge and booking link to itineraries that mention your business.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {MENTION_HIGHLIGHTS.map((plan) => {
                const planKey = PLAN_MAP[plan.name]
                const isSelected = selectedPlan === planKey
                return (
                  <button
                    key={plan.name}
                    onClick={() => setSelectedPlan(planKey)}
                    className={`flex flex-col items-center p-4 rounded-xl text-center border transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <p className="text-xl font-bold text-primary">${plan.price}</p>
                    <p className="text-xs font-semibold text-foreground mt-1">{plan.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{plan.duration}</p>
                    <div className="w-full h-px bg-border my-2" />
                    <p className="text-xs text-muted-foreground leading-relaxed">{plan.includes}</p>
                    {isSelected && <Check className="size-4 text-primary mt-2" />}
                  </button>
                )
              })}
            </div>
            <Button
              className="w-full mt-2"
              disabled={!selectedPlan || loading}
              onClick={() => selectedPlan && handlePurchasePlan(selectedPlan)}
            >
              {loading ? "Processing..." : "Purchase Plan"}
            </Button>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Highlight This Mention</DialogTitle>
              <DialogDescription>
                Add your booking link and an optional offer to this mention on &ldquo;{itineraryTitle}&rdquo;.
                {remainingHighlights > 0 && remainingHighlights !== -1 && (
                  <Badge variant="secondary" className="ml-2 text-xs">{remainingHighlights} highlights remaining</Badge>
                )}
                {remainingHighlights === -1 && (
                  <Badge variant="secondary" className="ml-2 text-xs">Unlimited plan</Badge>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label htmlFor="booking-url" className="text-sm font-medium flex items-center gap-1.5">
                  <Link2 className="size-3.5" /> Booking / Website URL
                </Label>
                <Input
                  id="booking-url"
                  placeholder="https://yourbusiness.com/book"
                  value={bookingUrl}
                  onChange={(e) => setBookingUrl(e.target.value)}
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Shown as a &ldquo;Book Now&rdquo; button on the itinerary. Leave blank to use your business website.
                </p>
              </div>
              <div>
                <Label htmlFor="offer-text" className="text-sm font-medium flex items-center gap-1.5">
                  <Tag className="size-3.5" /> Special Offer (optional)
                </Label>
                <Input
                  id="offer-text"
                  placeholder="10% off with code TINERARY"
                  value={offerText}
                  onChange={(e) => setOfferText(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              {!hasActivePlan && (
                <Button variant="outline" onClick={() => setStep("plan")} className="flex-1">
                  Change Plan
                </Button>
              )}
              <Button className="flex-1" disabled={loading} onClick={handleHighlight}>
                {loading ? "Activating..." : "Activate Highlight"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
