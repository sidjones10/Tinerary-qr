"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Edit, Trash } from "lucide-react"
import { format } from "date-fns"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { deleteDraft, type EventDraft } from "@/app/actions/draft-actions"

interface ProfileDraftsProps {
  drafts: EventDraft[]
  loading: boolean
  onCreateNew: () => void
  onRefresh: () => void
}

export function ProfileDrafts({ drafts, loading, onCreateNew, onRefresh }: ProfileDraftsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [deletingDraftId, setDeletingDraftId] = useState<string | null>(null)

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy")
    } catch (e) {
      return dateString
    }
  }

  const handleDeleteDraft = async (draftId: string) => {
    try {
      setDeletingDraftId(draftId)
      const { success, error: deleteError } = await deleteDraft(draftId)

      if (success) {
        toast({
          title: "Draft deleted",
          description: "Your draft has been deleted successfully.",
        })
        onRefresh()
      } else if (deleteError) {
        toast({
          title: "Error",
          description: `Failed to delete draft: ${deleteError}`,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error deleting draft:", error)
      toast({
        title: "Error",
        description: "There was a problem deleting your draft.",
        variant: "destructive",
      })
    } finally {
      setDeletingDraftId(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Drafts</CardTitle>
          <CardDescription>Continue working on your saved drafts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-2 text-muted-foreground">Loading your drafts...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Drafts</CardTitle>
        <CardDescription>Continue working on your saved drafts</CardDescription>
      </CardHeader>
      <CardContent>
        {drafts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">You don't have any saved drafts.</p>
            <Button onClick={onCreateNew} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Create new event
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {drafts.map((draft) => (
              <Card key={draft.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{draft.title || "Untitled Draft"}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {draft.type === "event" ? "Event" : "Trip"} • Last saved: {formatDate(draft.last_saved || "")}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => router.push(`/create?draftId=${draft.id}`)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteDraft(draft.id || "")}
                        disabled={deletingDraftId === draft.id}
                      >
                        {deletingDraftId === draft.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash className="h-4 w-4 text-destructive" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {draft.description && <p className="text-sm mt-2 line-clamp-2">{draft.description}</p>}
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-between">
                  <div className="text-sm text-muted-foreground">
                    {draft.location && <span>{draft.location} • </span>}
                    {draft.start_date && formatDate(draft.start_date)}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/create?draftId=${draft.id}`)}
                    className="ml-auto"
                  >
                    Continue Editing
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
