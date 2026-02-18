"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Map,
  Search,
  Settings,
  LogOut,
  Shield,
  BarChart3,
  Bell,
  FileText,
  Mail,
  Send,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/providers/auth-provider"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/itineraries", label: "Itineraries", icon: Map },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/errors", label: "Errors", icon: FileText },
  { href: "/admin/communications", label: "Communications", icon: Send },
  { href: "/admin/email-preview", label: "Email Preview", icon: Mail },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <aside className="hidden lg:flex flex-col w-[240px] bg-white/60 dark:bg-card/60 backdrop-blur-sm border-r border-[#2c2420]/5 p-4">
      {/* Logo */}
      <div className="flex items-center gap-2 px-3 mb-8">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#ffb88c] to-[#ff9a8b] flex items-center justify-center">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <span className="font-bold text-[#2c2420]">Tinerary</span>
          <span className="text-xs text-[#2c2420]/50 block -mt-0.5">Admin Panel</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-[#2c2420] text-white shadow-sm"
                  : "text-[#2c2420]/60 hover:text-[#2c2420] hover:bg-[#ffb88c]/10"
              }`}
            >
              <item.icon className={`h-4.5 w-4.5 ${isActive ? "text-[#ffb88c]" : ""}`} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-[#2c2420]/5 pt-4 mt-4">
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.user_metadata?.avatar_url} alt="Admin" />
            <AvatarFallback className="bg-[#ffb88c]/30 text-[#d97a4a] text-xs font-semibold">
              {user?.email?.[0]?.toUpperCase() || "AD"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#2c2420] truncate">
              {user?.user_metadata?.name || user?.email?.split("@")[0] || "Admin"}
            </p>
            <p className="text-xs text-[#2c2420]/40 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#2c2420]/60 hover:text-red-600 hover:bg-red-50 transition-all w-full mt-2"
        >
          <LogOut className="h-4.5 w-4.5" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
