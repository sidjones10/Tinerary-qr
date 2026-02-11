"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/providers/auth-provider"
import {
  getUserItinerariesWithActivities,
  getSavedItinerariesWithActivities,
  getSuggestedItinerariesWithActivities,
  copyActivitiesToItinerary,
  type Activity,
  type ItineraryWithActivities,
  type SuggestedItinerary,
} from "@/lib/activity-service"
import { Loader2, Calendar, MapPin, Clock, Plus, Copy, Sparkles, Heart, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ActivityBrowserDialogProps {
  targetItineraryId?: string // If editing an existing itinerary
  targetStartDate?: string
  targetLocation?: string // For suggestions based on location
  targetEventType?: "event" | "trip" // For suggestions based on event type
  onActivitiesSelected?: (activities: Activity[]) => void // For draft mode
  children?: React.ReactNode
}

export function ActivityBrowserDialog({
  targetItineraryId,
  targetStartDate,
  targetLocation,
  targetEventType,
  onActivitiesSelected,
  children,
}: ActivityBrowserDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [copying, setCopying] = useState(false)

  const [suggestedItineraries, setSuggestedItineraries] = useState<SuggestedItinerary[]>([])
  const [myItineraries, setMyItineraries] = useState<ItineraryWithActivities[]>([])
  const [savedItineraries, setSavedItineraries] = useState<ItineraryWithActivities[]>([])
  const [selectedItinerary, setSelectedItinerary] = useState<ItineraryWithActivities | SuggestedItinerary | null>(null)
  const [selectedActivityIds, setSelectedActivityIds] = useState<Set<string>>(new Set())

  // Load itineraries when dialog opens
  useEffect(() => {
    if (open && user) {
      loadItineraries()
    }
  }, [open, user])

  const loadItineraries = async () => {
    if (!user) return

    setLoading(true)
    try {
      const [myResult, savedResult, suggestedResult] = await Promise.all([
        getUserItinerariesWithActivities(user.id),
        getSavedItinerariesWithActivities(user.id),
        getSuggestedItinerariesWithActivities(targetLocation, targetEventType, user.id, 20),
      ])

      if (myResult.success && myResult.itineraries) {
        // Filter out the target itinerary if editing
        const filtered = targetItineraryId
          ? myResult.itineraries.filter((i) => i.id !== targetItineraryId)
          : myResult.itineraries
        setMyItineraries(filtered)
      }

      if (savedResult.success && savedResult.itineraries) {
        setSavedItineraries(savedResult.itineraries)
      }

      if (suggestedResult.success && suggestedResult.itineraries) {
        // Filter out the target itinerary from suggestions
        const filtered = targetItineraryId
          ? suggestedResult.itineraries.filter((i) => i.id !== targetItineraryId)
          : suggestedResult.itineraries
        setSuggestedItineraries(filtered)
      }
    } catch (error) {
      console.error("Error loading itineraries:", error)
      toast({
        title: "Error",
        description: "Failed to load itineraries",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleItinerarySelect = (itinerary: ItineraryWithActivities) => {
    setSelectedItinerary(itinerary)
    setSelectedActivityIds(new Set())
  }

  const toggleActivity = (activityId: string) => {
    const newSet = new Set(selectedActivityIds)
    if (newSet.has(activityId)) {
      newSet.delete(activityId)
    } else {
      newSet.add(activityId)
    }
    setSelectedActivityIds(newSet)
  }

  const selectAllActivities = () => {
    if (!selectedItinerary) return
    const allIds = new Set(selectedItinerary.activities.map((a) => a.id))
    setSelectedActivityIds(allIds)
  }

  const deselectAllActivities = () => {
    setSelectedActivityIds(new Set())
  }

  const handleCopyActivities = async () => {
    if (!selectedItinerary || selectedActivityIds.size === 0) return

    const selectedActivities = selectedItinerary.activities.filter((a) => selectedActivityIds.has(a.id))

    // If we have a callback (draft mode), just pass the activities
    if (onActivitiesSelected) {
      onActivitiesSelected(selectedActivities)
      toast({
        title: "Activities added",
        description: `Added ${selectedActivities.length} ${selectedActivities.length === 1 ? "activity" : "activities"} to your itinerary`,
      })
      setOpen(false)
      return
    }

    // Otherwise, copy to existing itinerary
    if (!targetItineraryId || !user) return

    setCopying(true)
    try {
      const result = await copyActivitiesToItinerary(
        targetItineraryId,
        user.id,
        selectedActivities,
        targetStartDate
      )

      if (result.success) {
        toast({
          title: "Activities copied",
          description: `Successfully copied ${selectedActivities.length} ${selectedActivities.length === 1 ? "activity" : "activities"}`,
        })
        setOpen(false)
        // Optionally refresh the page or update parent component
        window.location.reload()
      } else {
        throw new Error(result.error || "Failed to copy activities")
      }
    } catch (error: any) {
      console.error("Error copying activities:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to copy activities",
        variant: "destructive",
      })
    } finally {
      setCopying(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add from Other Itineraries
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Add Activities from Other Itineraries</DialogTitle>
          <DialogDescription>
            Get suggestions from similar itineraries or browse your own to copy activities
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 h-[500px]">
          {/* Left side - Itinerary list */}
          <div className="border-r pr-4">
            <Tabs defaultValue="suggestions" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="suggestions" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Suggestions
                </TabsTrigger>
                <TabsTrigger value="mine" className="text-xs">My Itineraries</TabsTrigger>
                <TabsTrigger value="saved" className="text-xs">Saved</TabsTrigger>
              </TabsList>

              <TabsContent value="suggestions" className="flex-1 mt-4">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : suggestedItineraries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm text-center p-4">
                    <Sparkles className="h-8 w-8 mb-2 opacity-50" />
                    <p>No suggestions available yet</p>
                    <p className="text-xs mt-1">
                      Try adding a location to your itinerary for personalized suggestions
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-full">
                    <div className="space-y-2">
                      {targetLocation && (
                        <div className="text-xs text-muted-foreground mb-3 px-1">
                          Based on <Badge variant="secondary" className="text-xs">{targetLocation}</Badge>
                        </div>
                      )}
                      {suggestedItineraries.map((itinerary) => (
                        <button
                          key={itinerary.id}
                          onClick={() => handleItinerarySelect(itinerary)}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            selectedItinerary?.id === itinerary.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="font-medium truncate flex-1">{itinerary.title}</div>
                            {itinerary.like_count ? (
                              <div className="flex items-center text-xs text-pink-500 ml-2">
                                <Heart className="h-3 w-3 mr-0.5 fill-current" />
                                {itinerary.like_count}
                              </div>
                            ) : null}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            {itinerary.location}
                          </div>
                          {(itinerary.user_name || itinerary.user_username) && (
                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                              <User className="h-3 w-3" />
                              {itinerary.user_name || `@${itinerary.user_username}`}
                            </div>
                          )}
                          <div className="text-xs text-primary mt-1">
                            {itinerary.activities?.length || 0} activities
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>

              <TabsContent value="mine" className="flex-1 mt-4">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : myItineraries.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    No itineraries found
                  </div>
                ) : (
                  <ScrollArea className="h-full">
                    <div className="space-y-2">
                      {myItineraries.map((itinerary) => (
                        <button
                          key={itinerary.id}
                          onClick={() => handleItinerarySelect(itinerary)}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            selectedItinerary?.id === itinerary.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="font-medium truncate">{itinerary.title}</div>
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            {itinerary.location}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            {formatDate(itinerary.start_date)}
                          </div>
                          <div className="text-xs text-primary mt-1">
                            {itinerary.activities?.length || 0} activities
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>

              <TabsContent value="saved" className="flex-1 mt-4">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : savedItineraries.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    No saved itineraries
                  </div>
                ) : (
                  <ScrollArea className="h-full">
                    <div className="space-y-2">
                      {savedItineraries.map((itinerary) => (
                        <button
                          key={itinerary.id}
                          onClick={() => handleItinerarySelect(itinerary)}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            selectedItinerary?.id === itinerary.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="font-medium truncate">{itinerary.title}</div>
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            {itinerary.location}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            {formatDate(itinerary.start_date)}
                          </div>
                          <div className="text-xs text-primary mt-1">
                            {itinerary.activities?.length || 0} activities
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right side - Activities list */}
          <div className="pl-4 flex flex-col">
            {selectedItinerary ? (
              <>
                <div className="mb-4">
                  <h3 className="font-semibold">{selectedItinerary.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    Select activities to add to your itinerary
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button variant="outline" size="sm" onClick={selectAllActivities}>
                      Select All
                    </Button>
                    <Button variant="outline" size="sm" onClick={deselectAllActivities}>
                      Deselect All
                    </Button>
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  {selectedItinerary.activities?.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                      No activities in this itinerary
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedItinerary.activities?.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-start gap-3 p-3 rounded-lg border hover:border-primary/50 transition-colors"
                        >
                          <Checkbox
                            checked={selectedActivityIds.has(activity.id)}
                            onCheckedChange={() => toggleActivity(activity.id)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{activity.title}</div>
                            {activity.description && (
                              <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {activity.description}
                              </div>
                            )}
                            <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                              {activity.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {activity.location}
                                </div>
                              )}
                              {activity.start_time && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTime(activity.start_time)}
                                </div>
                              )}
                              {activity.day && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {activity.day}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCopyActivities}
                    disabled={selectedActivityIds.size === 0 || copying}
                  >
                    {copying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Copying...
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Add {selectedActivityIds.size} {selectedActivityIds.size === 1 ? "Activity" : "Activities"}
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Select an itinerary to view its activities
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
