"use client"

import Link from "next/link"
import { useAuth } from "@/providers/auth-provider"
import { User, Shield, Bell, Palette, Lock, Globe, HelpCircle, LogOut, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SettingsNavProps {
  activeSection: string
  setActiveSection: (section: string) => void
}

export function SettingsNav({ activeSection, setActiveSection }: SettingsNavProps) {
  const { user, signOut } = useAuth()

  const navItems = [
    { id: "profile", label: "Edit Profile", icon: <User className="w-4 h-4" /> },
    { id: "account", label: "Account", icon: <Shield className="w-4 h-4" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
    { id: "appearance", label: "Appearance", icon: <Palette className="w-4 h-4" /> },
    { id: "privacy", label: "Privacy", icon: <Lock className="w-4 h-4" /> },
    { id: "language", label: "Language & Region", icon: <Globe className="w-4 h-4" /> },
    { id: "help", label: "Help & Support", icon: <HelpCircle className="w-4 h-4" /> },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 mb-4 overflow-hidden">
          {user?.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url || "/placeholder.svg"}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <User size={32} />
            </div>
          )}
        </div>
        <div>
          <p className="font-medium">{user?.user_metadata?.name || user?.email}</p>
          <p className="text-sm text-muted-foreground">@{user?.user_metadata?.username || "user"}</p>
        </div>
        <Button variant="outline" size="sm" className="mt-2 gap-1" asChild>
          <Link href="/profile">
            View Profile
            <ExternalLink className="w-3 h-3" />
          </Link>
        </Button>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
              activeSection === item.id
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div className="pt-6 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          onClick={() => signOut()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log Out
        </Button>
      </div>
    </div>
  )
}
