"use client"

import Link from "next/link"
import {
  Home,
  Search,
  Compass,
  Heart,
  Bookmark,
  Bell,
  User,
  Settings,
  PlusCircle,
  Map,
  Sparkles,
  Store,
  BarChart3,
  Crown,
  Coins,
  Tag,
  Megaphone,
  Receipt,
  Users,
  Link2,
  CreditCard,
  Ticket,
  MessageCircle,
  Shield,
  FileText,
  Lock,
  LogIn,
  KeyRound,
  AlertCircle,
  Wrench,
  ExternalLink,
} from "lucide-react"
import { PHASE_2_ROUTES } from "@/lib/phase2"
import { Badge } from "@/components/ui/badge"

const pages = [
  {
    category: "Core",
    items: [
      { href: "/", label: "Home", icon: Home },
      { href: "/discover", label: "Discover", icon: Compass },
      { href: "/explore", label: "Explore", icon: Search },
      { href: "/for-you", label: "For You", icon: Sparkles },
      { href: "/search", label: "Search", icon: Search },
      { href: "/pricing", label: "Pricing", icon: CreditCard },
    ],
  },
  {
    category: "User",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: Home },
      { href: "/profile", label: "Profile", icon: User },
      { href: "/saved", label: "Saved", icon: Bookmark },
      { href: "/liked", label: "Liked", icon: Heart },
      { href: "/notifications", label: "Notifications", icon: Bell },
      { href: "/messages", label: "Messages", icon: MessageCircle },
      { href: "/settings", label: "Settings", icon: Settings },
      { href: "/tickets", label: "Support Tickets", icon: Ticket },
    ],
  },
  {
    category: "Content",
    items: [
      { href: "/create", label: "Create Itinerary", icon: PlusCircle },
      { href: "/create-wizard", label: "Create Wizard", icon: Map },
    ],
  },
  {
    category: "Business (Phase 2)",
    items: [
      { href: "/business", label: "Business Plans", icon: Store },
      { href: "/business-profile", label: "Business Profile", icon: Store },
      { href: "/business-analytics", label: "Business Analytics", icon: BarChart3 },
      { href: "/business-onboarding", label: "Business Onboarding", icon: Store },
      { href: "/deals", label: "Deals", icon: Tag },
      { href: "/deals/manage", label: "Manage Deals", icon: Tag },
      { href: "/mentions", label: "Mentions", icon: Megaphone },
    ],
  },
  {
    category: "Creator (Phase 2)",
    items: [
      { href: "/creators", label: "Creator Directory", icon: Users },
      { href: "/creator", label: "Creator Hub", icon: Crown },
      { href: "/creator/analytics", label: "Creator Analytics", icon: BarChart3 },
      { href: "/creator/boost", label: "Boost", icon: Sparkles },
      { href: "/creator/templates", label: "Templates", icon: FileText },
      { href: "/creator/sponsorships", label: "Sponsorships", icon: Link2 },
    ],
  },
  {
    category: "Finance (Phase 2)",
    items: [
      { href: "/coins", label: "Tinerary Coins", icon: Coins },
      { href: "/transactions", label: "Transactions", icon: Receipt },
      { href: "/affiliate", label: "Affiliate", icon: Link2 },
    ],
  },
  {
    category: "Auth",
    items: [
      { href: "/auth", label: "Sign In / Sign Up", icon: LogIn },
      { href: "/auth/forgot-password", label: "Forgot Password", icon: KeyRound },
      { href: "/auth/reset-password", label: "Reset Password", icon: Lock },
      { href: "/auth/auth-code-error", label: "Auth Code Error", icon: AlertCircle },
    ],
  },
  {
    category: "Legal",
    items: [
      { href: "/terms", label: "Terms of Service", icon: FileText },
      { href: "/privacy", label: "Privacy Policy", icon: Shield },
    ],
  },
  {
    category: "System",
    items: [
      { href: "/diagnostics", label: "Diagnostics", icon: Wrench },
      { href: "/app", label: "App Download", icon: ExternalLink },
    ],
  },
]

function isPhase2(href: string): boolean {
  return PHASE_2_ROUTES.some((route) => href.startsWith(route))
}

export default function AdminPagesPage() {
  return (
    <div className="p-6 md:p-10 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#2c2420]">All Pages</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Every page in Tinerary. Phase 2 pages are gated for non-admin users.
        </p>
      </div>

      <div className="space-y-8">
        {pages.map((section) => (
          <div key={section.category}>
            <h2 className="text-sm font-semibold text-[#2c2420]/60 uppercase tracking-wider mb-3">
              {section.category}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {section.items.map((item) => {
                const phase2 = isPhase2(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-white dark:bg-card hover:shadow-md hover:-translate-y-0.5 transition-all group"
                  >
                    <item.icon className="h-4 w-4 text-[#2c2420]/40 group-hover:text-[#ffb88c] transition-colors flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-[#2c2420] truncate block">
                        {item.label}
                      </span>
                      <span className="text-xs text-[#2c2420]/40 truncate block">
                        {item.href}
                      </span>
                    </div>
                    {phase2 && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-orange-300 text-orange-500 flex-shrink-0">
                        P2
                      </Badge>
                    )}
                    <ExternalLink className="h-3 w-3 text-[#2c2420]/20 group-hover:text-[#2c2420]/40 flex-shrink-0" />
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
