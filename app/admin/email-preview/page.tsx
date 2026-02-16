"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail } from "lucide-react"

interface TemplateInfo {
  id: string
  subject: string
}

export default function EmailPreviewPage() {
  const [templates, setTemplates] = useState<TemplateInfo[]>([])
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/admin/email-preview")
      .then((r) => r.json())
      .then((data) => {
        setTemplates(data.templates)
        if (data.templates.length > 0) {
          setSelected(data.templates[0].id)
        }
      })
  }, [])

  const selectedSubject = templates.find((t) => t.id === selected)?.subject

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Email Template Preview</h1>
        <p className="text-muted-foreground">Preview all email templates with sample data — nothing is sent.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {templates.map((t) => (
          <Button
            key={t.id}
            variant={selected === t.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelected(t.id)}
          >
            <Mail className="h-3.5 w-3.5 mr-1.5" />
            {t.id}
          </Button>
        ))}
      </div>

      {selected && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">
              Subject: {selectedSubject}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <iframe
              key={selected}
              src={`/api/admin/email-preview?template=${selected}`}
              title={`Preview: ${selected}`}
              className="w-full border-0 rounded-b-lg"
              style={{ height: "80vh" }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
