"use client"

import { useState } from "react"
import {
  Users,
  Map,
  Eye,
  Search,
  TrendingUp,
  ArrowUpRight,
  Globe,
  Clock,
  Menu,
} from "lucide-react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { StatCard } from "@/components/admin/stat-card"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

// Mock data - In production, this would come from API/database
const userGrowthData = [
  { month: "Jul", users: 1200 },
  { month: "Aug", users: 1800 },
  { month: "Sep", users: 2400 },
  { month: "Oct", users: 3100 },
  { month: "Nov", users: 4200 },
  { month: "Dec", users: 5100 },
  { month: "Jan", users: 6800 },
  { month: "Feb", users: 8200 },
]

const topSearches = [
  { term: "Bali itinerary", count: 3420, change: 12 },
  { term: "Tokyo 5 days", count: 2890, change: 8 },
  { term: "Paris weekend", count: 2650, change: -3 },
  { term: "NYC food tour", count: 2180, change: 22 },
  { term: "Thailand backpacking", count: 1950, change: 15 },
  { term: "London 3 days", count: 1720, change: 5 },
  { term: "Barcelona beaches", count: 1580, change: 18 },
  { term: "Dubai luxury", count: 1340, change: -1 },
]

const pageViewsData = [
  { day: "Mon", views: 4200, unique: 2800 },
  { day: "Tue", views: 3800, unique: 2500 },
  { day: "Wed", views: 5100, unique: 3400 },
  { day: "Thu", views: 4700, unique: 3100 },
  { day: "Fri", views: 6200, unique: 4100 },
  { day: "Sat", views: 7800, unique: 5200 },
  { day: "Sun", views: 7200, unique: 4800 },
]

const deviceBreakdown = [
  { name: "Mobile", value: 58, color: "#ffb88c" },
  { name: "Desktop", value: 32, color: "#ff9a8b" },
  { name: "Tablet", value: 10, color: "#ffd2b8" },
]

const recentUsers = [
  { name: "Sarah Chen", email: "sarah@example.com", joined: "2 hours ago", itineraries: 3 },
  { name: "Marcus Johnson", email: "marcus@example.com", joined: "5 hours ago", itineraries: 1 },
  { name: "Aiko Tanaka", email: "aiko@example.com", joined: "8 hours ago", itineraries: 0 },
  { name: "Elena Rodriguez", email: "elena@example.com", joined: "12 hours ago", itineraries: 2 },
  { name: "James Okafor", email: "james@example.com", joined: "1 day ago", itineraries: 5 },
]

const topItineraries = [
  { title: "3 Days in Bali: Temple & Beach Hopping", views: 12400, saves: 890, creator: "TravelWithLisa" },
  { title: "Tokyo on a Budget - 7 Day Guide", views: 10200, saves: 720, creator: "NomadNick" },
  { title: "Paris: Beyond the Eiffel Tower", views: 8900, saves: 650, creator: "EuroExplorer" },
  { title: "NYC Hidden Gems Food Crawl", views: 7600, saves: 540, creator: "FoodieAlex" },
]

