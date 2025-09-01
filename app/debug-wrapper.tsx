"use client"

import type React from "react"

import { DebugSession } from "@/components/debug-session"
import { useState, useEffect } from "react"

export function DebugWrapper({ children }: { children: React.ReactNode }) {
  const [showDebug, setShowDebug] = useState(false)

  useEffect(() => {
    // Check if we should show debug tools
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get("debug") === "true") {
      setShowDebug(true)
    }

    // Also enable with keyboard shortcut (Ctrl+Shift+D)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        setShowDebug((prev) => !prev)
        e.preventDefault()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <>
      {children}
      {showDebug && <DebugSession />}
    </>
  )
}
