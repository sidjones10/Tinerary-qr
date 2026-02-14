"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Plus,
  Trash2,
  Eye,
  Camera,
  DollarSign,
  Image,
  PanelLeft,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/providers/auth-provider"

import { Button } from "@/components/ui/button"
import { CardContent, CardDescription, CardHeader, CardTitle, Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { EventPreviewModal } from "@/components/event-preview-modal"
import { type EventDraft, saveDraft, getDraft } from "@/app/actions/draft-actions"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ThemeSelector, ThemeIcon, themes } from "@/components/theme-selector"
import { FontSelector, getFontFamily } from "@/components/font-selector"

export default function CreatePageContent() {
  const [type, setType] = useState<"event" | "trip">("trip")
  const [activities, setActivities] = useState([
    {
      id: 1,
      day: 1,
      time: "10:00 AM",
      title: "",
      location: "",
      description: "",
      requireRsvp: false,
      cost: 0,
    },
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [activeTab, setActiveTab] = useState("details")
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [draftId, setDraftId] = useState<string | null>(null)
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [showPackingExpenses, setShowPackingExpenses] = useState(type === "trip")
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const { user } = useAuth()
  const [selectedBackground, setSelectedBackground] = useState("gradient")
  const [selectedTheme, setSelectedTheme] = useState("default")
  const [selectedFont, setSelectedFont] = useState("default")

  // Form state
  const [title, setTitle] = useState("Weekend in NYC")
  const [description, setDescription] = useState(
    "Exploring the best of New York City with friends! We'll visit museums, try local restaurants, and catch a Broadway show.",
  )
  const [location, setLocation] = useState("New York, NY")
  const [startDate, setStartDate] = useState("2023-05-15")
  const [endDate, setEndDate] = useState("2023-05-16")
  const [isPublic, setIsPublic] = useState(true)
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)
  const [collaborators, setCollaborators] = useState([
    { id: 1, name: "Taylor Moore", email: "taylor@example.com", status: "joined" },
    { id: 2, name: "Jordan Davis", email: "jordan@example.com", status: "pending" },
  ])
  const [packingItems, setPackingItems] = useState([
    { id: 1, category: "Clothing", name: "T-shirts (2)", checked: false },
    { id: 2, category: "Clothing", name: "Jeans", checked: false },
    { id: 3, category: "Toiletries", name: "Toothbrush", checked: false },
    { id: 4, category: "Toiletries", name: "Shampoo", checked: false },
    { id: 5, category: "Electronics", name: "Phone charger", checked: false },
    { id: 6, category: "Electronics", name: "Camera", checked: false },
  ])
  const [expenses, setExpenses] = useState([
    { id: 1, category: "Accommodation", name: "Hotel", amount: 350, paidBy: "You" },
    { id: 2, category: "Transportation", name: "Flights", amount: 250, paidBy: "You" },
    { id: 3, category: "Food & Dining", name: "Restaurants", amount: 200, paidBy: "You" },
    { id: 4, category: "Activities", name: "Museum tickets", amount: 60, paidBy: "You" },
    { id: 5, category: "Activities", name: "Broadway show", amount: 120, paidBy: "You" },
  ])
  const [photos, setPhotos] = useState<string[]>([])
  const [discussions, setDiscussions] = useState([
    {
      id: 1,
      user: "You",
      message: "I'm so excited for our NYC trip! Does anyone have preferences for the Broadway show?",
      timestamp: new Date().toISOString(),
    },
    {
      id: 2,
      user: "Taylor",
      message: "I'd love to see Hamilton! I've been wanting to see it forever.",
      timestamp: new Date().toISOString(),
    },
  ])

  // Load draft if draftId is provided in URL
  useEffect(() => {
    const loadDraft = async () => {
      const draftIdFromUrl = searchParams?.get("draftId")
      if (draftIdFromUrl && user) {
        try {
          const { success, draft, error } = await getDraft(draftIdFromUrl)
          if (success && draft) {
            setDraftId(draftIdFromUrl)
            setTitle(draft.title || "Weekend in NYC")
            setDescription(
              draft.description ||
                "Exploring the best of New York City with friends! We'll visit museums, try local restaurants, and catch a Broadway show.",
            )
            setLocation(draft.location || "New York, NY")
            setStartDate(draft.start_date || "2023-05-15")
            setEndDate(draft.end_date || "2023-05-16")
            setType(draft.type || "trip")
            setIsPublic(draft.is_public !== undefined ? draft.is_public : true)
            setCoverImageUrl(draft.image_url || null)

            if (draft.activities && draft.activities.length > 0) {
              setActivities(draft.activities)
            } else {
              // Set default activities if none exist
              setActivities([
                {
                  id: 1,
                  day: 1,
                  time: "10:00 AM",
                  title: "Brunch at Sarabeth's",
                  location: "Sarabeth's, Central Park South",
                  description: "Meet up for brunch to start our NYC adventure!",
                  requireRsvp: false,
                  cost: 30,
                },
                {
                  id: 2,
                  day: 1,
                  time: "1:00 PM",
                  title: "Metropolitan Museum of Art",
                  location: "1000 5th Ave, New York",
                  description: "Explore one of the world's greatest art museums",
                  requireRsvp: false,
                  cost: 25,
                },
                {
                  id: 3,
                  day: 1,
                  time: "7:00 PM",
                  title: "Dinner at Carbone",
                  location: "Greenwich Village",
                  description: "Famous Italian restaurant with amazing pasta",
                  requireRsvp: true,
                  cost: 80,
                },
                {
                  id: 4,
                  day: 2,
                  time: "9:00 AM",
                  title: "Walk the High Line",
                  location: "Chelsea",
                  description: "Scenic elevated park built on a historic freight rail line",
                  requireRsvp: false,
                  cost: 0,
                },
                {
                  id: 5,
                  day: 2,
                  time: "12:00 PM",
                  title: "Chelsea Market Lunch",
                  location: "Chelsea",
                  description: "Food hall with tons of great options",
                  requireRsvp: false,
                  cost: 25,
                },
                {
                  id: 6,
                  day: 2,
                  time: "8:00 PM",
                  title: "Broadway Show",
                  location: "Times Square",
                  description: "Hamilton at Richard Rodgers Theatre",
                  requireRsvp: true,
                  cost: 120,
                },
              ])
            }

            if (draft.collaborators && draft.collaborators.length > 0) {
              setCollaborators(draft.collaborators)
            }

            if (draft.packing_items && draft.packing_items.length > 0) {
              setPackingItems(draft.packing_items)
            }

            if (draft.expenses && draft.expenses.length > 0) {
              setExpenses(draft.expenses)
            }

            if (draft.photos && draft.photos.length > 0) {
              setPhotos(draft.photos)
            }

            if (draft.discussions && draft.discussions.length > 0) {
              setDiscussions(draft.discussions)
            }

            setLastSaved(draft.last_saved || null)
            toast({
              title: "Draft loaded",
              description: "Your draft has been loaded successfully.",
            })
          } else if (error) {
            toast({
              title: "Error loading draft",
              description: error,
              variant: "destructive",
            })
          }
        } catch (error) {
          console.error("Error loading draft:", error)
          toast({
            title: "Error",
            description: "There was a problem loading your draft.",
            variant: "destructive",
          })
        }
      }
    }

    if (user) {
      loadDraft()
    }
  }, [searchParams, toast, user])

  useEffect(() => {
    setShowPackingExpenses(type === "trip")
  }, [type])

  // Calculate completion percentage
  useEffect(() => {
    let completed = 0
    let total = 5 // Basic fields: title, type, location, start date, is_public

    // Check basic fields
    if (title) completed++
    if (location) completed++
    if (startDate) completed++
    if (type) completed++
    if (isPublic !== undefined) completed++

    // Check optional fields
    if (description) {
      total++
      completed++
    }
    if (endDate) {
      total++
      completed++
    }
    if (coverImageUrl) {
      total++
      completed++
    }

    // Check activities
    if (activities.length > 0) {
      const validActivities = activities.filter((a) => a.title)
      if (validActivities.length > 0) {
        total += validActivities.length
        completed += validActivities.length
      }
    }

    const percentage = Math.round((completed / total) * 100)
    setCompletionPercentage(percentage)
  }, [title, description, location, startDate, endDate, type, isPublic, coverImageUrl, activities])

  // Auto-save functionality
  const performAutoSave = useCallback(async () => {
    if (!user) return
    if (!title && !description && !location && !startDate) {
      // Don't auto-save if form is mostly empty
      return
    }

    setIsSaving(true)
    try {
      const draftData: EventDraft = {
        id: draftId || undefined,
        title,
        description,
        location,
        start_date: startDate || new Date().toISOString().split("T")[0],
        end_date: endDate || startDate || new Date().toISOString().split("T")[0],
        type,
        is_public: isPublic,
        activities,
        collaborators,
        packing_items: packingItems,
        expenses,
        photos,
        discussions,
        image_url: coverImageUrl,
      }

      const { success, draftId: newDraftId, error } = await saveDraft(draftData)

      if (success) {
        if (newDraftId && !draftId) {
          setDraftId(newDraftId)
          // Update URL with draft ID without navigation
          const url = new URL(window.location.href)
          url.searchParams.set("draftId", newDraftId)
          window.history.replaceState({}, "", url.toString())
        }
        setLastSaved(new Date().toLocaleTimeString())
      } else if (error) {
        console.error("Auto-save error:", error)
        // Don't show toast for auto-save errors to avoid disrupting the user
      }
    } catch (error) {
      console.error("Auto-save error:", error)
    } finally {
      setIsSaving(false)
    }
  }, [
    draftId,
    title,
    description,
    location,
    startDate,
    endDate,
    type,
    isPublic,
    activities,
    collaborators,
    packingItems,
    expenses,
    photos,
    discussions,
    coverImageUrl,
    user,
  ])

  // Set up auto-save timer
  useEffect(() => {
    if (!user) return

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    // Set new timer for auto-save (30 seconds)
    autoSaveTimerRef.current = setTimeout(() => {
      performAutoSave()
    }, 30000)

    // Cleanup on unmount
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [title, description, location, startDate, endDate, type, isPublic, activities, performAutoSave, user])

  const addActivity = () => {
    const newId = activities.length > 0 ? Math.max(...activities.map((a) => a.id)) + 1 : 1
    const lastActivity = activities[activities.length - 1]
    const day = lastActivity ? lastActivity.day : 1

    setActivities([
      ...activities,
      {
        id: newId,
        day,
        time: "",
        title: "",
        location: "",
        description: "",
        requireRsvp: false,
        cost: 0,
      },
    ])
  }

  const removeActivity = (id: number) => {
    setActivities(activities.filter((activity) => activity.id !== id))
  }

  const updateActivity = (id: number, field: string, value: any) => {
    setActivities(activities.map((activity) => (activity.id === id ? { ...activity, [field]: value } : activity)))
  }

  const addCollaborator = () => {
    const newId = collaborators.length > 0 ? Math.max(...collaborators.map((c) => c.id)) + 1 : 1
    setCollaborators([...collaborators, { id: newId, name: "", email: "", status: "pending" }])
  }

  const removeCollaborator = (id: number) => {
    setCollaborators(collaborators.filter((collaborator) => collaborator.id !== id))
  }

  const updateCollaborator = (id: number, field: string, value: any) => {
    setCollaborators(
      collaborators.map((collaborator) =>
        collaborator.id === id ? { ...collaborator, [field]: value } : collaborator,
      ),
    )
  }

  const addPackingItem = () => {
    const newId = packingItems.length > 0 ? Math.max(...packingItems.map((item) => item.id)) + 1 : 1
    setPackingItems([...packingItems, { id: newId, category: "Other", name: "", checked: false }])
  }

  const removePackingItem = (id: number) => {
    setPackingItems(packingItems.filter((item) => item.id !== id))
  }

  const updatePackingItem = (id: number, field: string, value: any) => {
    setPackingItems(packingItems.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const addExpense = () => {
    const newId = expenses.length > 0 ? Math.max(...expenses.map((e) => e.id)) + 1 : 1
    setExpenses([...expenses, { id: newId, category: "Other", name: "", amount: 0, paidBy: "You" }])
  }

  const removeExpense = (id: number) => {
    setExpenses(expenses.filter((expense) => expense.id !== id))
  }

  const updateExpense = (id: number, field: string, value: any) => {
    setExpenses(expenses.map((expense) => (expense.id === id ? { ...expense, [field]: value } : expense)))
  }

  const addDiscussion = (message: string) => {
    const newId = discussions.length > 0 ? Math.max(...discussions.map((d) => d.id)) + 1 : 1
    setDiscussions([
      ...discussions,
      {
        id: newId,
        user: "You",
        message,
        timestamp: new Date().toISOString(),
      },
    ])
  }

  const handlePublish = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to publish an event",
        variant: "destructive",
      })
      return
    }

    if (!title) {
      toast({
        title: "Missing information",
        description: "Please provide a title for your " + type,
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // NOTE: User profile creation is now handled by database trigger (migration 021)
      // No need to manually ensure profile exists

      // Format dates properly
      const formattedStartDate = startDate || new Date().toISOString().split("T")[0]
      const formattedEndDate = endDate || formattedStartDate

      const supabase = createClient()

      // Save the itinerary to the database
      const { data: itinerary, error } = await supabase
        .from("itineraries")
        .insert({
          title,
          description,
          location,
          start_date: formattedStartDate,
          end_date: formattedEndDate,
          is_public: isPublic,
          is_template: false,
          user_id: user.id,
          image_url: coverImageUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      // Helper function to format activity date/time
      const formatActivityDateTime = (day: number, time: string, baseDate: string): string => {
        try {
          // Parse the base date and add (day - 1) days
          const date = new Date(baseDate)
          date.setDate(date.getDate() + (day - 1))

          // Parse the time string (e.g., "10:00 AM" or "14:30")
          let hours = 0
          let minutes = 0

          if (time) {
            const timeUpper = time.toUpperCase().trim()
            const isPM = timeUpper.includes("PM")
            const isAM = timeUpper.includes("AM")

            // Remove AM/PM and extract time
            const cleanTime = timeUpper.replace(/AM|PM/g, "").trim()
            const parts = cleanTime.split(":")

            if (parts.length >= 2) {
              hours = parseInt(parts[0], 10)
              minutes = parseInt(parts[1], 10)

              // Convert to 24-hour format
              if (isPM && hours !== 12) {
                hours += 12
              } else if (isAM && hours === 12) {
                hours = 0
              }
            }
          }

          date.setHours(hours, minutes, 0, 0)
          return date.toISOString()
        } catch (error) {
          console.error("Error formatting activity date/time:", error)
          // Fallback to base date at noon
          const fallbackDate = new Date(baseDate)
          fallbackDate.setHours(12, 0, 0, 0)
          return fallbackDate.toISOString()
        }
      }

      // Save activities if any are defined
      if (activities.length > 0 && activities[0].title) {
        const activitiesToInsert = activities
          .filter((a) => a.title) // Only insert activities with titles
          .map((activity) => {
            const startTime = formatActivityDateTime(
              activity.day || 1,
              activity.time || "",
              formattedStartDate,
            )

            // Calculate end_time (1 hour after start by default)
            const endTime = new Date(new Date(startTime).getTime() + 60 * 60 * 1000).toISOString()

            return {
              itinerary_id: itinerary.id,
              title: activity.title,
              description: activity.description || null,
              location: activity.location || null,
              start_time: startTime,
              end_time: endTime,
              day: `Day ${activity.day || 1}`,
              cost: activity.cost || null,
              user_id: user.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          })

        if (activitiesToInsert.length > 0) {
          const { error: activitiesError } = await supabase.from("activities").insert(activitiesToInsert)

          if (activitiesError) {
            console.error("Error saving activities:", activitiesError)
            toast({
              title: "Warning",
              description: "Itinerary saved but some activities could not be added. Error: " + activitiesError.message,
              variant: "destructive",
            })
          }
        }
      }

      // Save collaborators
      if (collaborators.length > 0) {
        const collaboratorsToInsert = collaborators.map((collaborator) => ({
          itinerary_id: itinerary.id,
          name: collaborator.name,
          email: collaborator.email,
          status: collaborator.status,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))

        const { error: collaboratorsError } = await supabase.from("collaborators").insert(collaboratorsToInsert)

        if (collaboratorsError) {
          console.error("Error saving collaborators:", collaboratorsError)
        }
      }

      // Save packing items
      if (packingItems.length > 0) {
        const packingItemsToInsert = packingItems.map((item) => ({
          itinerary_id: itinerary.id,
          category: item.category,
          name: item.name,
          is_packed: item.checked || false,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))

        const { error: packingError } = await supabase.from("packing_items").insert(packingItemsToInsert)

        if (packingError) {
          console.error("Error saving packing items:", packingError)
        }
      }

      // Save expenses
      if (expenses.length > 0) {
        const expensesToInsert = expenses.map((expense) => ({
          itinerary_id: itinerary.id,
          category: expense.category,
          name: expense.name,
          amount: expense.amount,
          paid_by: expense.paidBy,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))

        const { error: expensesError } = await supabase.from("expenses").insert(expensesToInsert)

        if (expensesError) {
          console.error("Error saving expenses:", expensesError)
        }
      }

      // Save discussions
      if (discussions.length > 0) {
        const discussionsToInsert = discussions.map((discussion) => ({
          itinerary_id: itinerary.id,
          user_name: discussion.user,
          message: discussion.message,
          user_id: user.id,
          created_at: discussion.timestamp,
          updated_at: new Date().toISOString(),
        }))

        const { error: discussionsError } = await supabase.from("discussions").insert(discussionsToInsert)

        if (discussionsError) {
          console.error("Error saving discussions:", discussionsError)
        }
      }

      // Delete the draft if it exists
      if (draftId) {
        await supabase.from("drafts").delete().eq("id", draftId)
      }

      toast({
        title: "Success!",
        description: `Your ${type} has been published.`,
      })

      // Redirect to the event page
      router.push(`/event/${itinerary.id}`)
    } catch (error: any) {
      console.error("Error publishing:", error)
      toast({
        title: "Error",
        description: "There was a problem publishing your " + type,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to save a draft",
        variant: "destructive",
      })
      return
    }

    if (!title && !description && !location) {
      toast({
        title: "Missing information",
        description: "Please provide at least a title, description, or location for your draft",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const draftData: EventDraft = {
        id: draftId || undefined,
        title: title || "Untitled Draft",
        description,
        location,
        start_date: startDate || new Date().toISOString().split("T")[0],
        end_date: endDate || startDate || new Date().toISOString().split("T")[0],
        type,
        is_public: isPublic,
        activities,
        collaborators,
        packing_items: packingItems,
        expenses,
        photos,
        discussions,
        image_url: coverImageUrl,
      }

      const { success, draftId: newDraftId, error } = await saveDraft(draftData)

      if (success) {
        if (newDraftId && !draftId) {
          setDraftId(newDraftId)
        }
        setLastSaved(new Date().toLocaleTimeString())
        toast({
          title: "Draft Saved",
          description: `Your ${type} has been saved as a draft.`,
        })
        // Redirect to the home/discover page
        router.push("/")
      } else if (error) {
        throw new Error(error)
      }
    } catch (error: any) {
      console.error("Error saving draft:", error)
      toast({
        title: "Error",
        description: "There was a problem saving your draft",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePreview = () => {
    setShowPreview(true)
  }

  // Group activities by day
  const activitiesByDay = activities.reduce(
    (acc, activity) => {
      const day = activity.day || 1
      if (!acc[day]) {
        acc[day] = []
      }
      acc[day].push(activity)
      return acc
    },
    {} as Record<number, typeof activities>,
  )

  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)

  return (
    <div className="container px-4 py-6 md:py-10">
      <Link href="/app" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Link>

      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Create New</h1>
          <div className="flex items-center mt-2 md:mt-0">
            {isSaving && <span className="text-sm text-muted-foreground mr-2">Saving...</span>}
            {lastSaved && !isSaving && (
              <span className="text-sm text-muted-foreground mr-2">Last saved at {lastSaved}</span>
            )}
            <Button variant="outline" onClick={handlePreview} className="ml-2" disabled={!title}>
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
          </div>
        </div>

        <div className="mb-4">
          <Progress value={completionPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {completionPercentage}% complete {completionPercentage === 100 ? "- Ready to publish!" : ""}
          </p>
        </div>

        <Card className="bg-gradient-to-r from-orange-50/50 to-pink-50/50 border shadow-sm mb-8">
          <CardHeader>
            <CardTitle>What are you creating?</CardTitle>
            <CardDescription>Choose the type of plan you want to create</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              defaultValue={type}
              value={type}
              className="grid grid-cols-2 gap-4"
              onValueChange={(value) => setType(value as "event" | "trip")}
            >
              <div>
                <RadioGroupItem value="event" id="event" className="peer sr-only" />
                <Label
                  htmlFor="event"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-purple-500 [&:has([data-state=checked])]:border-purple-500"
                >
                  <div className="mb-3 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 p-2">
                    <Calendar className="h-6 w-6 text-purple-500" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">Single Event</p>
                    <p className="text-sm text-muted-foreground">Party, concert, dinner, etc.</p>
                  </div>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="trip" id="trip" className="peer sr-only" />
                <Label
                  htmlFor="trip"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-blue-500 [&:has([data-state=checked])]:border-blue-500"
                >
                  <div className="mb-3 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 p-2">
                    <MapPin className="h-6 w-6 text-blue-500" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">Multi-Day Trip</p>
                    <p className="text-sm text-muted-foreground">Travel, vacation, weekend getaway</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-6 bg-white/70 backdrop-blur-sm">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="activities">{type === "trip" ? "Itinerary" : "Activities"}</TabsTrigger>
            <TabsTrigger value="people">People</TabsTrigger>
            <TabsTrigger value="packing">Packing</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6 mt-6">
            <Card className="bg-gradient-to-r from-orange-50/50 to-pink-50/50 border shadow-sm">
              <CardHeader>
                <CardTitle>Basic Details</CardTitle>
                <CardDescription>Set the main information for your {type}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder={type === "event" ? "Birthday Party" : "Weekend in NYC"}
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="flex items-center border rounded-md">
                    <MapPin className="ml-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      placeholder="Enter location"
                      className="border-0"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                </div>

                {type === "event" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">Time</Label>
                      <div className="flex items-center border rounded-md">
                        <Clock className="ml-3 h-4 w-4 text-muted-foreground" />
                        <Input id="time" placeholder="7:00 PM" className="border-0" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder={type === "event" ? "Details about your event" : "What's this trip all about?"}
                    className="min-h-[100px]"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cover">Cover Image</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <div className="mx-auto w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-2">
                      <Plus className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">Drag and drop an image, or click to browse</p>
                    <p className="text-xs text-muted-foreground">Recommended size: 1200 x 800 pixels</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activities" className="space-y-6 mt-6">
            <Card className="bg-gradient-to-r from-orange-50/50 to-pink-50/50 border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{type === "event" ? "Event Schedule" : "Trip Itinerary"}</CardTitle>
                  <CardDescription>
                    {type === "event" ? "Add activities to your event schedule" : "Plan your trip day by day"}
                  </CardDescription>
                </div>
                <Button onClick={addActivity} variant="outline" size="sm" className="bg-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Activity
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(activitiesByDay).map(([day, dayActivities]) => (
                  <div key={day} className="space-y-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-orange-600">{day}</span>
                      </div>
                      <h3 className="text-md font-medium">
                        Day {day} -{" "}
                        {new Date(startDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </h3>
                    </div>

                    {dayActivities.map((activity) => (
                      <div key={activity.id} className="space-y-4 p-4 border rounded-lg relative bg-white shadow-sm">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeActivity(activity.id)}
                          aria-label="Remove activity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Activity Name</Label>
                            <Input
                              placeholder="Visit Museum"
                              value={activity.title}
                              onChange={(e) => updateActivity(activity.id, "title", e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Time</Label>
                            <div className="flex items-center border rounded-md">
                              <Clock className="ml-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="10:00 AM"
                                className="border-0"
                                value={activity.time}
                                onChange={(e) => updateActivity(activity.id, "time", e.target.value)}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Location</Label>
                          <div className="flex items-center border rounded-md">
                            <MapPin className="ml-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Enter location"
                              className="border-0"
                              value={activity.location}
                              onChange={(e) => updateActivity(activity.id, "location", e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            placeholder="Details about this activity..."
                            value={activity.description}
                            onChange={(e) => updateActivity(activity.id, "description", e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center">
                            <Label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={activity.requireRsvp}
                                onChange={(e) => updateActivity(activity.id, "requireRsvp", e.target.checked)}
                              />
                              <div className="h-4 w-4 rounded border border-primary mr-2 peer-checked:bg-primary peer-checked:text-primary-foreground" />
                              <span>Require RSVP</span>
                            </Label>
                          </div>
                          <div className="space-y-2">
                            <Label>Cost (optional)</Label>
                            <div className="flex items-center border rounded-md">
                              <DollarSign className="ml-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                placeholder="0"
                                className="border-0"
                                value={activity.cost || ""}
                                onChange={(e) => updateActivity(activity.id, "cost", Number(e.target.value) || 0)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-dashed"
                      onClick={() => {
                        const newId = activities.length > 0 ? Math.max(...activities.map((a) => a.id)) + 1 : 1
                        setActivities([
                          ...activities,
                          {
                            id: newId,
                            day: Number.parseInt(day),
                            time: "",
                            title: "",
                            location: "",
                            description: "",
                            requireRsvp: false,
                            cost: 0,
                          },
                        ])
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Day {day}
                    </Button>
                  </div>
                ))}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    const newDay = Object.keys(activitiesByDay).length + 1
                    const newId = activities.length > 0 ? Math.max(...activities.map((a) => a.id)) + 1 : 1
                    setActivities([
                      ...activities,
                      {
                        id: newId,
                        day: newDay,
                        time: "",
                        title: "",
                        location: "",
                        description: "",
                        requireRsvp: false,
                        cost: 0,
                      },
                    ])
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Day
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="people" className="space-y-6 mt-6">
            <Card className="bg-gradient-to-r from-orange-50/50 to-pink-50/50 border shadow-sm">
              <CardHeader>
                <CardTitle>Trip Squad</CardTitle>
                <CardDescription>People collaborating on this trip</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {collaborators.map((collaborator) => (
                    <div
                      key={collaborator.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-white"
                    >
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                            {collaborator.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{collaborator.name}</p>
                          <p className="text-sm text-muted-foreground">{collaborator.email}</p>
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

                  <div className="flex items-center space-x-2">
                    <Input placeholder="Enter email address" />
                    <Button variant="outline" onClick={addCollaborator}>
                      Invite
                    </Button>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Invited users will receive an email with a link to join.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="packing" className="space-y-6 mt-6">
            <Card className="bg-gradient-to-r from-orange-50/50 to-pink-50/50 border shadow-sm">
              <CardHeader>
                <CardTitle>What's in my bag</CardTitle>
                <CardDescription>Keep track of everything you need to pack for your trip</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative w-full bg-orange-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-orange-500 rounded-full"
                      style={{
                        width: `${(packingItems.filter((item) => item.checked).length / packingItems.length) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {packingItems.filter((item) => item.checked).length} of {packingItems.length} items packed
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Category</Label>
                      <Label>Packed</Label>
                    </div>

                    {["Clothing", "Toiletries", "Electronics", "Other"].map((category) => (
                      <div key={category} className="space-y-2">
                        <h4 className="text-sm font-medium text-orange-600 mt-4">{category}</h4>
                        {packingItems
                          .filter((item) => item.category === category)
                          .map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-2 border rounded-md bg-white"
                            >
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`item-${item.id}`}
                                  className="mr-2"
                                  checked={item.checked}
                                  onChange={(e) => updatePackingItem(item.id, "checked", e.target.checked)}
                                />
                                <Label
                                  htmlFor={`item-${item.id}`}
                                  className={item.checked ? "line-through text-muted-foreground" : ""}
                                >
                                  {item.name}
                                </Label>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-muted-foreground"
                                onClick={() => removePackingItem(item.id)}
                                aria-label="Remove packing item"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center space-x-2 mt-4">
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      defaultValue="Clothing"
                      onChange={(e) => {
                        const newId = packingItems.length > 0 ? Math.max(...packingItems.map((item) => item.id)) + 1 : 1
                        setPackingItems([
                          ...packingItems,
                          { id: newId, category: e.target.value, name: "", checked: false },
                        ])
                      }}
                    >
                      <option value="Clothing">Clothing</option>
                      <option value="Toiletries">Toiletries</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Other">Other</option>
                    </select>
                    <Input placeholder="Add item..." />
                    <Button variant="outline" onClick={addPackingItem}>
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-6 mt-6">
            <Card className="bg-gradient-to-r from-orange-50/50 to-pink-50/50 border shadow-sm">
              <CardHeader>
                <CardTitle>Trip Expense Estimator</CardTitle>
                <CardDescription>Estimate and track expenses for your {type}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Number of Travelers</Label>
                      <Input type="number" min="1" defaultValue="2" />
                    </div>
                    <div className="space-y-2">
                      <Label>Number of Days</Label>
                      <Input
                        type="number"
                        min="1"
                        value={
                          endDate && startDate
                            ? Math.max(
                                1,
                                Math.ceil(
                                  (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24),
                                ),
                              )
                            : 1
                        }
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                      <option value="USD">$ USD</option>
                      <option value="EUR">€ EUR</option>
                      <option value="GBP">£ GBP</option>
                      <option value="JPY">¥ JPY</option>
                    </select>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <h4 className="font-medium">Expense Categories</h4>
                      <h4 className="font-medium">Summary</h4>
                    </div>

                    {["Accommodation", "Transportation", "Food & Dining", "Activities", "Other"].map((category) => {
                      const categoryTotal = expenses
                        .filter((expense) => expense.category === category)
                        .reduce((sum, expense) => sum + (expense.amount || 0), 0)

                      return (
                        <div key={category} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <Label className="text-sm">{category}</Label>
                              <div className="w-full bg-gray-200 h-2 rounded-full mt-1">
                                <div
                                  className="bg-gradient-to-r from-orange-500 to-pink-500 h-2 rounded-full"
                                  style={{ width: `${Math.min(100, (categoryTotal / totalExpenses) * 100)}%` }}
                                ></div>
                              </div>
                            </div>
                            <div className="ml-4 text-right">
                              <span className="font-medium">${categoryTotal.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    <Separator />

                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>${totalExpenses.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Trip Expenses</h4>
                    <p className="text-sm text-muted-foreground">Track actual costs over your group</p>

                    {expenses.map((expense) => (
                      <div
                        key={expense.id}
                        className="flex justify-between items-center p-3 border rounded-lg bg-white"
                      >
                        <div>
                          <p className="font-medium">{expense.name}</p>
                          <p className="text-sm text-muted-foreground">Paid by {expense.paidBy}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${expense.amount.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">${(expense.amount / 2).toFixed(2)} per person</p>
                        </div>
                      </div>
                    ))}

                    <Button
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      onClick={addExpense}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Expense
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="photos" className="space-y-6 mt-6">
            <Card className="bg-gradient-to-r from-orange-50/50 to-pink-50/50 border shadow-sm">
              <CardHeader>
                <CardTitle>Trip Photos</CardTitle>
                <CardDescription>Add photos to showcase your trip</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex space-x-4 mb-4">
                    <Button variant="outline" className="flex-1">
                      <Camera className="mr-2 h-4 w-4" />
                      Gallery
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <PanelLeft className="mr-2 h-4 w-4" />
                      Timeline
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5].map((_, i) => (
                      <div key={i} className="aspect-square bg-muted rounded-md flex items-center justify-center">
                        <Camera className="h-8 w-8 text-muted-foreground" />
                      </div>
                    ))}
                    <div className="aspect-square border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50">
                      <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-xs text-muted-foreground">Add more photos</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="bg-gradient-to-r from-orange-50/50 to-pink-50/50 border shadow-sm mb-8">
          <CardHeader>
            <CardTitle>Customize Appearance</CardTitle>
            <CardDescription>Personalize the look and feel of your itinerary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-4 border">
                <h3 className="text-lg font-bold text-center mb-2">Preview</h3>
                <div
                  className={`rounded-lg overflow-hidden aspect-video flex items-center justify-center p-6 ${
                    selectedBackground === "gradient"
                      ? "bg-gradient-to-r from-orange-200 to-pink-200"
                      : selectedBackground === "image"
                        ? "bg-[url(/placeholder.svg)]"
                        : "bg-white"
                  }`}
                  style={{ fontFamily: getFontFamily(selectedFont) }}
                >
                  <div className="text-center">
                    <h2 className="text-xl font-bold">{title || "Weekend in NYC"}</h2>
                    <p className="text-sm flex items-center justify-center gap-2">
                      <ThemeIcon theme={selectedTheme} />
                      <span>
                        {startDate && endDate
                          ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
                          : "May 15-16, 2023"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 mb-4">
                <Button
                  variant="outline"
                  className={`flex-1 ${selectedBackground === "gradient" ? "border-orange-500 bg-orange-50" : ""}`}
                  onClick={() => setSelectedBackground("gradient")}
                >
                  <div className="w-4 h-4 rounded-full bg-gradient-to-r from-orange-400 to-pink-400 mr-2" />
                  Gradient
                </Button>
                <Button
                  variant="outline"
                  className={`flex-1 ${selectedBackground === "image" ? "border-orange-500 bg-orange-50" : ""}`}
                  onClick={() => setSelectedBackground("image")}
                >
                  <Image className="mr-2 h-4 w-4" />
                  Image
                </Button>
                <Button
                  variant="outline"
                  className={`flex-1 ${selectedBackground === "solid" ? "border-orange-500 bg-orange-50" : ""}`}
                  onClick={() => setSelectedBackground("solid")}
                >
                  <div className="w-4 h-4 rounded-full bg-white border mr-2" />
                  Solid Color
                </Button>
              </div>

              <div>
                <Label className="mb-2 block">Select Background</Label>
                <div className="grid grid-cols-4 gap-2">
                  <div className="aspect-square rounded-md bg-gradient-to-r from-orange-200 to-pink-200 cursor-pointer border-2 border-orange-500" />
                  <div className="aspect-square rounded-md bg-gradient-to-r from-blue-200 to-cyan-200 cursor-pointer" />
                  <div className="aspect-square rounded-md bg-gradient-to-r from-green-200 to-teal-200 cursor-pointer" />
                  <div className="aspect-square rounded-md bg-gradient-to-r from-purple-200 to-indigo-200 cursor-pointer" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <ThemeSelector
                  value={selectedTheme}
                  onChange={setSelectedTheme}
                  showLabel={true}
                />
                <FontSelector
                  value={selectedFont}
                  onChange={setSelectedFont}
                  showLabel={true}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between gap-4 mb-8">
          <Button variant="outline" className="bg-white" onClick={() => router.back()} disabled={isSubmitting || isSaving}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex gap-4">
            <Button variant="outline" className="bg-white" onClick={handleSaveDraft} disabled={isSubmitting || isSaving}>
              {isSaving ? "Saving..." : "Save as Draft"}
            </Button>
            <Button className="btn-sunset" onClick={handlePublish} disabled={isSubmitting || isSaving}>
              {isSubmitting ? "Publishing..." : `Publish ${type === "event" ? "Event" : "Trip"}`}
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <EventPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        draft={{
          id: draftId || undefined,
          title,
          description,
          location,
          start_date: startDate || new Date().toISOString().split("T")[0],
          end_date: endDate || startDate || new Date().toISOString().split("T")[0],
          type,
          is_public: isPublic,
          activities,
          collaborators,
          packing_items: packingItems,
          expenses,
          photos,
          discussions,
          image_url: coverImageUrl,
        }}
      />
    </div>
  )
}
