"use client"

import { useState } from "react"
import { Heart, Plane, UtensilsCrossed, Palmtree, Mountain, PartyPopper, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export interface Theme {
  id: string
  name: string
  icon: React.ReactNode
  color: string
}

export const themes: Theme[] = [
  { id: "default", name: "Default", icon: <Sparkles className="h-5 w-5" />, color: "text-gray-500" },
  { id: "heart", name: "Romance", icon: <Heart className="h-5 w-5" />, color: "text-pink-500" },
  { id: "plane", name: "Travel", icon: <Plane className="h-5 w-5" />, color: "text-blue-500" },
  { id: "pasta", name: "Food", icon: <UtensilsCrossed className="h-5 w-5" />, color: "text-orange-500" },
  { id: "beach", name: "Beach", icon: <Palmtree className="h-5 w-5" />, color: "text-teal-500" },
  { id: "mountain", name: "Adventure", icon: <Mountain className="h-5 w-5" />, color: "text-green-600" },
  { id: "party", name: "Party", icon: <PartyPopper className="h-5 w-5" />, color: "text-purple-500" },
]

interface ThemeSelectorProps {
  value: string
  onChange: (theme: string) => void
  showLabel?: boolean
}

export function ThemeSelector({ value, onChange, showLabel = true }: ThemeSelectorProps) {
  const [open, setOpen] = useState(false)
  const selectedTheme = themes.find(t => t.id === value) || themes[0]

  return (
    <div className="space-y-2">
      {showLabel && <Label>Theme Icon</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-start gap-2"
          >
            <span className={selectedTheme.color}>{selectedTheme.icon}</span>
            <span>{selectedTheme.name}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-2">
          <div className="grid grid-cols-4 gap-2">
            {themes.map((theme) => (
              <Button
                key={theme.id}
                variant="ghost"
                size="icon"
                className={cn(
                  "h-10 w-10 rounded-lg",
                  value === theme.id && "ring-2 ring-primary bg-primary/10"
                )}
                onClick={() => {
                  onChange(theme.id)
                  setOpen(false)
                }}
                title={theme.name}
              >
                <span className={theme.color}>{theme.icon}</span>
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

// Component to display theme icon inline
export function ThemeIcon({ theme, className }: { theme: string; className?: string }) {
  const selectedTheme = themes.find(t => t.id === theme)
  if (!selectedTheme || theme === "default") return null

  return (
    <span className={cn(selectedTheme.color, className)}>
      {selectedTheme.icon}
    </span>
  )
}
