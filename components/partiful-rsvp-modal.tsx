"use client"

import { useState, useEffect } from "react"
import { Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { submitRsvp } from "@/components/rsvp-banner"
import { cn } from "@/lib/utils"

type RsvpResponse = "accept" | "decline" | "tentative"

interface PartifulRsvpModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itineraryId: string
  invitationId?: string
  currentStatus?: "pending" | "accepted" | "declined" | "tentative"
  userName?: string
  onStatusChange?: (newStatus: string, invitationId?: string) => void
}

const STATUS_TO_RESPONSE: Record<string, RsvpResponse> = {
  accepted: "accept",
  declined: "decline",
  tentative: "tentative",
}

export function PartifulRsvpModal({
  open,
  onOpenChange,
  itineraryId,
  invitationId,
  currentStatus,
  userName,
  onStatusChange,
}: PartifulRsvpModalProps) {
  const [selected, setSelected] = useState<RsvpResponse | null>(null)
  const [name, setName] = useState(userName || "")
  const [guestCount, setGuestCount] = useState(1)
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setSelected(currentStatus ? STATUS_TO_RESPONSE[currentStatus] || null : null)
      setName(userName || "")
      setGuestCount(1)
      setMessage("")
    }
  }, [open, currentStatus, userName])

  const handleSubmit = async () => {
    if (!selected) return

    setIsSubmitting(true)
    try {
      const data = await submitRsvp(selected, {
        invitationId,
        itineraryId,
        note: message || undefined,
        guestCount,
      })

      const statusMap: Record<string, string> = {
        accept: "accepted",
        decline: "declined",
        tentative: "tentative",
      }

      onStatusChange?.(statusMap[selected], data.invitationId || invitationId)
      toast({
        title: selected === "accept" ? "You're going!" : selected === "tentative" ? "Marked as maybe" : "You've declined",
        description: "Your response has been saved.",
      })
      onOpenChange(false)
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

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-50 w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        {/* Close & overflow menu */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            onClick={() => onOpenChange(false)}
            className="h-9 w-9 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
          >
            <X className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        <div className="px-6 pt-8 pb-6">
          {/* Emoji Selection Row */}
          <div className="flex justify-center gap-4 mb-8">
            <EmojiOption
              emoji="&#x1F44D;"
              label="Going"
              isSelected={selected === "accept"}
              color="bg-indigo-500"
              onClick={() => setSelected("accept")}
            />
            <EmojiOption
              emoji="&#x1F914;"
              label="Maybe"
              isSelected={selected === "tentative"}
              color="bg-amber-400"
              onClick={() => setSelected("tentative")}
            />
            <EmojiOption
              emoji="&#x1F622;"
              label="Can't Go"
              isSelected={selected === "decline"}
              color="bg-gray-300 dark:bg-zinc-600"
              onClick={() => setSelected("decline")}
            />
          </div>

          {/* Form Fields */}
          <div className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                Your Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="border-0 border-b-2 border-gray-200 dark:border-zinc-700 rounded-none px-0 text-base font-medium focus-visible:ring-0 focus-visible:border-indigo-500 bg-transparent"
              />
            </div>

            {/* Guest Count */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                  Attendees
                </label>
                <select
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                  className="w-full border-0 border-b-2 border-gray-200 dark:border-zinc-700 rounded-none px-0 py-2 text-base font-medium bg-transparent focus:outline-none focus:border-indigo-500 text-gray-500 dark:text-gray-400 appearance-none"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? "attendee" : "attendees"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                Your Message
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Can't wait!"
                rows={2}
                className="border-0 border-b-2 border-gray-200 dark:border-zinc-700 rounded-none px-0 text-base resize-none focus-visible:ring-0 focus-visible:border-indigo-500 bg-transparent"
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Your comment will be posted on this page
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-8">
            <Button
              variant="outline"
              className="flex-1 rounded-full h-12 text-base font-semibold border-2"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className={cn(
                "flex-1 rounded-full h-12 text-base font-semibold text-white transition-all",
                selected === "accept" && "bg-indigo-500 hover:bg-indigo-600",
                selected === "tentative" && "bg-amber-500 hover:bg-amber-600",
                selected === "decline" && "bg-gray-500 hover:bg-gray-600",
                !selected && "bg-indigo-500 hover:bg-indigo-600"
              )}
              onClick={handleSubmit}
              disabled={!selected || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Continue"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmojiOption({
  emoji,
  label,
  isSelected,
  color,
  onClick,
}: {
  emoji: string
  label: string
  isSelected: boolean
  color: string
  onClick: () => void
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 group">
      <div
        className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center text-4xl transition-all duration-200",
          isSelected
            ? cn(color, "shadow-lg scale-110 ring-4 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900",
                color === "bg-indigo-500" && "ring-indigo-300",
                color === "bg-amber-400" && "ring-amber-200",
                color === "bg-gray-300 dark:bg-zinc-600" && "ring-gray-200 dark:ring-zinc-500"
              )
            : "bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 hover:scale-105"
        )}
      >
        <span role="img" aria-label={label}>{emoji}</span>
      </div>
      <span
        className={cn(
          "text-sm font-medium transition-colors",
          isSelected ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"
        )}
      >
        {label}
      </span>
    </button>
  )
}
