"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"

interface DeleteAccountDialogProps {
  userId: string
  userEmail?: string
}

export function DeleteAccountDialog({ userId, userEmail }: DeleteAccountDialogProps) {
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [acknowledged, setAcknowledged] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDeleteAccount = async () => {
    if (confirmText !== "DELETE MY ACCOUNT") {
      toast({
        title: "Incorrect confirmation",
        description: "Please type 'DELETE MY ACCOUNT' exactly to confirm",
        variant: "destructive",
      })
      return
    }

    if (!acknowledged) {
      toast({
        title: "Please acknowledge",
        description: "You must acknowledge that this action cannot be undone",
        variant: "destructive",
      })
      return
    }

    setIsDeleting(true)

    try {
      const supabase = createClient()

      // Soft delete: Mark account as deleted and schedule permanent deletion
      const deletionDate = new Date()
      const scheduledDeletion = new Date()
      scheduledDeletion.setDate(scheduledDeletion.getDate() + 30) // 30 days grace period

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          account_deleted_at: deletionDate.toISOString(),
          deletion_scheduled_for: scheduledDeletion.toISOString(),
        })
        .eq("id", userId)

      if (profileError) throw profileError

      // Sign out the user
      await supabase.auth.signOut()

      toast({
        title: "Account deletion scheduled",
        description: "Your account has been scheduled for deletion in 30 days. You can cancel this by logging in again.",
      })

      // Redirect to home page
      router.push("/")
    } catch (error: any) {
      console.error("Error deleting account:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete account. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="w-full gap-2">
          <Trash2 className="h-4 w-4" />
          Delete Account
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Account
          </DialogTitle>
          <DialogDescription>
            This action will permanently delete your account and all associated data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> This action cannot be undone. All your data will be permanently deleted:
            </AlertDescription>
          </Alert>

          <div className="space-y-2 text-sm">
            <p className="font-medium">The following will be deleted:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li>All your itineraries (public and private)</li>
              <li>All activities and plans</li>
              <li>Packing lists and expenses</li>
              <li>Comments and interactions</li>
              <li>Profile information and settings</li>
            </ul>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="acknowledge"
                checked={acknowledged}
                onCheckedChange={(checked) => setAcknowledged(checked as boolean)}
              />
              <label
                htmlFor="acknowledge"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I understand that this action cannot be undone and all my data will be permanently deleted after 30 days
              </label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-text">
                Type <span className="font-mono font-bold">DELETE MY ACCOUNT</span> to confirm
              </Label>
              <Input
                id="confirm-text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE MY ACCOUNT"
                className="font-mono"
              />
            </div>

            {userEmail && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  You have 30 days to cancel this deletion by logging in with {userEmail}
                </p>
                <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                  📧 You'll receive a warning email 7 days before permanent deletion
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={isDeleting || confirmText !== "DELETE MY ACCOUNT" || !acknowledged}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete My Account
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
