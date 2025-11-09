"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Calendar, Users, Heart, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/lib/supabase/client"

interface OnboardingFlowProps {
  userId: string
  userName?: string
  onComplete: () => void
}

export function OnboardingFlow({ userId, userName, onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const router = useRouter()

  const steps = [
    {
      title: `Welcome to Tinerary, ${userName || "traveler"}! 🎉`,
      description: "Plan trips, share itineraries, and discover amazing destinations with friends.",
      content: (
        <div className="space-y-6 py-6">
          <div className="grid gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-blue-100 p-3">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Create Itineraries</h3>
                <p className="text-sm text-muted-foreground">
                  Build detailed day-by-day plans with activities, locations, and times
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-full bg-pink-100 p-3">
                <Users className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <h3 className="font-semibold">Collaborate with Friends</h3>
                <p className="text-sm text-muted-foreground">
                  Invite friends, share packing lists, and split expenses together
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-full bg-orange-100 p-3">
                <Heart className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold">Discover & Get Inspired</h3>
                <p className="text-sm text-muted-foreground">
                  Explore public itineraries and save your favorites
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "What type of trips do you enjoy?",
      description: "Select your interests so we can personalize your feed",
      content: (
        <div className="space-y-4 py-6">
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: "beach", label: "🏖️ Beach & Coastal", emoji: "🏖️" },
              { id: "city", label: "🏙️ City Exploration", emoji: "🏙️" },
              { id: "nature", label: "🏔️ Nature & Hiking", emoji: "🏔️" },
              { id: "adventure", label: "🎒 Adventure Sports", emoji: "🎒" },
              { id: "culture", label: "🏛️ Culture & History", emoji: "🏛️" },
              { id: "food", label: "🍜 Food & Culinary", emoji: "🍜" },
              { id: "relaxation", label: "🧘 Wellness & Spa", emoji: "🧘" },
              { id: "winter", label: "❄️ Winter Sports", emoji: "❄️" },
            ].map((interest) => (
              <Card
                key={interest.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedInterests.includes(interest.id)
                    ? "ring-2 ring-primary bg-primary/5"
                    : ""
                }`}
                onClick={() => {
                  setSelectedInterests((prev) =>
                    prev.includes(interest.id)
                      ? prev.filter((i) => i !== interest.id)
                      : [...prev, interest.id]
                  )
                }}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-3xl mb-2">{interest.emoji}</div>
                  <p className="text-sm font-medium">{interest.label.replace(interest.emoji + " ", "")}</p>
                  {selectedInterests.includes(interest.id) && (
                    <Check className="h-4 w-4 text-primary mx-auto mt-2" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "Ready to plan your first trip?",
      description: "Start creating your first itinerary or explore what others have planned",
      content: (
        <div className="space-y-4 py-6">
          <Card
            className="cursor-pointer transition-all hover:shadow-lg border-2 border-primary/20 hover:border-primary"
            onClick={() => {
              saveOnboardingProgress()
              router.push("/create")
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-gradient-to-r from-orange-400 to-pink-500 p-4">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Create Your First Itinerary</h3>
                  <p className="text-sm text-muted-foreground">
                    Start planning your next adventure from scratch
                  </p>
                </div>
                <ArrowRight className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-all hover:shadow-lg border-2 hover:border-primary/50"
            onClick={() => {
              saveOnboardingProgress()
              router.push("/app")
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-gradient-to-r from-blue-400 to-purple-500 p-4">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Explore Public Itineraries</h3>
                  <p className="text-sm text-muted-foreground">
                    Get inspired by trips from the community
                  </p>
                </div>
                <ArrowRight className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },
  ]

  const saveOnboardingProgress = async () => {
    const supabase = createClient()

    // Save user interests to profile
    if (selectedInterests.length > 0) {
      await supabase
        .from("profiles")
        .update({
          interests: selectedInterests,
          onboarding_completed: true,
        })
        .eq("id", userId)
    } else {
      await supabase
        .from("profiles")
        .update({
          onboarding_completed: true,
        })
        .eq("id", userId)
    }
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      saveOnboardingProgress()
      onComplete()
    }
  }

  const handleSkip = () => {
    saveOnboardingProgress()
    onComplete()
  }

  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center justify-between mb-4">
            <DialogTitle className="text-2xl">{steps[currentStep].title}</DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              <X className="h-4 w-4 mr-1" />
              Skip
            </Button>
          </div>
          <p className="text-muted-foreground">{steps[currentStep].description}</p>
        </DialogHeader>

        <Progress value={progress} className="mb-4" />

        <div className="min-h-[300px]">{steps[currentStep].content}</div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </div>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                Back
              </Button>
            )}

            <Button onClick={handleNext} className="bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600">
              {currentStep === steps.length - 1 ? (
                "Get Started"
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
