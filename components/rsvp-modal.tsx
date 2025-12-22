"use client"

import { useState } from "react"
import { Check, ThumbsDown, ThumbsUp } from "lucide-react"

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

interface RsvpModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RsvpModal({ open, onOpenChange }: RsvpModalProps) {
  const [response, setResponse] = useState<"yes" | "no" | "maybe" | null>(null)
  const [note, setNote] = useState("")

  const handleSubmit = () => {
    // In a real app, this would save the RSVP to a database
//     console.log({ response, note })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>RSVP to this activity</DialogTitle>
          <DialogDescription>Let your friends know if you'll be joining this activity.</DialogDescription>
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
                <span>Yes, I'll be there!</span>
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
                <span>Maybe, not sure yet</span>
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
            disabled={!response}
            className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
          >
            Submit RSVP
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
