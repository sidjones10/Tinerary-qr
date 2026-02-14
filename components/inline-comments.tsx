"use client"

import { useState, useEffect } from "react"
import { Send, X, Loader2, Trash2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getComments, createComment, deleteComment, type Comment } from "@/lib/comment-service"
import { useAuth } from "@/providers/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"

interface InlineCommentsProps {
  itineraryId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  initialCommentCount?: number
}

export function InlineComments({ itineraryId, open, onOpenChange, initialCommentCount = 0 }: InlineCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [posting, setPosting] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  // Fetch comments when sheet opens
  useEffect(() => {
    if (open) {
      fetchComments()
    }
  }, [open, itineraryId])

  const fetchComments = async () => {
    setLoading(true)
    try {
      const data = await getComments(itineraryId)
      setComments(data)
    } catch (error) {
      console.error("Error fetching comments:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePostComment = async () => {
    if (!user?.id) {
      toast({
        title: "Sign in required",
        description: "Please sign in to post comments",
        variant: "destructive",
      })
      return
    }

    if (!newComment.trim()) {
      return
    }

    setPosting(true)
    try {
      const result = await createComment(itineraryId, user.id, newComment.trim())

      if (result.success && result.comment) {
        // Add the new comment to the top of the list
        setComments([result.comment, ...comments])
        setNewComment("")
        toast({
          title: "Comment posted!",
          description: "Your comment has been added",
        })
      } else {
        toast({
          title: "Failed to post comment",
          description: result.error || "Please try again",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error posting comment:", error)
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      })
    } finally {
      setPosting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!user?.id) return

    try {
      const result = await deleteComment(commentId, user.id)

      if (result.success) {
        setComments(comments.filter((c) => c.id !== commentId))
        toast({
          title: "Comment deleted",
          description: "Your comment has been removed",
        })
      } else {
        toast({
          title: "Failed to delete",
          description: result.error || "Please try again",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting comment:", error)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return "Just now"
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] p-0 rounded-t-3xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-lg font-semibold">
                Comments {comments.length > 0 && `(${comments.length})`}
              </SheetTitle>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} aria-label="Close comments">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </SheetHeader>

          {/* Comments list */}
          <ScrollArea className="flex-1 px-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
              </div>
            ) : comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-gray-400 mb-2">
                  <svg
                    className="w-16 h-16 mx-auto mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">No comments yet</p>
                <p className="text-sm text-gray-400 mt-1">Be the first to share your thoughts!</p>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={comment.user?.avatar_url || undefined} alt={comment.user?.name || "User"} />
                      <AvatarFallback>{comment.user?.name?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-semibold">
                            {comment.user?.name || comment.user?.username || "Anonymous"}
                            <span className="text-xs text-gray-500 font-normal ml-2">
                              {formatTimeAgo(comment.created_at)}
                            </span>
                            {comment.is_edited && (
                              <span className="text-xs text-gray-400 font-normal ml-1">(edited)</span>
                            )}
                          </p>
                          <p className="text-sm text-gray-700 mt-1 break-words">{comment.content}</p>
                        </div>
                        {user?.id === comment.user_id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0"
                            onClick={() => handleDeleteComment(comment.id)}
                            aria-label="Delete comment"
                          >
                            <Trash2 className="h-3 w-3 text-gray-400 hover:text-red-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Comment input */}
          <div className="border-t px-6 py-4 bg-white">
            <div className="flex gap-3 items-end">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={user?.user_metadata?.avatar_url} alt="You" />
                <AvatarFallback>{user?.user_metadata?.name?.[0] || user?.email?.[0] || "Y"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handlePostComment()
                    }
                  }}
                  disabled={posting || !user}
                  className="flex-1"
                />
                <Button
                  onClick={handlePostComment}
                  disabled={posting || !newComment.trim() || !user}
                  size="icon"
                  aria-label="Post comment"
                  className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
                >
                  {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            {!user && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                Sign in to post comments
              </p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
