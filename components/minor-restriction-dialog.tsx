"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Lock, CreditCard, MapPin } from "lucide-react"

type RestrictionType = "payment" | "location"

interface MinorRestrictionDialogProps {
  isOpen: boolean
  onClose: () => void
  restrictionType: RestrictionType
}

const restrictionContent: Record<RestrictionType, { icon: React.ReactNode; title: string; description: string }> = {
  payment: {
    icon: <CreditCard className="h-6 w-6 text-amber-600" />,
    title: "Payments Restricted",
    description:
      "As a minor account holder, you need parental consent to make purchases, process payments, or manage bookings. Please ask your parent or guardian to update your consent settings.",
  },
  location: {
    icon: <MapPin className="h-6 w-6 text-amber-600" />,
    title: "Location Tracking Restricted",
    description:
      "As a minor account holder, you need parental consent to enable location tracking features. Please ask your parent or guardian to update your consent settings.",
  },
}

export function MinorRestrictionDialog({
  isOpen,
  onClose,
  restrictionType,
}: MinorRestrictionDialogProps) {
  const content = restrictionContent[restrictionType]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
            {content.icon}
          </div>
          <DialogTitle className="text-center">{content.title}</DialogTitle>
          <DialogDescription className="text-center">
            {content.description}
          </DialogDescription>
        </DialogHeader>
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
          <div className="flex items-start gap-2">
            <Lock className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              Tinerary requires parental consent for certain features for users under 18 to comply with
              privacy laws and ensure your safety.
            </p>
          </div>
        </div>
        <DialogFooter className="sm:justify-center">
          <Button onClick={onClose} className="w-full sm:w-auto">
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Helper hook for showing minor restrictions
import { useState } from "react"
import { useConsent } from "@/providers/consent-provider"

export function useMinorRestriction() {
  const { accountType, canUsePayments, canUseLocationTracking } = useConsent()
  const [showDialog, setShowDialog] = useState(false)
  const [restrictionType, setRestrictionType] = useState<RestrictionType>("payment")

  const checkPaymentAccess = (): boolean => {
    if (!canUsePayments && accountType === "minor") {
      setRestrictionType("payment")
      setShowDialog(true)
      return false
    }
    return true
  }

  const checkLocationAccess = (): boolean => {
    if (!canUseLocationTracking && accountType === "minor") {
      setRestrictionType("location")
      setShowDialog(true)
      return false
    }
    return true
  }

  return {
    isMinor: accountType === "minor",
    canUsePayments,
    canUseLocationTracking,
    checkPaymentAccess,
    checkLocationAccess,
    showDialog,
    restrictionType,
    closeDialog: () => setShowDialog(false),
  }
}
