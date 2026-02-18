import type React from "react"
import { cn } from "@/lib/utils"

interface GradientCardProps {
  children: React.ReactNode
  className?: string
}

export function GradientCard({ children, className }: GradientCardProps) {
  return (
    <div className={cn("relative rounded-xl overflow-hidden p-px card-soft", className)}>
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-500/20 via-pink-500/20 to-orange-400/20" />
      <div className="absolute inset-0 rounded-xl p-[1px]">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-500 via-pink-500 to-orange-400 opacity-20" />
      </div>
      <div className="relative bg-white dark:bg-card rounded-xl overflow-hidden">{children}</div>
    </div>
  )
}
