"use client"

import { useRouter } from "next/navigation"
import { Heart, MessageCircle, Bookmark, Sparkles, Users } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type PromptReason = "like" | "comment" | "save" | "limit_reached" | "general"

interface SignupPromptDialogProps {
  isOpen: boolean
  onClose: () => void
  reason?: PromptReason
}

const reasonContent: Record<PromptReason, { icon: React.ReactNode; title: string; description: string }> = {
  like: {
    icon: <Heart className="h-8 w-8 text-red-500" />,
    title: "Like this itinerary?",
    description: "Sign up to like itineraries and show your appreciation for great travel plans!",
  },
  comment: {
    icon: <MessageCircle className="h-8 w-8 text-blue-500" />,
    title: "Want to join the conversation?",
    description: "Sign up to comment on itineraries and connect with other travelers!",
  },
  save: {
    icon: <Bookmark className="h-8 w-8 text-purple-500" />,
    title: "Save for later?",
    description: "Sign up to save itineraries and build your collection of travel inspiration!",
  },
  limit_reached: {
    icon: <Sparkles className="h-8 w-8 text-orange-500" />,
    title: "You've seen some great itineraries!",
    description: "Sign up to continue exploring unlimited itineraries, create your own, and connect with travelers worldwide!",
  },
  general: {
    icon: <Users className="h-8 w-8 text-green-500" />,
    title: "Join Tinerary",
    description: "Sign up to unlock the full experience - create itineraries, connect with travelers, and plan amazing trips!",
  },
}

export function SignupPromptDialog({ isOpen, onClose, reason = "general" }: SignupPromptDialogProps) {
  const router = useRouter()
  const content = reasonContent[reason]

  const handleSignUp = () => {
    router.push("/auth?tab=signup")
    onClose()
  }

  const handleSignIn = () => {
    router.push("/auth")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-orange-100 to-purple-100 flex items-center justify-center">
            {content.icon}
          </div>
          <DialogTitle className="text-xl">{content.title}</DialogTitle>
          <DialogDescription className="text-center">
            {content.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Benefits list */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-sm mb-3">What you get with an account:</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Create and share your own itineraries
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Save and organize travel inspiration
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Connect with fellow travelers
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Get personalized recommendations
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={handleSignUp} className="w-full bg-orange-500 hover:bg-orange-600">
              Sign Up Free
            </Button>
            <Button variant="outline" onClick={handleSignIn} className="w-full">
              Already have an account? Sign In
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
