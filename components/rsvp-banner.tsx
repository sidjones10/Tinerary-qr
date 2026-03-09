"use client"

import { useState, useEffect, useRef } from "react"
import { Check, HelpCircle, X, Loader2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { rsvpToEvent } from "@/app/actions/rsvp-actions"


type RsvpStatus = "pending" | "accepted" | "declined" | "tentative" | "expired"

interface RsvpBannerProps {
  /** Existing invitation ID (if user was explicitly invited) */
  invitationId?: string
  /** Itinerary ID (for link-based RSVP when no invitation exists yet) */
  itineraryId: string
  currentStatus: RsvpStatus
  eventTitle: string
  hostName?: string
  onStatusChange?: (newStatus: RsvpStatus, invitationId?: string) => void
}

const STATUS_CONFIG = {
  accepted: {
    bannerBg: "bg-emerald-50 dark:bg-emerald-950/30",
    bannerBorder: "border-emerald-200 dark:border-emerald-800",
    bannerText: "text-emerald-800 dark:text-emerald-200",
    label: "You're going!",
  },
  tentative: {
    bannerBg: "bg-amber-50 dark:bg-amber-950/30",
    bannerBorder: "border-amber-200 dark:border-amber-800",
    bannerText: "text-amber-800 dark:text-amber-200",
    label: "You might be going",
  },
  declined: {
    bannerBg: "bg-red-50 dark:bg-red-950/30",
    bannerBorder: "border-red-200 dark:border-red-800",
    bannerText: "text-red-800 dark:text-red-200",
    label: "You've declined this event",
  },
  pending: {
    bannerBg: "bg-orange-50 dark:bg-orange-950/30",
    bannerBorder: "border-orange-200 dark:border-orange-800",
    bannerText: "text-orange-800 dark:text-orange-200",
    label: "",
  },
  expired: {
    bannerBg: "bg-gray-50 dark:bg-gray-950/30",
    bannerBorder: "border-gray-300 dark:border-gray-700",
    bannerText: "text-gray-600 dark:text-gray-400",
    label: "Invitation expired",
  },
} as const

/** Error subclass that carries the HTTP status code from the API */
export class RsvpError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = "RsvpError"
    this.status = status
  }
}

const RESPONSE_TO_STATUS: Record<string, string> = {
  accept: "accepted",
  decline: "declined",
  tentative: "tentative",
}

/** Shared RSVP API call logic — used by both the banner and inline controls */
export async function submitRsvp(
  response: "accept" | "decline" | "tentative",
  opts: { invitationId?: string; itineraryId: string }
): Promise<{ invitationId?: string }> {
  // Always use the server action — it uses the admin client which bypasses
  // RLS policies that may be broken (infinite recursion from migration 068)
  const result = await rsvpToEvent(opts.itineraryId, response)

  if (!result.success) {
    throw new RsvpError(result.error || "Failed to RSVP", 400)
  }

  return { invitationId: result.invitationId }
}

export function RsvpBanner({
  invitationId,
  itineraryId,
  currentStatus,
  eventTitle,
  hostName,
  onStatusChange,
}: RsvpBannerProps) {
  const [status, setStatus] = useState<RsvpStatus>(currentStatus)
  const [currentInvitationId, setCurrentInvitationId] = useState<string | undefined>(invitationId)
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Controls the collapse animation after a successful RSVP
  const [isCollapsing, setIsCollapsing] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const collapseTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Sync with parent when props change (e.g. after async fetch completes)
  useEffect(() => {
    setStatus(currentStatus)
  }, [currentStatus])

  useEffect(() => {
    setCurrentInvitationId(invitationId)
  }, [invitationId])

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current)
    }
  }, [])

  const { toast } = useToast()

  const handleRsvp = async (response: "accept" | "decline" | "tentative") => {
    const statusMap: Record<string, RsvpStatus> = {
      accept: "accepted",
      decline: "declined",
      tentative: "tentative",
    }
    const newStatus = statusMap[response]

    if (newStatus === status) return

    const previousStatus = status

    // Optimistic update: immediately show the selected state
    setStatus(newStatus)
    setIsSubmitting(true)

    try {
      const data = await submitRsvp(response, {
        invitationId: currentInvitationId,
        itineraryId,
      })

      // If link-based RSVP created a new invitation, save the ID for subsequent updates
      if (data.invitationId && !currentInvitationId) {
        setCurrentInvitationId(data.invitationId)
      }

      onStatusChange?.(newStatus, data.invitationId || currentInvitationId)

      toast({
        title: STATUS_CONFIG[newStatus].label || "RSVP updated",
        description: `Your response for "${eventTitle}" has been saved.`,
      })

      // Show the confirmed state briefly, then collapse the banner
      setIsSubmitting(false)
      collapseTimerRef.current = setTimeout(() => {
        setIsCollapsing(true)
        // After the CSS transition completes, fully hide
        setTimeout(() => setIsHidden(true), 300)
      }, 1200)
    } catch (error: any) {
      setIsSubmitting(false)

      // Check for HTTP status (use duck-typing — instanceof can break across bundles)
      const httpStatus = error?.status

      if (httpStatus === 410) {
        // Invitation has expired — show expired state
        setStatus("expired")
        onStatusChange?.("expired", currentInvitationId)
        toast({
          title: "Invitation expired",
          description: error.message || "This invitation has expired. Ask the host to send a new invite.",
          variant: "destructive",
        })
      } else {
        // Revert optimistic update to the status before the attempt
        setStatus(previousStatus)
        toast({
          title: "Error",
          description: error.message || "Failed to update RSVP",
          variant: "destructive",
        })
      }
    }
  }

  const config = STATUS_CONFIG[status]
  const isPending = status === "pending"
  const isExpired = status === "expired"

  // Fully hidden after collapse animation (or if already responded on mount)
  if (isHidden) return null
  if (!isPending && !isExpired && !isCollapsing && !isSubmitting && status === currentStatus) {
    // Already responded before this component mounted — don't show
    return null
  }

  return (
    <div
      className={cn(
        "rounded-xl border-2 p-4 mb-6 transition-all duration-300 overflow-hidden",
        config.bannerBg,
        config.bannerBorder,
        isCollapsing && "max-h-0 opacity-0 p-0 mb-0 border-0"
      )}
      style={isCollapsing ? { maxHeight: 0 } : { maxHeight: 200 }}
    >
      {/* Header text */}
      <div className="mb-3 text-center">
        {isExpired ? (
          <>
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Clock className="h-4 w-4 text-gray-500" />
              <p className={cn("text-sm font-semibold", config.bannerText)}>
                Invitation expired
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              This invitation has expired. Ask {hostName || "the host"} to send a new invite.
            </p>
          </>
        ) : isPending ? (
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
            {config.label}
          </p>
        )}
      </div>

      {/* RSVP buttons — Partiful-style pill row (hidden when expired) */}
      {!isExpired && (
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
      )}

      {isSubmitting && (
        <div className="flex justify-center mt-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  )
}

export function RsvpPill({
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
