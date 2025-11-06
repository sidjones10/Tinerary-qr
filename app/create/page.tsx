"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Calendar, MapPin, Clock, Plus, Lightbulb, Upload, X, Trash2, Users, Mail } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/providers/auth-provider"
import { ProtectedRoute } from "@/components/protected-route"
import { Navbar } from "@/components/navbar"
import { createItinerary } from "@/lib/itinerary-service"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { EventPreviewModal } from "@/components/event-preview-modal"

export default function CreatePage() {
  return (
    <ProtectedRoute>
      <Navbar />
      <CreatePageContent />
    </ProtectedRoute>
  )
}

function CreatePageContent() {
  const [type, setType] = useState<"event" | "trip">("event")
  const [activeTab, setActiveTab] = useState("details")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [time, setTime] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  const [activities, setActivities] = useState([
    { title: "", location: "", time: "", description: "", requireRsvp: false },
  ])
  const [showPackingExpenses, setShowPackingExpenses] = useState(false)
  const [packingItems, setPackingItems] = useState([
    { name: "Clothes", checked: false },
    { name: "Toiletries", checked: false },
    { name: "Electronics", checked: false },
  ])
  const [expenses, setExpenses] = useState([
    { category: "Accommodation", amount: 0 },
    { category: "Transportation", amount: 0 },
    { category: "Food", amount: 0 },
  ])
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [inviteEmails, setInviteEmails] = useState<string[]>([])
  const [newInviteEmail, setNewInviteEmail] = useState("")
  const [splitCount, setSplitCount] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [draftId, setDraftId] = useState<string | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { user } = useAuth()

  const supabase = createClient()

  // Load draft if draftId is provided in URL
  useEffect(() => {
    const loadDraft = async () => {
      const draftIdFromUrl = searchParams?.get("draftId")
      if (draftIdFromUrl && user) {
        try {
          const { data, error } = await supabase
            .from("drafts")
            .select("*")
            .eq("id", draftIdFromUrl)
            .eq("user_id", user.id)
            .single()

          if (error) throw error
          if (data) {
            setDraftId(draftIdFromUrl)
            setTitle(data.title || "")
            setDescription(data.description || "")
            setLocation(data.location || "")
            setStartDate(data.start_date || "")
            setEndDate(data.end_date || "")
            setType(data.type || "event")
            setIsPublic(data.is_public !== undefined ? data.is_public : true)

            if (data.activities && data.activities.length > 0) {
              setActivities(data.activities)
            }

            if (data.packing_items && data.packing_items.length > 0) {
              setPackingItems(data.packing_items)
              setShowPackingExpenses(true)
            }

            if (data.expenses && data.expenses.length > 0) {
              setExpenses(data.expenses)
              setShowPackingExpenses(true)
            }

            toast({
              title: "Draft loaded",
              description: "Your draft has been loaded successfully.",
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

  const handleSaveDraft = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to save a draft",
        variant: "destructive",
      })
      return
    }

    if (!title) {
      toast({
        title: "Missing information",
        description: "Please provide at least a title for your draft",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const draftData = {
        title,
        description,
        location,
        start_date: startDate || new Date().toISOString().split("T")[0],
        end_date: endDate || startDate || new Date().toISOString().split("T")[0],
        type,
        is_public: isPublic,
        activities,
        packing_items: showPackingExpenses ? packingItems : [],
        expenses: showPackingExpenses ? expenses : [],
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      let response

      if (draftId) {
        // Update existing draft
        response = await supabase.from("drafts").update(draftData).eq("id", draftId).select()
      } else {
        // Create new draft
        response = await supabase.from("drafts").insert([draftData]).select()
      }

      if (response.error) throw response.error

      if (response.data && response.data[0]) {
        if (!draftId) {
          setDraftId(response.data[0].id)
          // Update URL with draft ID without navigation
          const url = new URL(window.location.href)
          url.searchParams.set("draftId", response.data[0].id)
          window.history.replaceState({}, "", url.toString())
        }

        toast({
          title: "Draft Saved",
          description: `Your ${type} has been saved as a draft.`,
        })
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
      // Format dates properly
      const formattedStartDate = startDate || new Date().toISOString().split("T")[0]
      const formattedEndDate = endDate || formattedStartDate

      // Use the enhanced itinerary service
      const result = await createItinerary(user.id, {
        title,
        description,
        location,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        type,
        isPublic,
        activities: activities.filter((a) => a.title),
        packingItems: showPackingExpenses ? packingItems : [],
        expenses: showPackingExpenses ? expenses.filter((e) => e.amount > 0) : [],
        imageUrl: coverImage,
      })

      if (!result.success || !result.itinerary) {
        throw new Error(result.error || "Failed to create itinerary")
      }

      const itineraryId = result.itinerary.id

      // Send invitations if there are any
      if (inviteEmails.length > 0) {
        try {
          const inviteResponse = await fetch("/api/invitations/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              itineraryId,
              emails: inviteEmails,
              itineraryTitle: title,
              senderName: user.user_metadata?.name || user.email?.split("@")[0] || "Someone",
            }),
          })

          if (!inviteResponse.ok) {
            console.error("Failed to send invitations")
          }
        } catch (inviteError) {
          console.error("Error sending invitations:", inviteError)
          // Don't fail the whole operation if invitations fail
        }
      }

      // Delete the draft if it exists
      if (draftId) {
        await supabase.from("drafts").delete().eq("id", draftId)
      }

      toast({
        title: "Success!",
        description: `Your ${type} has been published${inviteEmails.length > 0 ? " and invitations sent" : ""}.`,
      })

      // Redirect to the event page
      router.push(`/event/${itineraryId}`)
    } catch (error: any) {
      console.error("Error publishing:", error)
      toast({
        title: "Error",
        description: error.message || "There was a problem publishing your " + type,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const addActivity = () => {
    setActivities([...activities, { title: "", location: "", time: "", description: "", requireRsvp: false }])
  }

  const updateActivity = (index: number, field: string, value: any) => {
    const updatedActivities = [...activities]
    updatedActivities[index] = { ...updatedActivities[index], [field]: value }
    setActivities(updatedActivities)
  }

  const removeActivity = (index: number) => {
    setActivities(activities.filter((_, i) => i !== index))
  }

  const addPackingItem = () => {
    setPackingItems([...packingItems, { name: "", checked: false }])
  }

  const updatePackingItem = (index: number, field: string, value: any) => {
    const updatedItems = [...packingItems]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setPackingItems(updatedItems)
  }

  const addExpense = () => {
    setExpenses([...expenses, { category: "", amount: 0 }])
  }

  const updateExpense = (index: number, field: string, value: any) => {
    const updatedExpenses = [...expenses]
    updatedExpenses[index] = { ...updatedExpenses[index], [field]: value }
    setExpenses(updatedExpenses)
  }

  const removeExpense = (index: number) => {
    setExpenses(expenses.filter((_, i) => i !== index))
  }

  const removePackingItem = (index: number) => {
    setPackingItems(packingItems.filter((_, i) => i !== index))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file",
        variant: "destructive",
      })
      return
    }

    setUploadingImage(true)

    try {
      // Convert image to base64 for now (temporary solution until storage bucket is created)
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setCoverImage(base64String)

        toast({
          title: "Image uploaded",
          description: "Cover image has been uploaded successfully",
        })
        setUploadingImage(false)
      }
      reader.onerror = () => {
        toast({
          title: "Upload failed",
          description: "Failed to read image file",
          variant: "destructive",
        })
        setUploadingImage(false)
      }
      reader.readAsDataURL(file)
    } catch (error: any) {
      console.error("Error uploading image:", error)
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      })
      setUploadingImage(false)
    }
  }

  const addInviteEmail = () => {
    if (!newInviteEmail) return

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newInviteEmail)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      })
      return
    }

    if (inviteEmails.includes(newInviteEmail)) {
      toast({
        title: "Already added",
        description: "This email is already in the invite list",
        variant: "destructive",
      })
      return
    }

    setInviteEmails([...inviteEmails, newInviteEmail])
    setNewInviteEmail("")
  }

  const removeInviteEmail = (email: string) => {
    setInviteEmails(inviteEmails.filter((e) => e !== email))
  }

  const calculateSplitAmount = () => {
    const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)
    return splitCount > 0 ? (totalExpenses / splitCount).toFixed(2) : "0.00"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container px-4 py-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">Create New</h1>

          {/* Type Selection */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-2">What are you creating?</h2>
            <p className="text-sm text-muted-foreground mb-4">Choose the type of plan you want to create</p>

            <div className="grid grid-cols-2 gap-4">
              <div
                className={`cursor-pointer rounded-lg border-2 p-4 flex flex-col items-center ${type === "event" ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-gray-300"}`}
                onClick={() => setType("event")}
              >
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                  <Calendar className="h-6 w-6 text-purple-500" />
                </div>
                <h3 className="font-medium">Single Event</h3>
                <p className="text-xs text-muted-foreground text-center">Party, concert, dinner, etc.</p>
              </div>

              <div
                className={`cursor-pointer rounded-lg border-2 p-4 flex flex-col items-center ${type === "trip" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
                onClick={() => setType("trip")}
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                  <MapPin className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="font-medium">Multi-Day Trip</h3>
                <p className="text-xs text-muted-foreground text-center">Travel, vacation, weekend getaway</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
            <div className="flex border-b">
              <button
                className={`px-4 py-3 text-sm font-medium flex-1 ${activeTab === "details" ? "text-purple-600 border-b-2 border-purple-600" : "text-gray-600 hover:text-gray-900"}`}
                onClick={() => setActiveTab("details")}
              >
                Details
              </button>
              <button
                className={`px-4 py-3 text-sm font-medium flex-1 ${activeTab === "activities" ? "text-purple-600 border-b-2 border-purple-600" : "text-gray-600 hover:text-gray-900"}`}
                onClick={() => setActiveTab("activities")}
              >
                {type === "trip" ? "Stops" : "Activities"}
              </button>
              <button
                className={`px-4 py-3 text-sm font-medium flex-1 ${activeTab === "packing" ? "text-purple-600 border-b-2 border-purple-600" : "text-gray-600 hover:text-gray-900"}`}
                onClick={() => setActiveTab("packing")}
              >
                Packing & Expenses
              </button>
              <button
                className={`px-4 py-3 text-sm font-medium flex-1 ${activeTab === "people" ? "text-purple-600 border-b-2 border-purple-600" : "text-gray-600 hover:text-gray-900"}`}
                onClick={() => setActiveTab("people")}
              >
                People
              </button>
              <button
                className={`px-4 py-3 text-sm font-medium flex-1 ${activeTab === "settings" ? "text-purple-600 border-b-2 border-purple-600" : "text-gray-600 hover:text-gray-900"}`}
                onClick={() => setActiveTab("settings")}
              >
                Settings
              </button>
            </div>

            {/* Details Tab */}
            {activeTab === "details" && (
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-2">Basic Details</h2>
                  <p className="text-sm text-muted-foreground mb-4">Set the main information for your {type}</p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Title</label>
                      <Input
                        placeholder={type === "event" ? "Birthday Party" : "Weekend in NYC"}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Location</label>
                      <div className="flex items-center border rounded-md">
                        <MapPin className="ml-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Enter location"
                          className="border-0"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                        />
                      </div>
                    </div>

                    {type === "event" ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Date</label>
                          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Time</label>
                          <div className="flex items-center border rounded-md">
                            <Clock className="ml-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="7:00 PM"
                              className="border-0"
                              value={time}
                              onChange={(e) => setTime(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Start Date</label>
                          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">End Date</label>
                          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <Textarea
                        placeholder={type === "event" ? "Details about your event" : "What's this trip all about?"}
                        className="min-h-[100px]"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Cover Image</label>
                      {coverImage ? (
                        <div className="relative">
                          <img src={coverImage} alt="Cover" className="w-full h-48 object-cover rounded-lg" />
                          <button
                            type="button"
                            onClick={() => setCoverImage(null)}
                            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed rounded-lg p-6 text-center">
                          <input
                            type="file"
                            id="cover-image"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                            disabled={uploadingImage}
                          />
                          <label htmlFor="cover-image" className="cursor-pointer">
                            <div className="mx-auto w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-2">
                              {uploadingImage ? (
                                <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                              ) : (
                                <Upload className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              {uploadingImage ? "Uploading..." : "Click to upload an image"}
                            </p>
                            <p className="text-xs text-muted-foreground">Recommended size: 1200 x 800 pixels</p>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    className="bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100"
                  >
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Get AI Recommendations
                  </Button>
                </div>
              </div>
            )}

            {/* Activities/Stops Tab */}
            {activeTab === "activities" && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-lg font-semibold">{type === "trip" ? "Trip Stops" : "Event Schedule"}</h2>
                    <p className="text-sm text-muted-foreground">
                      {type === "trip" ? "Plan your stops day by day" : "Add activities to your event schedule"}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={addActivity} className="bg-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add {type === "trip" ? "Stop" : "Activity"}
                  </Button>
                </div>

                {type === "trip" && (
                  <div className="flex items-center p-2 bg-blue-50 rounded-lg mb-4">
                    <Lightbulb className="h-5 w-5 text-blue-500 mr-2" />
                    <p className="text-sm text-blue-700">
                      Pro tip: Organize your activities by day to create a clear itinerary
                    </p>
                  </div>
                )}

                {activities.map((activity, index) => (
                  <div key={index} className="mb-4 border rounded-lg p-4 bg-white">
                    {type === "trip" && (
                      <div className="mb-3">
                        <label className="block text-sm font-medium mb-1">Day</label>
                        <select className="w-full h-10 px-3 py-2 text-sm rounded-md border border-input bg-background">
                          <option value="">Select day...</option>
                          <option value="Day 1">Day 1</option>
                          <option value="Day 2">Day 2</option>
                          <option value="Day 3">Day 3</option>
                          <option value="Day 4">Day 4</option>
                          <option value="Day 5">Day 5</option>
                          <option value="Any day">Any day</option>
                          <option value="Flexible">Flexible</option>
                        </select>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          {type === "trip" ? "Stop Name" : "Activity Name"}
                        </label>
                        <Input
                          placeholder={type === "trip" ? "Visit Museum" : "Dinner at Restaurant"}
                          value={activity.title}
                          onChange={(e) => updateActivity(index, "title", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Time</label>
                        <div className="flex items-center border rounded-md">
                          <Clock className="ml-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="7:00 PM"
                            className="border-0"
                            value={activity.time}
                            onChange={(e) => updateActivity(index, "time", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-1">Location</label>
                      <div className="flex items-center border rounded-md">
                        <MapPin className="ml-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Enter location"
                          className="border-0"
                          value={activity.location}
                          onChange={(e) => updateActivity(index, "location", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <Textarea
                        placeholder="Details about this activity..."
                        value={activity.description}
                        onChange={(e) => updateActivity(index, "description", e.target.value)}
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`rsvp-${index}`}
                        className="mr-2"
                        checked={activity.requireRsvp}
                        onChange={(e) => updateActivity(index, "requireRsvp", e.target.checked)}
                      />
                      <label htmlFor={`rsvp-${index}`} className="text-sm">
                        Require RSVP for this {type === "trip" ? "stop" : "activity"}
                      </label>
                    </div>

                    {activities.length > 1 && (
                      <div className="mt-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeActivity(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Packing & Expenses Tab */}
            {activeTab === "packing" && (
              <div className="p-6">
                {type === "event" && (
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg mb-6">
                    <div className="flex items-center">
                      <Lightbulb className="h-5 w-5 text-orange-500 mr-2" />
                      <span className="text-sm font-medium">Include packing list and expenses for this event?</span>
                    </div>
                    <Switch checked={showPackingExpenses} onCheckedChange={setShowPackingExpenses} />
                  </div>
                )}

                {(type === "trip" || showPackingExpenses) && (
                  <>
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold mb-2">Packing List</h2>
                      <p className="text-sm text-muted-foreground mb-4">Keep track of everything you need to bring</p>

                      <div className="space-y-3 mb-4">
                        {packingItems.map((item, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 border rounded-lg bg-white">
                            <input
                              type="checkbox"
                              id={`item-${index}`}
                              className="h-4 w-4"
                              checked={item.checked}
                              onChange={(e) => updatePackingItem(index, "checked", e.target.checked)}
                            />
                            <Input
                              placeholder="Item name (e.g., Passport, Sunscreen)"
                              value={item.name}
                              onChange={(e) => updatePackingItem(index, "name", e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removePackingItem(index)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      <Button variant="outline" size="sm" onClick={addPackingItem} className="bg-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                      </Button>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h2 className="text-lg font-semibold">Expenses</h2>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="text-lg font-bold text-green-600">
                            ${expenses.reduce((sum, e) => sum + (e.amount || 0), 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">Estimate and track expenses for your {type}</p>

                      <div className="space-y-3 mb-4">
                        {expenses.map((expense, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 border rounded-lg bg-white">
                            <Input
                              placeholder="Category (e.g., Hotel, Food)"
                              value={expense.category}
                              onChange={(e) => updateExpense(index, "category", e.target.value)}
                              className="flex-1"
                            />
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-medium">$</span>
                              <Input
                                type="number"
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                className="w-28"
                                value={expense.amount || ""}
                                onChange={(e) => updateExpense(index, "amount", Number.parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeExpense(index)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      <Button variant="outline" size="sm" onClick={addExpense} className="bg-white mb-6">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Expense
                      </Button>

                      {/* Expense Splitting Calculator */}
                      <div className="border-t pt-6 mt-6">
                        <h3 className="text-md font-semibold mb-3">Split Expenses</h3>
                        <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                          <div className="flex-1">
                            <Label htmlFor="split-count" className="text-sm mb-2 block">
                              Number of people
                            </Label>
                            <Input
                              id="split-count"
                              type="number"
                              min="1"
                              value={splitCount}
                              onChange={(e) => setSplitCount(Number.parseInt(e.target.value) || 1)}
                              className="w-24 bg-white"
                            />
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground mb-1">Per person</p>
                            <p className="text-2xl font-bold text-blue-600">${calculateSplitAmount()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* People Tab */}
            {activeTab === "people" && (
              <div className="p-6">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="h-5 w-5 text-purple-600" />
                    <h2 className="text-lg font-semibold">Invite People</h2>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Invite collaborators or guests to your {type}. They'll receive a notification or email invitation.
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Input
                        type="email"
                        placeholder="Enter email address"
                        value={newInviteEmail}
                        onChange={(e) => setNewInviteEmail(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            addInviteEmail()
                          }
                        }}
                        className="flex-1"
                      />
                      <Button type="button" onClick={addInviteEmail} className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>

                    {inviteEmails.length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-sm font-medium mb-2">Invited ({inviteEmails.length})</h3>
                        <div className="space-y-2">
                          {inviteEmails.map((email, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg"
                            >
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-purple-600" />
                                <span className="text-sm">{email}</span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeInviteEmail(email)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                      <div className="flex gap-2">
                        <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-900 mb-1">How invitations work</p>
                          <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                            <li>Users with accounts receive an in-app notification</li>
                            <li>New users receive an email invitation to sign up</li>
                            <li>Invitations are sent when you publish your {type}</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-2">Privacy Settings</h2>
                <p className="text-sm text-muted-foreground mb-4">Control who can see and join your {type}</p>

                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-medium">Public Visibility</h3>
                    <p className="text-sm text-muted-foreground">
                      Make this {type} visible to everyone in the "For You" feed
                    </p>
                  </div>
                  <Switch checked={isPublic} onCheckedChange={setIsPublic} />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mb-8">
            <Button variant="outline" onClick={handleSaveDraft} disabled={isSubmitting || isSaving}>
              {isSaving ? "Saving..." : "Save as Draft"}
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={handlePublish}
              disabled={isSubmitting || isSaving}
            >
              {isSubmitting ? "Publishing..." : `Publish ${type}`}
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
          packing_items: packingItems,
          expenses,
        }}
      />
    </div>
  )
}
