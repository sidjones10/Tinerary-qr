"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Search,
  Loader2,
  MoreVertical,
  Mail,
  Shield,
  User,
  Trash2,
  RefreshCcw,
  UserX,
  Download,
  Filter,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Ban,
  History
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAdminUsers } from "@/hooks/use-admin-stats"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"

interface UserAction {
  type: "delete" | "reset" | "suspend" | "unsuspend"
  userId: string
  userName: string
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)
  const [filterType, setFilterType] = useState<"all" | "admin" | "minor" | "suspended">("all")
  const [pendingAction, setPendingAction] = useState<UserAction | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const limit = 20
  const { users, total, adminCount, minorCount, suspendedCount, isLoading, refetch } = useAdminUsers(page, limit, debouncedSearch, refreshKey)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const totalPages = Math.ceil(total / limit)

  const handleToggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
    setIsProcessing(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("profiles")
      .update({ is_admin: !currentIsAdmin, role: !currentIsAdmin ? "admin" : "user" })
      .eq("id", userId)

    setIsProcessing(false)
    if (error) {
      toast({ title: "Error", description: "Failed to update user role", variant: "destructive" })
    } else {
      toast({ title: "Success", description: `User ${!currentIsAdmin ? "promoted to" : "removed from"} admin` })
      setRefreshKey(k => k + 1)
    }
  }

  const handleDeleteUser = async () => {
    if (!pendingAction || pendingAction.type !== "delete") return

    setIsProcessing(true)

    try {
      const res = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: pendingAction.userId }),
      })

      const result = await res.json()

      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to delete user")
      }

      toast({
        title: "User Deleted",
        description: `${pendingAction.userName}'s account and all data have been permanently deleted.`
      })
      setRefreshKey(k => k + 1)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
      setPendingAction(null)
    }
  }

  const handleResetAccount = async () => {
    if (!pendingAction || pendingAction.type !== "reset") return

    setIsProcessing(true)
    const supabase = createClient()

    try {
      // Delete user's itineraries
      await supabase.from("itineraries").delete().eq("user_id", pendingAction.userId)

      // Delete user's saved items
      await supabase.from("saved_itineraries").delete().eq("user_id", pendingAction.userId)

      // Delete user's comments
      await supabase.from("comments").delete().eq("user_id", pendingAction.userId)

      // Delete user's interactions
      await supabase.from("user_interactions").delete().eq("user_id", pendingAction.userId)

      // Reset profile to defaults (keep account but clear data)
      const { error } = await supabase
        .from("profiles")
        .update({
          bio: null,
          avatar_url: null,
          cover_url: null,
          location: null,
          website: null,
          updated_at: new Date().toISOString()
        })
        .eq("id", pendingAction.userId)

      if (error) throw error

      toast({
        title: "Account Reset",
        description: `${pendingAction.userName}'s account has been reset. Login credentials remain unchanged.`
      })
      setRefreshKey(k => k + 1)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset account",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
      setPendingAction(null)
    }
  }

  const handleSuspendUser = async (userId: string, userName: string, suspend: boolean) => {
    setIsProcessing(true)
    const supabase = createClient()

    const { error } = await supabase
      .from("profiles")
      .update({
        is_suspended: suspend,
        suspended_at: suspend ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq("id", userId)

    setIsProcessing(false)
    if (error) {
      toast({ title: "Error", description: `Failed to ${suspend ? "suspend" : "unsuspend"} user`, variant: "destructive" })
    } else {
      toast({
        title: suspend ? "User Suspended" : "User Unsuspended",
        description: `${userName}'s account has been ${suspend ? "suspended" : "reactivated"}.`
      })
      setRefreshKey(k => k + 1)
    }
  }

  const handleExportUsers = () => {
    const csvContent = [
      ["ID", "Name", "Email", "Username", "Account Type", "Admin", "Joined"].join(","),
      ...users.map(u => [
        u.id,
        u.name || "",
        u.email,
        u.username || "",
        u.account_type || "standard",
        u.is_admin ? "Yes" : "No",
        new Date(u.created_at).toLocaleDateString()
      ].join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `tinerary-users-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast({ title: "Export Complete", description: "Users exported to CSV" })
  }

  const filteredUsers = users.filter(user => {
    if (filterType === "all") return true
    if (filterType === "admin") return user.is_admin
    if (filterType === "minor") return user.account_type === "minor"
    if (filterType === "suspended") return user.is_suspended
    return true
  })

  const confirmAction = () => {
    if (pendingAction?.type === "delete") {
      handleDeleteUser()
    } else if (pendingAction?.type === "reset") {
      handleResetAccount()
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild aria-label="Go back">
            <Link href="/admin">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[#2c2420]">User Management</h1>
            <p className="text-sm text-[#2c2420]/50">{total} total users</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportUsers}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#2c2420]/40" />
          <Input
            placeholder="Search by name, email, or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
          <SelectTrigger className="w-[150px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="admin">Admins Only</SelectItem>
            <SelectItem value="minor">Minor Accounts</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-xl border border-[#2c2420]/5 p-4">
          <div className="flex items-center gap-2 text-[#2c2420]/60 text-xs mb-1">
            <User className="h-3.5 w-3.5" />
            Total Users
          </div>
          <p className="text-xl font-bold text-[#2c2420]">{total}</p>
        </div>
        <div className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-xl border border-[#2c2420]/5 p-4">
          <div className="flex items-center gap-2 text-purple-600 text-xs mb-1">
            <Shield className="h-3.5 w-3.5" />
            Admins
          </div>
          <p className="text-xl font-bold text-[#2c2420]">{adminCount}</p>
        </div>
        <div className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-xl border border-[#2c2420]/5 p-4">
          <div className="flex items-center gap-2 text-amber-600 text-xs mb-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            Minor Accounts
          </div>
          <p className="text-xl font-bold text-[#2c2420]">{minorCount}</p>
        </div>
        <div className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-xl border border-[#2c2420]/5 p-4">
          <div className="flex items-center gap-2 text-red-600 text-xs mb-1">
            <Ban className="h-3.5 w-3.5" />
            Suspended
          </div>
          <p className="text-xl font-bold text-[#2c2420]">{suspendedCount}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/70 dark:bg-card/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#ffb88c]" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-[#2c2420]/[0.02] hover:bg-[#2c2420]/[0.02]">
                <TableHead className="text-[#2c2420]/60">User</TableHead>
                <TableHead className="text-[#2c2420]/60">Email</TableHead>
                <TableHead className="text-[#2c2420]/60">Status</TableHead>
                <TableHead className="text-[#2c2420]/60">Joined</TableHead>
                <TableHead className="text-[#2c2420]/60 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-[#2c2420]/40">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className={`hover:bg-[#ffb88c]/5 ${user.is_suspended ? "bg-red-50/50" : ""}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="bg-[#ffb88c]/20 text-[#d97a4a] text-xs">
                            {(user.name || user.email || "U")[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-[#2c2420]">
                            {user.name || user.username || "Unknown"}
                          </p>
                          {user.username && (
                            <p className="text-xs text-[#2c2420]/40">@{user.username}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-[#2c2420]/70">{user.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 flex-wrap">
                        {user.is_suspended && (
                          <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100">
                            <Ban className="h-3 w-3 mr-1" />
                            Suspended
                          </Badge>
                        )}
                        {user.is_admin && (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                            <Shield className="h-3 w-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                        {user.account_type === "minor" && (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                            Minor
                          </Badge>
                        )}
                        {!user.is_suspended && !user.is_admin && user.account_type !== "minor" && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-[#2c2420]/60">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="User actions">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem asChild>
                            <Link href={`/user/${user.id}`}>
                              <User className="h-4 w-4 mr-2" />
                              View Profile
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.open(`mailto:${user.email}`)}>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleToggleAdmin(user.id, user.is_admin)}>
                            <Shield className="h-4 w-4 mr-2" />
                            {user.is_admin ? "Remove Admin" : "Make Admin"}
                          </DropdownMenuItem>
                          {user.is_suspended ? (
                            <DropdownMenuItem
                              onClick={() => handleSuspendUser(user.id, user.name || user.email, false)}
                              className="text-green-600"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Unsuspend User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => handleSuspendUser(user.id, user.name || user.email, true)}
                              className="text-amber-600"
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Suspend User
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setPendingAction({
                              type: "reset",
                              userId: user.id,
                              userName: user.name || user.email
                            })}
                            className="text-amber-600"
                          >
                            <RefreshCcw className="h-4 w-4 mr-2" />
                            Reset Account
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setPendingAction({
                              type: "delete",
                              userId: user.id,
                              userName: user.name || user.email
                            })}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#2c2420]/5">
            <p className="text-sm text-[#2c2420]/50">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={pendingAction !== null} onOpenChange={(open) => !open && setPendingAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {pendingAction?.type === "delete" ? (
                <>
                  <Trash2 className="h-5 w-5 text-red-500" />
                  Delete User Account
                </>
              ) : (
                <>
                  <RefreshCcw className="h-5 w-5 text-amber-500" />
                  Reset User Account
                </>
              )}
            </DialogTitle>
            <DialogDescription className="pt-2">
              {pendingAction?.type === "delete" ? (
                <>
                  Are you sure you want to <strong>permanently delete</strong> {pendingAction?.userName}'s account?
                  <br /><br />
                  This will delete:
                  <ul className="list-disc list-inside mt-2 text-red-600">
                    <li>All itineraries created by this user</li>
                    <li>All comments and interactions</li>
                    <li>All saved items and preferences</li>
                    <li>The user profile itself</li>
                  </ul>
                  <p className="mt-3 font-semibold text-red-600">This action cannot be undone.</p>
                </>
              ) : (
                <>
                  Are you sure you want to <strong>reset</strong> {pendingAction?.userName}'s account?
                  <br /><br />
                  This will delete:
                  <ul className="list-disc list-inside mt-2 text-amber-600">
                    <li>All itineraries created by this user</li>
                    <li>All comments and interactions</li>
                    <li>Profile bio, avatar, and cover image</li>
                  </ul>
                  <p className="mt-3">The user will keep their login credentials and can continue using the platform.</p>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPendingAction(null)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              variant={pendingAction?.type === "delete" ? "destructive" : "default"}
              onClick={confirmAction}
              disabled={isProcessing}
              className={pendingAction?.type === "reset" ? "bg-amber-500 hover:bg-amber-600" : ""}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : pendingAction?.type === "delete" ? (
                "Delete User"
              ) : (
                "Reset Account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
