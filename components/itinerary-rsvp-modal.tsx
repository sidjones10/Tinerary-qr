"use client"

import { useState } from "react"
import { Check, ThumbsDown, ThumbsUp } from "lucide-react"
import { rsvpToItinerary } from "@/app/actions/promotion-actions"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

interface ItineraryRsvpModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itineraryId: string
  userId: string
  itineraryTitle: string
}

export function ItineraryRsvpModal({
  open,
  onOpenChange,
  itineraryId,
  userId,
  itineraryTitle,
}: ItineraryRsvpModalProps) {
  const [response, setResponse] = useState<"yes" | "no" | "maybe" | null>(null)
  const [note, setNote] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!response) {
      toast({
        title: "Response required",
        description: "Please select whether you'll be attending",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("itineraryId", itineraryId)
      formData.append("userId", userId)
      formData.append("response", response)
      formData.append("note", note)

      const result = await rsvpToItinerary(formData)

      if (result.success) {
        toast({
          title: "RSVP submitted!",
          description: `You've responded ${response} to the entire itinerary`,
        })
        onOpenChange(false)
      } else {
        toast({
          title: "RSVP failed",
          description: result.error || "There was an error submitting your RSVP",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error submitting RSVP:", error)
      toast({
        title: "RSVP failed",
        description: "There was an error submitting your RSVP",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>RSVP to Entire Itinerary</DialogTitle>
          <DialogDescription>
            Let your friends know if you'll be joining all activities in "{itineraryTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <RadioGroup value={response || ""} onValueChange={(value) => setResponse(value as any)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="yes" className="sr-only" />
              <Label
                htmlFor="yes"
                className={`flex items-center gap-2 p-3 border rounded-md cursor-pointer transition-all ${
                  response === "yes" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "hover:bg-muted/50"
                }`}
              >
                <div className={`rounded-full p-1 ${response === "yes" ? "bg-emerald-100" : "bg-muted"}`}>
                  <ThumbsUp
                    className={`h-4 w-4 ${response === "yes" ? "text-emerald-500" : "text-muted-foreground"}`}
                  />
                </div>
                <span>Yes, I'll attend all activities!</span>
                {response === "yes" && <Check className="ml-auto h-4 w-4 text-emerald-500" />}
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="maybe" id="maybe" className="sr-only" />
              <Label
                htmlFor="maybe"
                className={`flex items-center gap-2 p-3 border rounded-md cursor-pointer transition-all ${
                  response === "maybe" ? "border-amber-500 bg-amber-50 text-amber-700" : "hover:bg-muted/50"
                }`}
              >
                <div className={`rounded-full p-1 ${response === "maybe" ? "bg-amber-100" : "bg-muted"}`}>
                  <span
                    className={`block text-center text-xs font-bold w-4 h-4 ${
                      response === "maybe" ? "text-amber-500" : "text-muted-foreground"
                    }`}
                  >
                    ?
                  </span>
                </div>
                <span>Maybe, I'll attend some activities</span>
                {response === "maybe" && <Check className="ml-auto h-4 w-4 text-amber-500" />}
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="no" className="sr-only" />
              <Label
                htmlFor="no"
                className={`flex items-center gap-2 p-3 border rounded-md cursor-pointer transition-all ${
                  response === "no" ? "border-red-500 bg-red-50 text-red-700" : "hover:bg-muted/50"
                }`}
              >
                <div className={`rounded-full p-1 ${response === "no" ? "bg-red-100" : "bg-muted"}`}>
                  <ThumbsDown className={`h-4 w-4 ${response === "no" ? "text-red-500" : "text-muted-foreground"}`} />
                </div>
                <span>No, I can't make it</span>
                {response === "no" && <Check className="ml-auto h-4 w-4 text-red-500" />}
              </Label>
            </div>
          </RadioGroup>

          <div className="space-y-2">
            <Label htmlFor="note">Add a note (optional)</Label>
            <Textarea
              id="note"
              placeholder="Looking forward to it!"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!response || isSubmitting}
            className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
          >
            {isSubmitting ? "Submitting..." : "Submit RSVP"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
