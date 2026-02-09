"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MessageSquare, Send, Reply, Edit2, Trash2, MoreVertical, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"

interface Comment {
  id: string
  content: string
  created_at: string
  is_edited: boolean
  edited_at: string | null
  user_id: string
  parent_comment_id: string | null
  user: {
    id: string
    name: string | null
    username: string | null
    avatar_url: string | null
  }
  replies?: Comment[]
}

interface CommentsSectionProps {
  itineraryId: string
  currentUserId?: string
  itineraryOwnerId?: string
}

export function CommentsSection({ itineraryId, currentUserId, itineraryOwnerId }: CommentsSectionProps) {
  const router = useRouter()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchComments()

    // Subscribe to real-time comment updates
    const supabase = createClient()
    const channel = supabase
      .channel(`comments:${itineraryId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `itinerary_id=eq.${itineraryId}`,
        },
        () => {
          fetchComments()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [itineraryId])

  const fetchComments = async () => {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          is_edited,
          edited_at,
          user_id,
          parent_comment_id,
          user:profiles(
            id,
            name,
            username,
            avatar_url
          )
        `)
        .eq('itinerary_id', itineraryId)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Organize comments into threads
      const commentMap = new Map<string, Comment>()
      const rootComments: Comment[] = []

      // First pass: create map of all comments
      data?.forEach((comment: any) => {
        commentMap.set(comment.id, { ...comment, replies: [] })
      })

      // Second pass: organize into threads
      data?.forEach((comment: any) => {
        const commentObj = commentMap.get(comment.id)!
        if (comment.parent_comment_id) {
          const parent = commentMap.get(comment.parent_comment_id)
          if (parent) {
            parent.replies = parent.replies || []
            parent.replies.push(commentObj)
          }
        } else {
          rootComments.push(commentObj)
        }
      })

      setComments(rootComments)
    } catch (err: any) {
      console.error('Error fetching comments:', err)
      setError(err.message || 'Failed to load comments')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !currentUserId) return

    setSubmitting(true)
    setError(null)

    // Create optimistic comment for instant display
    const optimisticId = `temp-${Date.now()}`
    const optimisticComment: Comment = {
      id: optimisticId,
      content: newComment.trim(),
      created_at: new Date().toISOString(),
      is_edited: false,
      edited_at: null,
      user_id: currentUserId,
      parent_comment_id: null,
      user: {
        id: currentUserId,
        name: 'You',
        username: null,
        avatar_url: null,
      },
      replies: [],
    }

    // Optimistically add comment to UI
    setComments(prev => [...prev, optimisticComment])
    const savedComment = newComment
    setNewComment('')

    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('comments')
        .insert({
          itinerary_id: itineraryId,
          user_id: currentUserId,
          content: savedComment.trim(),
        })
        .select(`
          id,
          content,
          created_at,
          is_edited,
          edited_at,
          user_id,
          parent_comment_id,
          user:profiles(
            id,
            name,
            username,
            avatar_url
          )
        `)
        .single()

      if (error) throw error

      // Replace optimistic comment with real one
      if (data) {
        setComments(prev => prev.map(c =>
          c.id === optimisticId ? { ...data, replies: [] } : c
        ))
      }

      toast({
        title: 'Comment posted',
        description: 'Your comment has been added successfully.',
      })
    } catch (err: any) {
      console.error('Error posting comment:', err)
      // Remove optimistic comment on error
      setComments(prev => prev.filter(c => c.id !== optimisticId))
      setNewComment(savedComment)
      setError(err.message || 'Failed to post comment')
      toast({
        title: 'Error',
        description: 'Failed to post comment. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim() || !currentUserId) return

    setSubmitting(true)
    setError(null)

    // Create optimistic reply for instant display
    const optimisticId = `temp-${Date.now()}`
    const optimisticReply: Comment = {
      id: optimisticId,
      content: replyContent.trim(),
      created_at: new Date().toISOString(),
      is_edited: false,
      edited_at: null,
      user_id: currentUserId,
      parent_comment_id: parentId,
      user: {
        id: currentUserId,
        name: 'You',
        username: null,
        avatar_url: null,
      },
      replies: [],
    }

    // Optimistically add reply to UI
    setComments(prev => prev.map(comment => {
      if (comment.id === parentId) {
        return {
          ...comment,
          replies: [...(comment.replies || []), optimisticReply]
        }
      }
      return comment
    }))

    const savedReply = replyContent
    setReplyingTo(null)
    setReplyContent('')

    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('comments')
        .insert({
          itinerary_id: itineraryId,
          user_id: currentUserId,
          content: savedReply.trim(),
          parent_comment_id: parentId,
        })
        .select(`
          id,
          content,
          created_at,
          is_edited,
          edited_at,
          user_id,
          parent_comment_id,
          user:profiles(
            id,
            name,
            username,
            avatar_url
          )
        `)
        .single()

      if (error) throw error

      // Replace optimistic reply with real one
      if (data) {
        setComments(prev => prev.map(comment => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: (comment.replies || []).map(r =>
                r.id === optimisticId ? { ...data, replies: [] } : r
              )
            }
          }
          return comment
        }))
      }

      toast({
        title: 'Reply posted',
        description: 'Your reply has been added successfully.',
      })
    } catch (err: any) {
      console.error('Error posting reply:', err)
      // Remove optimistic reply on error
      setComments(prev => prev.map(comment => {
        if (comment.id === parentId) {
          return {
            ...comment,
            replies: (comment.replies || []).filter(r => r.id !== optimisticId)
          }
        }
        return comment
      }))
      setReplyingTo(parentId)
      setReplyContent(savedReply)
      setError(err.message || 'Failed to post reply')
      toast({
        title: 'Error',
        description: 'Failed to post reply. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return

    setSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('comments')
        .update({
          content: editContent.trim(),
          is_edited: true,
          edited_at: new Date().toISOString(),
        })
        .eq('id', commentId)

      if (error) throw error

      setEditingId(null)
      setEditContent('')
      toast({
        title: 'Comment updated',
        description: 'Your comment has been updated successfully.',
      })
    } catch (err: any) {
      console.error('Error updating comment:', err)
      setError(err.message || 'Failed to update comment')
      toast({
        title: 'Error',
        description: 'Failed to update comment. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    setSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error

      toast({
        title: 'Comment deleted',
        description: 'Your comment has been deleted successfully.',
      })
    } catch (err: any) {
      console.error('Error deleting comment:', err)
      setError(err.message || 'Failed to delete comment')
      toast({
        title: 'Error',
        description: 'Failed to delete comment. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id)
    setEditContent(comment.content)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditContent('')
  }

  const renderComment = (comment: Comment, depth: number = 0) => {
    const isEditing = editingId === comment.id
    const isReplying = replyingTo === comment.id
    const isCommentOwner = currentUserId === comment.user_id
    const isItineraryOwner = currentUserId === itineraryOwnerId
    const canDelete = isCommentOwner || isItineraryOwner
    const canEdit = isCommentOwner
    const userName = comment.user?.name || comment.user?.username || 'Anonymous'
    const userInitials = userName.slice(0, 2).toUpperCase()

    return (
      <div key={comment.id} className={depth > 0 ? 'ml-8 mt-4' : 'mt-4'}>
        <div className="flex gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.user?.avatar_url || undefined} alt={userName} />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="font-medium text-sm cursor-pointer hover:text-violet-600 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (comment.user_id) {
                      router.push(`/user/${comment.user_id}`)
                    }
                  }}
                >
                  {userName}
                </span>
                {comment.user?.username && (
                  <span
                    className="text-xs text-muted-foreground cursor-pointer hover:text-violet-600 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (comment.user_id) {
                        router.push(`/user/${comment.user_id}`)
                      }
                    }}
                  >
                    @{comment.user.username}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </span>
                {comment.is_edited && (
                  <span className="text-xs text-muted-foreground italic">(edited)</span>
                )}
              </div>

              {(canEdit || canDelete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {canEdit && (
                      <DropdownMenuItem onClick={() => startEdit(comment)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {canDelete && (
                      <DropdownMenuItem
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Edit your comment..."
                  className="min-h-[80px]"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleEditComment(comment.id)}
                    disabled={!editContent.trim() || submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save'
                    )}
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelEdit}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>

                {currentUserId && depth < 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setReplyingTo(comment.id)
                      setReplyContent('')
                    }}
                    className="h-8 text-xs"
                  >
                    <Reply className="h-3 w-3 mr-1" />
                    Reply
                  </Button>
                )}

                {isReplying && (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={`Reply to ${userName}...`}
                      className="min-h-[80px]"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSubmitReply(comment.id)}
                        disabled={!replyContent.trim() || submitting}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Posting...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Reply
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setReplyingTo(null)
                          setReplyContent('')
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-2">
                {comment.replies.map((reply) => renderComment(reply, depth + 1))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="flex items-center text-xl font-semibold">
          <MessageSquare className="mr-2 h-5 w-5 text-blue-500" />
          Discussion ({comments.length})
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Ask questions, share tips, or discuss plans with other attendees
        </p>
      </CardHeader>

      <CardContent className="px-0 space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Comment Form */}
        {currentUserId ? (
          <div className="space-y-3">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts or ask a question..."
              className="min-h-[100px]"
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || submitting}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Post Comment
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <Alert>
            <AlertDescription>
              Please sign in to join the discussion.
            </AlertDescription>
          </Alert>
        )}

        {/* Comments List */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground">No comments yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Be the first to start the discussion!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => renderComment(comment))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
