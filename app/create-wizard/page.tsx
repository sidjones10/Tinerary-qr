"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/auth-provider"
import { ProtectedRoute } from "@/components/protected-route"
import { Navbar } from "@/components/navbar"
import { Wizard, type WizardStep } from "@/components/wizard"
import { StepBasics } from "@/components/create-wizard/step-basics"
import { StepLocation } from "@/components/create-wizard/step-location"
import { StepDetails } from "@/components/create-wizard/step-details"
import { StepPreview } from "@/components/create-wizard/step-preview"
import { createItinerary } from "@/lib/itinerary-service"
import { useToast } from "@/components/ui/use-toast"
import confetti from "canvas-confetti"
import { Calendar, MapPin, FileText, Eye } from "lucide-react"

export interface CreateFormData {
  title: string
  type: "event" | "trip"
  startDate: string
  endDate: string
  location: string
  description: string
  coverImage: string | null
  isPublic: boolean
  activities: Array<{
    title: string
    location: string
    time: string
    description: string
    day: string
  }>
}

export default function CreateWizardPage() {
  return (
    <ProtectedRoute>
      <Navbar />
      <CreateWizardContent />
    </ProtectedRoute>
  )
}

function CreateWizardContent() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState<CreateFormData>({
    title: "",
    type: "event",
    startDate: "",
    endDate: "",
    location: "",
    description: "",
    coverImage: null,
    isPublic: true,
    activities: [],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (field: keyof CreateFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateBasics = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = "Title is required"
    }

    if (!formData.startDate) {
      newErrors.startDate = "Start date is required"
    }

    if (!formData.endDate) {
      newErrors.endDate = "End date is required"
    }

    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = "End date must be after start date"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateLocation = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.location.trim()) {
      newErrors.location = "Location is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleComplete = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to create an event",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createItinerary({
        userId: user.id,
        title: formData.title,
        description: formData.description,
        location: formData.location,
        startDate: formData.startDate,
        endDate: formData.endDate,
        type: formData.type,
        isPublic: formData.isPublic,
        imageUrl: formData.coverImage || undefined,
        activities: formData.activities,
      })

      if (result.success && result.itinerary) {
        // Celebrate with confetti!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#F97316", "#EC4899", "#8B5CF6"],
        })

        toast({
          title: "Success!",
          description: `Your ${formData.type} has been published!`,
        })

        // Navigate to the new event
        router.push(`/event/${result.itinerary.id}`)
      } else {
        throw new Error(result.error || "Failed to create event")
      }
    } catch (error: any) {
      console.error("Error creating event:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create event",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const steps: WizardStep[] = [
    {
      id: "basics",
      title: "Basics",
      description: "What are you planning?",
      icon: <Calendar className="h-5 w-5" />,
      component: <StepBasics formData={formData} onChange={handleChange} errors={errors} />,
      validate: validateBasics,
    },
    {
      id: "location",
      title: "Location",
      description: "Where will it be?",
      icon: <MapPin className="h-5 w-5" />,
      component: <StepLocation formData={formData} onChange={handleChange} errors={errors} />,
      validate: validateLocation,
    },
    {
      id: "details",
      title: "Details",
      description: "Add more information",
      icon: <FileText className="h-5 w-5" />,
      component: <StepDetails formData={formData} onChange={handleChange} errors={errors} />,
      optional: true,
    },
    {
      id: "preview",
      title: "Preview",
      description: "Review and publish",
      icon: <Eye className="h-5 w-5" />,
      component: <StepPreview formData={formData} />,
    },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 bg-gradient-to-b from-gray-50 to-white">
        <div className="container px-4 py-6 max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Create New {formData.type === "event" ? "Event" : "Trip"}</h1>
            <p className="text-muted-foreground">Follow the steps below to create your {formData.type}</p>
          </div>

          <Wizard
            steps={steps}
            onComplete={handleComplete}
            onCancel={() => router.push("/profile")}
            submitText={isSubmitting ? "Publishing..." : "Publish"}
            submitDisabled={isSubmitting}
          />
        </div>
      </main>
    </div>
  )
}
