"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export interface FontOption {
  id: string
  name: string
  fontFamily: string
  category: "normal" | "fun"
}

export const fonts: FontOption[] = [
  // Normal fonts
  { id: "default", name: "System Default", fontFamily: "inherit", category: "normal" },
  { id: "times", name: "Times New Roman", fontFamily: "'Times New Roman', Times, serif", category: "normal" },
  { id: "calibri", name: "Calibri", fontFamily: "Calibri, 'Segoe UI', sans-serif", category: "normal" },
  { id: "arial", name: "Arial", fontFamily: "Arial, Helvetica, sans-serif", category: "normal" },
  // Fun fonts
  { id: "playfair", name: "Playfair Display", fontFamily: "'Playfair Display', Georgia, serif", category: "fun" },
  { id: "pacifico", name: "Pacifico", fontFamily: "'Pacifico', cursive", category: "fun" },
  { id: "dancing", name: "Dancing Script", fontFamily: "'Dancing Script', cursive", category: "fun" },
]

interface FontSelectorProps {
  value: string
  onChange: (font: string) => void
  showLabel?: boolean
}

export function FontSelector({ value, onChange, showLabel = true }: FontSelectorProps) {
  const selectedFont = fonts.find(f => f.id === value) || fonts[0]

  return (
    <div className="space-y-2">
      {showLabel && <Label>Font Style</Label>}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue>
            <span style={{ fontFamily: selectedFont.fontFamily }}>
              {selectedFont.name}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            Standard Fonts
          </div>
          {fonts.filter(f => f.category === "normal").map((font) => (
            <SelectItem key={font.id} value={font.id}>
              <span style={{ fontFamily: font.fontFamily }}>
                {font.name}
              </span>
            </SelectItem>
          ))}
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">
            Fun Fonts
          </div>
          {fonts.filter(f => f.category === "fun").map((font) => (
            <SelectItem key={font.id} value={font.id}>
              <span style={{ fontFamily: font.fontFamily }}>
                {font.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// Helper to get font family from font ID
export function getFontFamily(fontId: string): string {
  const font = fonts.find(f => f.id === fontId)
  return font?.fontFamily || "inherit"
}
