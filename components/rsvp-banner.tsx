"use client"

import { useState } from "react"
import { Check, HelpCircle, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

type RsvpStatus = "pending" | "accepted" | "declined" | "tentative"

interface RsvpBannerProps {
  invitationId: string
  currentStatus: RsvpStatus
  eventTitle: string
  hostName?: string
  onStatusChange?: (newStatus: RsvpStatus) => void
}

const STATUS_CONFIG = {
  accepted: {
    label: "Going",
    shortLabel: "Going",
    icon: Check,
    bg: "bg-emerald-500",
    activeBg: "bg-emerald-600",
    ring: "ring-emerald-300",
    text: "text-white",
    bannerBg: "bg-emerald-50 dark:bg-emerald-950/30",
    bannerBorder: "border-emerald-200 dark:border-emerald-800",
    bannerText: "text-emerald-800 dark:text-emerald-200",
  },
  tentative: {
    label: "Maybe",
    shortLabel: "Maybe",
    icon: HelpCircle,
    bg: "bg-amber-500",
    activeBg: "bg-amber-600",
    ring: "ring-amber-300",
    text: "text-white",
    bannerBg: "bg-amber-50 dark:bg-amber-950/30",
    bannerBorder: "border-amber-200 dark:border-amber-800",
    bannerText: "text-amber-800 dark:text-amber-200",
  },
  declined: {
    label: "Can't Go",
    shortLabel: "Can't Go",
    icon: X,
    bg: "bg-red-500",
    activeBg: "bg-red-600",
    ring: "ring-red-300",
    text: "text-white",
    bannerBg: "bg-red-50 dark:bg-red-950/30",
    bannerBorder: "border-red-200 dark:border-red-800",
    bannerText: "text-red-800 dark:text-red-200",
  },
  pending: {
    label: "Pending",
    shortLabel: "Respond",
    icon: HelpCircle,
    bg: "bg-gray-400",
    activeBg: "bg-gray-500",
    ring: "ring-gray-300",
    text: "text-white",
    bannerBg: "bg-orange-50 dark:bg-orange-950/30",
    bannerBorder: "border-orange-200 dark:border-orange-800",
    bannerText: "text-orange-800 dark:text-orange-200",
  },
} as const

export function RsvpBanner({
  invitationId,
  currentStatus,
  eventTitle,
  hostName,
  onStatusChange,
}: RsvpBannerProps) {
  const [status, setStatus] = useState<RsvpStatus>(currentStatus)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleRsvp = async (response: "accept" | "decline" | "tentative") => {
    const statusMap: Record<string, RsvpStatus> = {
      accept: "accepted",
      decline: "declined",
      tentative: "tentative",
    }
    const newStatus = statusMap[response]

    if (newStatus === status) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/invitations/${invitationId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update RSVP")
      }

      setStatus(newStatus)
      onStatusChange?.(newStatus)

      const labels: Record<string, string> = {
        accepted: "You're going!",
        tentative: "Marked as maybe",
        declined: "You've declined",
      }

      toast({
        title: labels[newStatus] || "RSVP updated",
        description: `Your response for "${eventTitle}" has been saved.`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update RSVP",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const config = STATUS_CONFIG[status]
  const isPending = status === "pending"

  return (
    <div
      className={cn(
        "rounded-xl border-2 p-4 mb-6 transition-all duration-300",
        config.bannerBg,
        config.bannerBorder
      )}
    >
      {/* Header text */}
      <div className="mb-3 text-center">
        {isPending ? (
          <>
            <p className={cn("text-sm font-semibold", config.bannerText)}>
              {hostName ? `${hostName} invited you` : "You're invited!"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Are you going to this event?
            </p>
          </>
        ) : (
          <p className={cn("text-sm font-semibold", config.bannerText)}>
            {status === "accepted" && "You're going!"}
            {status === "tentative" && "You might be going"}
            {status === "declined" && "You've declined this event"}
          </p>
        )}
      </div>

      {/* RSVP buttons — Partiful-style pill row */}
      <div className="flex gap-2 justify-center">
        <RsvpPill
          label="Going"
          icon={Check}
          isActive={status === "accepted"}
          activeColor="bg-emerald-500 hover:bg-emerald-600"
          onClick={() => handleRsvp("accept")}
          disabled={isSubmitting}
        />
        <RsvpPill
          label="Maybe"
          icon={HelpCircle}
          isActive={status === "tentative"}
          activeColor="bg-amber-500 hover:bg-amber-600"
          onClick={() => handleRsvp("tentative")}
          disabled={isSubmitting}
        />
        <RsvpPill
          label="Can't Go"
          icon={X}
          isActive={status === "declined"}
          activeColor="bg-red-500 hover:bg-red-600"
          onClick={() => handleRsvp("decline")}
          disabled={isSubmitting}
        />
      </div>

      {isSubmitting && (
        <div className="flex justify-center mt-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  )
}

function RsvpPill({
  label,
  icon: Icon,
  isActive,
  activeColor,
  onClick,
  disabled,
}: {
  label: string
  icon: React.ComponentType<{ className?: string }>
  isActive: boolean
  activeColor: string
  onClick: () => void
  disabled: boolean
}) {
  return (
    <Button
      variant={isActive ? "default" : "outline"}
      size="sm"
      className={cn(
        "rounded-full px-4 py-2 gap-1.5 transition-all duration-200 font-medium",
        isActive
          ? cn(activeColor, "text-white shadow-md scale-105")
          : "hover:bg-muted/80"
      )}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Button>
  )
}
