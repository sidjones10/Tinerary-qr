"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, Lock, Globe } from "lucide-react"
import { format } from "date-fns"

interface StepPreviewProps {
  formData: {
    title: string
    type: "event" | "trip"
    startDate: string
    endDate: string
    location: string
    description: string
    coverImage: string
    isPublic: boolean
    activities: any[]
    inviteEmails: string[]
  }
}

export function StepPreview({ formData }: StepPreviewProps) {
  const formatDateRange = () => {
    if (!formData.startDate) return "No date set"

    const start = new Date(formData.startDate)
    const end = formData.endDate ? new Date(formData.endDate) : start

    if (start.toDateString() === end.toDateString()) {
      return format(start, "MMMM d, yyyy")
    }

    return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Review Your {formData.type === "event" ? "Event" : "Trip"}</h3>
        <p className="text-gray-600 dark:text-gray-400">Make sure everything looks good before publishing!</p>
      </div>

      {/* Preview Card */}
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        {/* Cover Image */}
        {formData.coverImage ? (
          <div className="relative h-64">
            <img src={formData.coverImage} alt={formData.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <Badge
                className={
                  formData.type === "trip"
                    ? "bg-gradient-to-r from-blue-500 to-cyan-400"
                    : "bg-gradient-to-r from-purple-500 to-pink-400"
                }
              >
                {formData.type === "trip" ? "Trip" : "Event"}
              </Badge>
              <h2 className="text-2xl font-bold text-white mt-2">{formData.title || "Untitled"}</h2>
            </div>
          </div>
        ) : (
          <div className="h-64 bg-gradient-to-br from-orange-400 via-pink-400 to-purple-500 flex items-center justify-center">
            <div className="text-center">
              <Badge
                className={
                  formData.type === "trip"
                    ? "bg-white/90 dark:bg-card/90 text-blue-600 mb-4"
                    : "bg-white/90 dark:bg-card/90 text-purple-600 mb-4"
                }
              >
                {formData.type === "trip" ? "Trip" : "Event"}
              </Badge>
              <h2 className="text-3xl font-bold text-white drop-shadow-lg">{formData.title || "Untitled"}</h2>
            </div>
          </div>
        )}

        <CardContent className="p-6 space-y-4">
          {/* Location */}
          {formData.location && (
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Location</p>
                <p className="text-gray-600 dark:text-gray-400">{formData.location}</p>
              </div>
            </div>
          )}

          {/* Date */}
          {formData.startDate && (
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Date</p>
                <p className="text-gray-600 dark:text-gray-400">{formatDateRange()}</p>
              </div>
            </div>
          )}

          {/* Privacy */}
          <div className="flex items-start gap-3">
            {formData.isPublic ? (
              <Globe className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            ) : (
              <Lock className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Privacy</p>
              <p className="text-gray-600 dark:text-gray-400">{formData.isPublic ? "Public - Anyone can see this" : "Private - Only invited people"}</p>
            </div>
          </div>

          {/* Invites */}
          {formData.inviteEmails && formData.inviteEmails.length > 0 && (
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Invitations</p>
                <p className="text-gray-600 dark:text-gray-400">{formData.inviteEmails.length} people invited</p>
              </div>
            </div>
          )}

          {/* Description */}
          {formData.description && (
            <div className="pt-4 border-t">
              <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">Description</p>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{formData.description}</p>
            </div>
          )}

          {/* Activities */}
          {formData.activities && formData.activities.length > 0 && (
            <div className="pt-4 border-t">
              <p className="font-medium text-gray-900 dark:text-gray-100 mb-3">Activities ({formData.activities.length})</p>
              <div className="space-y-2">
                {formData.activities.slice(0, 3).map((activity, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="w-2 h-2 rounded-full bg-orange-400" />
                    {activity.title}
                  </div>
                ))}
                {formData.activities.length > 3 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 ml-4">+{formData.activities.length - 3} more</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Message */}
      <div className="bg-gradient-to-r from-orange-50 to-pink-50 border-2 border-orange-200 rounded-lg p-6 text-center">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Ready to publish?</h4>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Once published, your {formData.type} will be {formData.isPublic ? "visible to everyone" : "visible to invited people only"}.
          You can always edit it later.
        </p>
      </div>
    </div>
  )
}
