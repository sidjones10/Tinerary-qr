"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar, MapPin } from "lucide-react"

interface StepBasicsProps {
  formData: {
    title: string
    type: "event" | "trip"
    startDate: string
    endDate: string
  }
  onChange: (field: string, value: any) => void
  errors?: Record<string, string>
}

export function StepBasics({ formData, onChange, errors }: StepBasicsProps) {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-base font-semibold">
          What's the name of your {formData.type}?
          <span className="text-red-500 ml-1">*</span>
        </Label>
        <Input
          id="title"
          placeholder="e.g., Weekend in NYC, Sarah's Birthday Party"
          value={formData.title}
          onChange={(e) => onChange("title", e.target.value)}
          className="text-lg h-12"
          autoFocus
        />
        {errors?.title && <p className="text-sm text-red-500">{errors.title}</p>}
      </div>

      {/* Type Selection */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">What type is this?</Label>
        <RadioGroup
          value={formData.type}
          onValueChange={(value) => onChange("type", value)}
          className="grid grid-cols-2 gap-4"
        >
          <label
            htmlFor="type-event"
            className={`relative flex flex-col items-center justify-center p-6 border-2 rounded-xl cursor-pointer transition-all hover:border-orange-300 ${
              formData.type === "event"
                ? "border-orange-500 bg-orange-50 ring-2 ring-orange-200"
                : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            <RadioGroupItem value="event" id="type-event" className="sr-only" />
            <Calendar className={`h-8 w-8 mb-2 ${formData.type === "event" ? "text-orange-500" : "text-gray-400"}`} />
            <span className={`font-semibold ${formData.type === "event" ? "text-orange-700" : "text-gray-700"}`}>
              Event
            </span>
            <span className="text-xs text-gray-500 mt-1 text-center">Single day activity</span>
          </label>

          <label
            htmlFor="type-trip"
            className={`relative flex flex-col items-center justify-center p-6 border-2 rounded-xl cursor-pointer transition-all hover:border-pink-300 ${
              formData.type === "trip"
                ? "border-pink-500 bg-pink-50 ring-2 ring-pink-200"
                : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            <RadioGroupItem value="trip" id="type-trip" className="sr-only" />
            <MapPin className={`h-8 w-8 mb-2 ${formData.type === "trip" ? "text-pink-500" : "text-gray-400"}`} />
            <span className={`font-semibold ${formData.type === "trip" ? "text-pink-700" : "text-gray-700"}`}>
              Trip
            </span>
            <span className="text-xs text-gray-500 mt-1 text-center">Multi-day journey</span>
          </label>
        </RadioGroup>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate" className="text-base font-semibold">
            Start Date <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => onChange("startDate", e.target.value)}
            className="h-11"
          />
          {errors?.startDate && <p className="text-sm text-red-500">{errors.startDate}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate" className="text-base font-semibold">
            End Date <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => onChange("endDate", e.target.value)}
            min={formData.startDate}
            className="h-11"
          />
          {errors?.endDate && <p className="text-sm text-red-500">{errors.endDate}</p>}
        </div>
      </div>

      {/* Helper text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> For events, set the same start and end date. For trips, choose a date range.
        </p>
      </div>
    </div>
  )
}
