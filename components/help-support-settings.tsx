"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, FileText, Users, Video, MapPin } from "lucide-react"

export function HelpSupportSettings() {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate form fields
      if (!subject) {
        throw new Error("Please select a subject")
      }

      if (!message || message.trim().length === 0) {
        throw new Error("Please enter a message")
      }

      if (message.trim().length < 10) {
        throw new Error("Message must be at least 10 characters long")
      }

      // Submit support request logic would go here
      // In a real implementation, this would send to a backend API or support system

      toast({
        title: t("settings.help.requestSubmitted"),
        description: t("settings.help.requestSubmittedDesc"),
      })

      setSubject("")
      setMessage("")
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message || "Failed to submit your request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const faqs = [
    {
      question: t("settings.help.faq1Question"),
      answer: t("settings.help.faq1Answer"),
    },
    {
      question: t("settings.help.faq2Question"),
      answer: t("settings.help.faq2Answer"),
    },
    {
      question: t("settings.help.faq3Question"),
      answer: t("settings.help.faq3Answer"),
    },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.help.title")}</CardTitle>
          <CardDescription>{t("settings.help.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">{t("settings.help.faq")}</h3>

            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <div key={index} className="border rounded-md p-4">
                  <h4 className="font-medium mb-2">{faq.question}</h4>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">{t("settings.help.contactSupport")}</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">{t("settings.help.subject")}</Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger id="subject">
                    <SelectValue placeholder={t("settings.help.selectSubject")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general-inquiry">{t("settings.help.subjects.general-inquiry")}</SelectItem>
                    <SelectItem value="account-issue">{t("settings.help.subjects.account-issue")}</SelectItem>
                    <SelectItem value="payment-problem">{t("settings.help.subjects.payment-problem")}</SelectItem>
                    <SelectItem value="feature-request">{t("settings.help.subjects.feature-request")}</SelectItem>
                    <SelectItem value="bug-report">{t("settings.help.subjects.bug-report")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">{t("settings.help.message")}</Label>
                <Textarea
                  id="message"
                  placeholder={t("settings.help.messagePlaceholder")}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("common.submitting")}
                    </>
                  ) : (
                    t("settings.help.submitRequest")
                  )}
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.help.helpResources")}</CardTitle>
          <CardDescription>{t("settings.help.helpResourcesDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-md p-4 flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-md text-blue-600">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium">{t("settings.help.userGuide")}</h4>
                <p className="text-sm text-muted-foreground">{t("settings.help.userGuideDesc")}</p>
              </div>
            </div>

            <div className="border rounded-md p-4 flex items-start gap-3">
              <div className="bg-green-100 p-2 rounded-md text-green-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium">{t("settings.help.communityForum")}</h4>
                <p className="text-sm text-muted-foreground">{t("settings.help.communityForumDesc")}</p>
              </div>
            </div>

            <div className="border rounded-md p-4 flex items-start gap-3">
              <div className="bg-purple-100 p-2 rounded-md text-purple-600">
                <Video className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium">{t("settings.help.videoTutorials")}</h4>
                <p className="text-sm text-muted-foreground">{t("settings.help.videoTutorialsDesc")}</p>
              </div>
            </div>

            <div className="border rounded-md p-4 flex items-start gap-3">
              <div className="bg-amber-100 p-2 rounded-md text-amber-600">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium">{t("settings.help.travelTips")}</h4>
                <p className="text-sm text-muted-foreground">{t("settings.help.travelTipsDesc")}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
