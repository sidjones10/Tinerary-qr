"use client"

import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react"

interface StatCardProps {
  title: string
  value: string
  icon: LucideIcon
  trend?: {
    value: number
    label: string
  }
  variant?: "peach" | "coral" | "cream" | "sage"
}

const variantStyles = {
  peach: {
    bg: "bg-gradient-to-br from-[#ffb88c]/20 to-[#ffb88c]/5",
    iconBg: "bg-[#ffb88c]/30",
    iconColor: "text-[#d97a4a]",
  },
  coral: {
    bg: "bg-gradient-to-br from-[#ff9a8b]/20 to-[#ff9a8b]/5",
    iconBg: "bg-[#ff9a8b]/30",
    iconColor: "text-[#e07a6d]",
  },
  cream: {
    bg: "bg-gradient-to-br from-[#ffd2b8]/20 to-[#ffd2b8]/5",
    iconBg: "bg-[#ffd2b8]/40",
    iconColor: "text-[#c98a5d]",
  },
  sage: {
    bg: "bg-gradient-to-br from-emerald-100/40 to-emerald-50/20",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
}

export function StatCard({ title, value, icon: Icon, trend, variant = "peach" }: StatCardProps) {
  const styles = variantStyles[variant]

  return (
    <div className={`${styles.bg} backdrop-blur rounded-2xl border border-[#2c2420]/5 p-4 lg:p-5`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`${styles.iconBg} rounded-xl p-2.5`}>
          <Icon className={`h-5 w-5 ${styles.iconColor}`} />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
              trend.value >= 0
                ? "text-emerald-600 bg-emerald-50"
                : "text-red-500 bg-red-50"
            }`}
          >
            {trend.value >= 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {trend.value >= 0 ? "+" : ""}{trend.value}%
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl lg:text-3xl font-bold text-[#2c2420] tracking-tight">{value}</p>
        <p className="text-xs text-[#2c2420]/40 mt-1">{title}</p>
        {trend && (
          <p className="text-xs text-[#2c2420]/30 mt-0.5">{trend.label}</p>
        )}
      </div>
    </div>
  )
}
