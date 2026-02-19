"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { UserPlus, UserMinus, Loader2 } from "lucide-react"
import { toggleFollow, isFollowing } from "@/lib/follow-service"
import { useAuth } from "@/providers/auth-provider"
import { useToast } from "@/components/ui/use-toast"
import confetti from "canvas-confetti"

interface FollowButtonProps {
  userId: string
  onFollowChange?: (isFollowing: boolean) => void
  size?: "sm" | "default" | "lg"
  variant?: "default" | "outline" | "ghost"
  showIcon?: boolean
  className?: string
}

export function FollowButton({
  userId,
  onFollowChange,
  size = "default",
  variant = "default",
  showIcon = true,
  className = "",
}: FollowButtonProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Check initial follow status
  useEffect(() => {
    const checkStatus = async () => {
      if (!user?.id || user.id === userId) {
        setLoading(false)
        return
      }

      const result = await isFollowing(user.id, userId)
      if (result.success) {
        setFollowing(result.isFollowing || false)
      }
      setLoading(false)
    }

    checkStatus()
  }, [user?.id, userId])

  const handleToggle = async () => {
    if (!user?.id) {
      toast({
        title: "Sign in required",
        description: "Please sign in to follow users",
        variant: "destructive",
      })
      return
    }

    setActionLoading(true)

    const result = await toggleFollow(user.id, userId)

    if (result.success) {
      const newFollowingStatus = result.isFollowing || false
      setFollowing(newFollowingStatus)

      // Celebrate when following someone new!
      if (newFollowingStatus) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#F97316', '#EC4899', '#8B5CF6'],
        })
      }

      toast({
        title: newFollowingStatus ? "Following!" : "Unfollowed",
        description: newFollowingStatus
          ? "You'll see their posts in your feed"
          : "You won't see their posts in your feed anymore",
      })

      onFollowChange?.(newFollowingStatus)
    } else {
      toast({
        title: "Error",
        description: result.error || "Something went wrong",
        variant: "destructive",
      })
    }

    setActionLoading(false)
  }

  // Don't show for own profile
  if (user?.id === userId) {
    return null
  }

  // Loading state
  if (loading) {
    return (
      <Button variant={variant} size={size} disabled className={className}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    )
  }

  return (
    <Button
      variant={following ? "outline" : variant}
      size={size}
      onClick={handleToggle}
      disabled={actionLoading}
      className={`transition-all ${
        following
          ? "border-gray-300 dark:border-border hover:border-red-300 hover:text-red-600"
          : "bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white"
      } ${className}`}
    >
      {actionLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          {showIcon && (
            <>
              {following ? (
                <UserMinus className="h-4 w-4 mr-2" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
            </>
          )}
          {following ? "Following" : "Follow"}
        </>
      )}
    </Button>
  )
}
