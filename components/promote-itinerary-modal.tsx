"use client"

import { useState } from "react"
import { promoteUserItinerary } from "@/app/actions/promotion-actions"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/date-picker"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/components/ui/use-toast"

interface PromoteItineraryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itinerary: any
  userId: string
}

export function PromoteItineraryModal({ open, onOpenChange, itinerary, userId }: PromoteItineraryModalProps) {
  const [title, setTitle] = useState(itinerary?.title || "")
  const [description, setDescription] = useState(itinerary?.description || "")
  const [startDate, setStartDate] = useState<Date | undefined>(new Date())
  const [endDate, setEndDate] = useState<Date | undefined>(new Date())
  const [budget, setBudget] = useState(100)
  const [duration, setDuration] = useState(7)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Missing dates",
        description: "Please select both start and end dates for your promotion",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("itineraryId", itinerary.id)
      formData.append("title", title)
      formData.append("description", description)
      formData.append("startDate", startDate.toISOString())
      formData.append("endDate", endDate.toISOString())
      formData.append("budget", budget.toString())
      formData.append("duration", duration.toString())
      formData.append("userId", userId)

      const result = await promoteUserItinerary(formData)

      if (result.success) {
        toast({
          title: "Itinerary promoted!",
          description: "Your itinerary is now being promoted on the discover page",
        })
        onOpenChange(false)
      } else {
        toast({
          title: "Promotion failed",
          description: result.error || "There was an error promoting your itinerary",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error promoting itinerary:", error)
      toast({
        title: "Promotion failed",
        description: "There was an error promoting your itinerary",
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
          <DialogTitle>Promote Your Itinerary</DialogTitle>
          <DialogDescription>
            Get your itinerary featured on the discover page to reach more travelers
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a catchy title for your promotion"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell travelers why they should check out your itinerary"
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Promotion Period</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Start Date</Label>
                <DatePicker date={startDate} setDate={setStartDate} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">End Date</Label>
                <DatePicker date={endDate} setDate={setEndDate} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label>Daily Budget</Label>
            <div className="space-y-2">
              <Slider
                defaultValue={[budget]}
                max={500}
                min={20}
                step={10}
                onValueChange={(value) => setBudget(value[0])}
              />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">$20</span>
                <span className="text-sm font-medium">${budget}</span>
                <span className="text-sm text-muted-foreground">$500</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Higher budgets increase your visibility in the discover feed
            </p>
          </div>

          <div className="space-y-4">
            <Label>Promotion Duration</Label>
            <div className="space-y-2">
              <Slider
                defaultValue={[duration]}
                max={30}
                min={1}
                step={1}
                onValueChange={(value) => setDuration(value[0])}
              />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">1 day</span>
                <span className="text-sm font-medium">{duration} days</span>
                <span className="text-sm text-muted-foreground">30 days</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <div className="flex justify-between mb-2">
              <span>Daily Budget:</span>
              <span className="font-medium">${budget}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Duration:</span>
              <span className="font-medium">{duration} days</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Estimated Impressions:</span>
              <span className="font-medium">{(budget * duration * 15).toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="font-medium">Total Budget:</span>
              <span className="font-bold">${budget * duration}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
          >
            {isSubmitting ? "Promoting..." : "Promote Itinerary"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