export default function AdminDashboard() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d")

  return (
    <div className="p-4 lg:p-8 max-w-[1400px] mx-auto">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between mb-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-white/70">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[240px]">
            <AdminSidebar />
          </SheetContent>
        </Sheet>
        <span className="font-bold text-lg text-[#2c2420]">Dashboard</span>
        <Avatar className="h-8 w-8">
          <AvatarImage src="/placeholder.svg" alt="Admin" />
          <AvatarFallback className="bg-[#ffb88c]/30 text-[#d97a4a] text-xs">AD</AvatarFallback>
        </Avatar>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#2c2420] tracking-tight">
            Good morning, Admin
          </h1>
          <p className="text-[#2c2420]/50 text-sm mt-1">
            Here is what is happening with Tinerary today.
          </p>
        </div>
        <div className="flex gap-1 bg-white/60 rounded-xl p-1 border border-[#2c2420]/5">
          {(["7d", "30d", "90d"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                timeRange === range
                  ? "bg-[#2c2420] text-white shadow-sm"
                  : "text-[#2c2420]/50 hover:text-[#2c2420]/80"
              }`}
            >
              {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-8">
        <StatCard
          title="Total Users"
          value="8,247"
          icon={Users}
          trend={{ value: 14, label: "vs last month" }}
          variant="peach"
        />
        <StatCard
          title="Itineraries Created"
          value="2,183"
          icon={Map}
          trend={{ value: 8, label: "vs last month" }}
          variant="coral"
        />
        <StatCard
          title="Page Views"
          value="42.8K"
          icon={Eye}
          trend={{ value: 22, label: "vs last month" }}
          variant="cream"
        />
        <StatCard
          title="Searches Today"
          value="1,847"
          icon={Search}
          trend={{ value: 5, label: "vs yesterday" }}
          variant="sage"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* User growth chart */}
        <div className="lg:col-span-2 bg-white/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-[#2c2420]">User Growth</h3>
              <p className="text-xs text-[#2c2420]/40 mt-0.5">Monthly active registrations</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              <TrendingUp className="h-3 w-3" />
              +34.2%
            </div>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowthData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffb88c" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#ffb88c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2c2420" strokeOpacity={0.05} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#2c2420", fillOpacity: 0.4 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#2c2420", fillOpacity: 0.4 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#2c2420",
                    border: "none",
                    borderRadius: "10px",
                    color: "#fff",
                    fontSize: "12px",
                    padding: "8px 12px",
                  }}
                  labelStyle={{ color: "#ffb88c", fontWeight: 600 }}
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="#ffb88c"
                  strokeWidth={2.5}
                  fill="url(#userGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device breakdown */}
        <div className="bg-white/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-5">
          <h3 className="font-semibold text-[#2c2420] mb-1">Device Breakdown</h3>
          <p className="text-xs text-[#2c2420]/40 mb-4">Where users browse from</p>
          <div className="h-[180px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deviceBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {deviceBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#2c2420",
                    border: "none",
                    borderRadius: "10px",
                    color: "#fff",
                    fontSize: "12px",
                    padding: "8px 12px",
                  }}
                  formatter={(value: number) => [`${value}%`, ""]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {deviceBreakdown.map((device) => (
              <div key={device.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: device.color }} />
                  <span className="text-[#2c2420]/70">{device.name}</span>
                </div>
                <span className="font-medium text-[#2c2420]">{device.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Page views + Top searches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {/* Page views bar chart */}
        <div className="bg-white/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-[#2c2420]">Page Views</h3>
              <p className="text-xs text-[#2c2420]/40 mt-0.5">This week overview</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#2c2420]/40">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-[#ffb88c]" />
                Total
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-[#ff9a8b]" />
                Unique
              </div>
            </div>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pageViewsData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2c2420" strokeOpacity={0.05} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#2c2420", fillOpacity: 0.4 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#2c2420", fillOpacity: 0.4 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#2c2420",
                    border: "none",
                    borderRadius: "10px",
                    color: "#fff",
                    fontSize: "12px",
                    padding: "8px 12px",
                  }}
                  labelStyle={{ color: "#ffb88c", fontWeight: 600 }}
                />
                <Bar dataKey="views" fill="#ffb88c" radius={[6, 6, 0, 0]} barSize={20} />
                <Bar dataKey="unique" fill="#ff9a8b" radius={[6, 6, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top searches */}
        <div className="bg-white/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-[#2c2420]">Top Searches</h3>
              <p className="text-xs text-[#2c2420]/40 mt-0.5">What users are looking for</p>
            </div>
            <Globe className="h-4 w-4 text-[#2c2420]/30" />
          </div>
          <div className="space-y-2.5">
            {topSearches.map((item, idx) => (
              <div key={item.term} className="flex items-center gap-3 group">
                <span className="text-xs font-bold text-[#2c2420]/20 w-4 text-right">{idx + 1}</span>
                <div className="flex-1 flex items-center justify-between bg-[#2c2420]/[0.02] group-hover:bg-[#ffb88c]/10 rounded-lg px-3 py-2 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-[#2c2420]">{item.term}</p>
                    <p className="text-xs text-[#2c2420]/40">{item.count.toLocaleString()} searches</p>
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      item.change >= 0 ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {item.change >= 0 ? "+" : ""}{item.change}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row: recent users + top itineraries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent users */}
        <div className="bg-white/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-[#2c2420]">Recent Users</h3>
              <p className="text-xs text-[#2c2420]/40 mt-0.5">Newest members on the platform</p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-[#ffb88c] hover:text-[#d97a4a] hover:bg-[#ffb88c]/10 bg-transparent">
              View all
              <ArrowUpRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-3">
            {recentUsers.map((user) => (
              <div key={user.email} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#ffb88c]/5 transition-colors">
                <Avatar className="h-9 w-9">
                  <AvatarImage src="/placeholder.svg" alt={user.name} />
                  <AvatarFallback className="bg-[#ffb88c]/20 text-[#d97a4a] text-xs font-semibold">
                    {user.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#2c2420] truncate">{user.name}</p>
                  <p className="text-xs text-[#2c2420]/40 truncate">{user.email}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 text-xs text-[#2c2420]/40">
                    <Clock className="h-3 w-3" />
                    {user.joined}
                  </div>
                  <p className="text-xs text-[#2c2420]/50 mt-0.5">{user.itineraries} itineraries</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top itineraries */}
        <div className="bg-white/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-[#2c2420]">Top Itineraries</h3>
              <p className="text-xs text-[#2c2420]/40 mt-0.5">Most viewed travel plans</p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-[#ffb88c] hover:text-[#d97a4a] hover:bg-[#ffb88c]/10 bg-transparent">
              View all
              <ArrowUpRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-3">
            {topItineraries.map((item, idx) => (
              <div key={item.title} className="flex items-start gap-3 px-3 py-3 rounded-xl hover:bg-[#ffb88c]/5 transition-colors">
                <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-br from-[#ffb88c]/20 to-[#ff9a8b]/20 shrink-0">
                  <span className="text-sm font-bold text-[#d97a4a]">#{idx + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#2c2420] leading-snug">{item.title}</p>
                  <p className="text-xs text-[#2c2420]/40 mt-0.5">by {item.creator}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-[#2c2420]">{(item.views / 1000).toFixed(1)}K</p>
                  <p className="text-xs text-[#2c2420]/40">{item.saves} saves</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
