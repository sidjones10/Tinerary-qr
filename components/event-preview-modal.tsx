"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, Calendar, MapPin, Clock, Image } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface EventPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  draft: any
}

export function EventPreviewModal({ isOpen, onClose, draft }: EventPreviewModalProps) {
  if (!draft) return null

  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    } catch (e) {
      return dateString
    }
  }

  // Group activities by day
  const activitiesByDay =
    draft.activities?.reduce((acc: any, activity: any) => {
      const day = activity.day || 1
      if (!acc[day]) {
        acc[day] = []
      }
      acc[day].push(activity)
      return acc
    }, {}) || {}

  // Calculate total expenses
  const totalExpenses = draft.expenses?.reduce((sum: number, expense: any) => sum + (expense.amount || 0), 0) || 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preview</DialogTitle>
          <DialogClose className="absolute right-4 top-4">
            <X className="h-4 w-4" />
          </DialogClose>
        </DialogHeader>

        <div className="mt-4">
          <div className="relative rounded-lg overflow-hidden mb-4">
            {draft.cover_image_url ? (
              <img
                src={draft.cover_image_url || "/placeholder.svg"}
                alt={draft.title}
                className="w-full h-48 object-cover"
              />
            ) : (
              <div className="w-full h-48 bg-gradient-to-r from-orange-200 to-pink-200 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-700">{draft.title || "Untitled"}</span>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
              <h2 className="text-2xl font-bold text-white">{draft.title || "Untitled"}</h2>
              <div className="flex items-center text-sm text-white/90">
                <Calendar className="h-4 w-4 mr-1" />
                <span>
                  {formatDate(draft.start_date)}
                  {draft.end_date && draft.end_date !== draft.start_date && <> - {formatDate(draft.end_date)}</>}
                </span>
              </div>
            </div>
          </div>

          <Tabs defaultValue="itinerary">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
              <TabsTrigger value="people">People</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="packing">Packing</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
            </TabsList>

            <TabsContent value="itinerary" className="space-y-4 mt-4">
              <div className="p-4 bg-white rounded-lg border">
                <h3 className="font-medium mb-2">About This Trip</h3>
                <p className="text-sm text-gray-700">{draft.description}</p>
              </div>

              {Object.entries(activitiesByDay).map(([day, dayActivities]: [string, any]) => (
                <div key={day} className="space-y-3">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center mr-3">
                      <span className="text-sm font-medium text-orange-600">{day}</span>
                    </div>
                    <h3 className="text-md font-medium">
                      Day {day} - {formatDate(draft.start_date)}
                    </h3>
                  </div>

                  {dayActivities.map((activity: any) => (
                    <div key={activity.id} className="p-4 border rounded-lg bg-white">
                      <div className="flex justify-between">
                        <h4 className="font-medium">{activity.title}</h4>
                        <span className="text-sm text-muted-foreground">${activity.cost || 0}</span>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{activity.time}</span>
                      </div>
                      {activity.location && (
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span>{activity.location}</span>
                        </div>
                      )}
                      {activity.description && <p className="text-sm mt-2">{activity.description}</p>}
                      <div className="flex items-center mt-2">
                        <Badge variant="outline" className="text-xs">
                          {activity.requireRsvp ? "RSVP Required" : "No RSVP Needed"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </TabsContent>

            <TabsContent value="people" className="space-y-4 mt-4">
              <div className="p-4 bg-white rounded-lg border">
                <h3 className="font-medium mb-3">Trip Squad</h3>
                <div className="space-y-3">
                  {draft.collaborators?.map((collaborator: any) => (
                    <div key={collaborator.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-3">
                          <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                            {collaborator.name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{collaborator.name}</p>
                          <p className="text-xs text-muted-foreground">{collaborator.email}</p>
                        </div>
                      </div>
                      <Badge
                        variant={collaborator.status === "joined" ? "default" : "outline"}
                        className={
                          collaborator.status === "joined"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                        }
                      >
                        {collaborator.status === "joined" ? "Joined" : "Pending"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="expenses" className="space-y-4 mt-4">
              <div className="p-4 bg-white rounded-lg border">
                <h3 className="font-medium mb-2">Trip Expenses</h3>
                <div className="space-y-3">
                  {draft.expenses?.map((expense: any) => (
                    <div key={expense.id} className="flex justify-between items-center p-2 border-b">
                      <div>
                        <p className="font-medium">{expense.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {expense.category} • Paid by {expense.paidBy}
                        </p>
                      </div>
                      <span className="font-medium">${expense.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold pt-2">
                    <span>Total</span>
                    <span>${totalExpenses.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="packing" className="space-y-4 mt-4">
              <div className="p-4 bg-white rounded-lg border">
                <h3 className="font-medium mb-2">Packing List</h3>
                <div className="space-y-3">
                  {["Clothing", "Toiletries", "Electronics", "Other"].map((category) => {
                    const categoryItems = draft.packing_items?.filter((item: any) => item.category === category) || []
                    if (categoryItems.length === 0) return null

                    return (
                      <div key={category}>
                        <h4 className="text-sm font-medium text-orange-600 mt-3">{category}</h4>
                        {categoryItems.map((item: any) => (
                          <div key={item.id} className="flex items-center p-2">
                            <input type="checkbox" className="mr-2" checked={item.checked} readOnly />
                            <span className={item.checked ? "line-through text-muted-foreground" : ""}>
                              {item.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="photos" className="space-y-4 mt-4">
              <div className="p-4 bg-white rounded-lg border">
                <h3 className="font-medium mb-2">Trip Photos</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((_, i) => (
                    <div key={i} className="aspect-square bg-muted rounded-md flex items-center justify-center">
                      <Image className="h-6 w-6 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
