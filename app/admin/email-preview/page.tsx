"use client"

import { useState, useEffect } from "react"
import { Mail, Loader2, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

interface TemplateInfo {
  id: string
  subject: string
}

const TEMPLATE_LABELS: Record<string, string> = {
  welcome: "Welcome",
  eventInvite: "Event Invite",
  eventReminder: "Event Reminder",
  newFollower: "New Follower",
  newComment: "New Comment",
  passwordReset: "Password Reset",
  countdownReminder: "Countdown",
  eventStarted: "Event Started",
  whatsNew: "What's New",
  accountDeletion: "Account Deletion",
}

export default function EmailPreviewPage() {
  const [templates, setTemplates] = useState<TemplateInfo[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [htmlContent, setHtmlContent] = useState<string>("")

  useEffect(() => {
    fetch("/api/admin/email-preview")
      .then((r) => r.json())
      .then((data) => {
        setTemplates(data.templates)
        if (data.templates.length > 0) {
          setSelected(data.templates[0].id)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selected) return
    setHtmlContent("")
    fetch(`/api/admin/email-preview?template=${selected}`)
      .then((r) => r.text())
      .then(setHtmlContent)
  }, [selected])

  const selectedTemplate = templates.find((t) => t.id === selected)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#ffb88c] mx-auto mb-4" />
          <p className="text-[#2c2420]/60">Loading templates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 max-w-[1400px] mx-auto">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between mb-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-white/70" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[240px]">
            <AdminSidebar />
          </SheetContent>
        </Sheet>
        <span className="font-bold text-lg text-[#2c2420]">Email Preview</span>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-[#ffb88c]/30 text-[#d97a4a] text-xs">AD</AvatarFallback>
        </Avatar>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-[#2c2420] tracking-tight">
          Email Template Preview
        </h1>
        <p className="text-[#2c2420]/50 text-sm mt-1">
          Preview all email templates with sample data — nothing is sent
        </p>
      </div>

      {/* Template picker */}
      <div className="flex flex-wrap gap-2 mb-6">
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelected(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl transition-all ${
              selected === t.id
                ? "bg-[#2c2420] text-white shadow-sm"
                : "bg-white/60 text-[#2c2420]/60 hover:text-[#2c2420] hover:bg-[#ffb88c]/10 border border-[#2c2420]/5"
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            {TEMPLATE_LABELS[t.id] || t.id}
          </button>
        ))}
      </div>

      {/* Preview */}
      {selected && selectedTemplate && (
        <div className="bg-white/70 backdrop-blur rounded-2xl border border-[#2c2420]/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-[#2c2420]/5">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-[#2c2420]">Subject:</span>
              <span className="text-[#2c2420]/70">{selectedTemplate.subject}</span>
            </div>
          </div>
          <iframe
            key={selected}
            srcDoc={htmlContent}
            title={`Preview: ${selected}`}
            className="w-full border-0"
            style={{ height: "80vh" }}
          />
        </div>
      )}
    </div>
  )
}
