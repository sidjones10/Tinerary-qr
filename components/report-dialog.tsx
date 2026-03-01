"use client"

import { useState } from "react"
import { Flag, AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"

const REPORT_REASONS = [
  { value: "spam", label: "Spam", description: "Promotional or misleading content" },
  { value: "inappropriate", label: "Inappropriate Content", description: "Pornography, nudity, or sexually explicit material" },
  { value: "misleading", label: "Misleading Information", description: "False or deceptive content" },
  { value: "harassment", label: "Harassment", description: "Bullying, threats, or targeted abuse" },
  { value: "copyright", label: "Copyright Violation", description: "Unauthorized use of copyrighted material" },
  { value: "other", label: "Other", description: "Another issue not listed above" },
] as const

interface ReportDialogProps {
  itineraryId: string
  itineraryTitle: string
  trigger?: React.ReactNode
}

export function ReportDialog({ itineraryId, itineraryTitle, trigger }: ReportDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedReason, setSelectedReason] = useState<string>("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasReported, setHasReported] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast({
        title: "Select a reason",
        description: "Please select a reason for your report",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/itineraries/${itineraryId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: selectedReason,
          description: description.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit report")
      }

      setHasReported(true)
      toast({
        title: "Report submitted",
        description: "Thank you. Our team will review this itinerary.",
      })
      setOpen(false)
      setSelectedReason("")
      setDescription("")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit report",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            disabled={hasReported}
          >
            <Flag className="h-4 w-4" />
            <span className="ml-1 hidden sm:inline">{hasReported ? "Reported" : "Report"}</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Report Itinerary
          </DialogTitle>
          <DialogDescription>
            Report &quot;{itineraryTitle}&quot; for violating our community guidelines.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-sm font-medium mb-3 block">Reason for reporting</Label>
            <div className="space-y-2">
              {REPORT_REASONS.map((reason) => (
                <label
                  key={reason.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedReason === reason.value
                      ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={reason.value}
                    checked={selectedReason === reason.value}
                    onChange={() => setSelectedReason(reason.value)}
                    className="mt-0.5 accent-red-500"
                  />
                  <div>
                    <div className="text-sm font-medium">{reason.label}</div>
                    <div className="text-xs text-muted-foreground">{reason.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="report-description" className="text-sm font-medium">
              Additional details (optional)
            </Label>
            <Textarea
              id="report-description"
              placeholder="Provide any additional context that may help our review..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              className="mt-1.5 resize-none"
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {description.length}/500
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSubmit}
              disabled={!selectedReason || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                "Submit Report"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
