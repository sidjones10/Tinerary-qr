"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Search, Loader2, MoreVertical, Mail, Calendar, Map, Shield, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { useAdminUsers } from "@/hooks/use-admin-stats"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"

export default function AdminUsersPage() {
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)
  const limit = 20
  const { users, total, isLoading } = useAdminUsers(page, limit, debouncedSearch)

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
    const supabase = createClient()
    const { error } = await supabase
      .from("profiles")
      .update({ is_admin: !currentIsAdmin, role: !currentIsAdmin ? "admin" : "user" })
      .eq("id", userId)

    if (error) {
      toast({ title: "Error", description: "Failed to update user role", variant: "destructive" })
    } else {
      toast({ title: "Success", description: `User ${!currentIsAdmin ? "promoted to" : "removed from"} admin` })
      // Refresh would happen via state update
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[#2c2420]">Users</h1>
          <p className="text-sm text-[#2c2420]/50">{total} total users</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#2c2420]/40" />
          <Input
            placeholder="Search by name, email, or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 overflow-hidden">
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
                <TableHead className="text-[#2c2420]/60">Account Type</TableHead>
                <TableHead className="text-[#2c2420]/60">Joined</TableHead>
                <TableHead className="text-[#2c2420]/60 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-[#2c2420]/40">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-[#ffb88c]/5">
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
                      <div className="flex items-center gap-2">
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
                        {(!user.account_type || user.account_type === "standard") && !user.is_admin && (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-100">
                            <User className="h-3 w-3 mr-1" />
                            Standard
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
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/profile/${user.id}`}>
                              <User className="h-4 w-4 mr-2" />
                              View Profile
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.open(`mailto:${user.email}`)}>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleAdmin(user.id, user.is_admin)}>
                            <Shield className="h-4 w-4 mr-2" />
                            {user.is_admin ? "Remove Admin" : "Make Admin"}
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
    </div>
  )
}
