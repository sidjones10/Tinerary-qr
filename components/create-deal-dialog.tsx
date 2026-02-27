"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { createDeal } from "@/app/actions/promotion-actions"

const DEAL_TYPES = [
  { value: "deal", label: "Deal / Discount" },
  { value: "experience", label: "Experience / Tour" },
  { value: "promotion", label: "Promotion" },
  { value: "package", label: "Package" },
]

const DEAL_CATEGORIES = [
  { value: "hotel", label: "Hotel & Accommodation" },
  { value: "restaurant", label: "Restaurant & Dining" },
  { value: "activity", label: "Activity & Tour" },
  { value: "transport", label: "Transport" },
  { value: "wellness", label: "Wellness & Spa" },
  { value: "shopping", label: "Shopping" },
  { value: "entertainment", label: "Entertainment" },
  { value: "other", label: "Other" },
]

interface CreateDealDialogProps {
  onDealCreated?: () => void
  disabled?: boolean
  activeCount?: number
  maxCount?: number | null
}

export function CreateDealDialog({ onDealCreated, disabled, activeCount, maxCount }: CreateDealDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [type, setType] = useState("")
  const [category, setCategory] = useState("")
  const { toast } = useToast()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)

    const form = e.currentTarget
    const formData = new FormData(form)
    formData.set("type", type)
    formData.set("category", category)

    try {
      const result = await createDeal(formData)

      if (result && "success" in result && result.success) {
        toast({ title: "Deal created", description: "Your deal is now live." })
        setOpen(false)
        form.reset()
        setType("")
        setCategory("")
        onDealCreated?.()
      } else {
        const errorMsg = result && "error" in result ? result.error : "Something went wrong."
        toast({ title: "Error", description: errorMsg as string, variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Failed to create deal.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="btn-sunset" disabled={disabled}>
          <Plus className="mr-2 h-4 w-4" />
          {disabled && maxCount !== null
            ? `Limit Reached (${activeCount}/${maxCount})`
            : "Create Deal"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a New Deal</DialogTitle>
          <DialogDescription>
            Add a deal or promotion that travelers will see on Tinerary.
            {maxCount !== null && maxCount !== undefined && (
              <span className="block mt-1 text-xs">
                {activeCount}/{maxCount} active promotions used on your plan.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" name="title" placeholder="e.g. Summer Dining Special" required />
          </div>

          {/* Type & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select value={type} onValueChange={setType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {DEAL_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {DEAL_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe what the deal includes..."
              rows={3}
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input id="location" name="location" placeholder="e.g. San Francisco, CA" required />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date *</Label>
              <Input id="start_date" name="start_date" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date *</Label>
              <Input id="end_date" name="end_date" type="date" required />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Deal Price</Label>
              <Input id="price" name="price" type="number" step="0.01" min="0" placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="original_price">Original Price</Label>
              <Input
                id="original_price"
                name="original_price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount">Discount %</Label>
              <Input id="discount" name="discount" type="number" min="0" max="100" placeholder="0" />
            </div>
          </div>

          {/* Currency */}
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Input id="currency" name="currency" defaultValue="USD" placeholder="USD" />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input id="tags" name="tags" placeholder="e.g. Sunset, Tour, Wine (comma-separated)" />
          </div>

          {/* Image URL */}
          <div className="space-y-2">
            <Label htmlFor="image_url">Image URL</Label>
            <Input id="image_url" name="image_url" type="url" placeholder="https://..." />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="btn-sunset" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Deal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
