"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Crown, Headphones, Zap, Clock, Phone, Mail } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  getBusinessSubscriptionByUserId,
  getEffectiveTier,
  getSupportLevel,
} from "@/lib/business-tier-service"
import type { BusinessTierSlug } from "@/lib/tiers"

export function HelpSupportSettings() {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [supportLevel, setSupportLevel] = useState<"email" | "priority" | "dedicated">("email")
  const [tier, setTier] = useState<BusinessTierSlug>("basic")

  useEffect(() => {
    async function loadTier() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { subscription } = await getBusinessSubscriptionByUserId(session.user.id)
      const effectiveTier = getEffectiveTier(subscription)
      setTier(effectiveTier)
      setSupportLevel(getSupportLevel(effectiveTier))
    }
    loadTier()
  }, [])

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
      // Priority/dedicated requests would be routed to a faster queue

      toast({
        title: t("settings.help.requestSubmitted"),
        description: supportLevel === "dedicated"
          ? "Your dedicated account manager has been notified and will respond shortly."
          : supportLevel === "priority"
            ? "Your priority request has been submitted. Expect a response within 4 hours."
            : t("settings.help.requestSubmittedDesc"),
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
      {/* Priority/Dedicated Support Banner */}
      {supportLevel !== "email" && (
        <Card className={`border-border ${supportLevel === "dedicated" ? "ring-2 ring-tinerary-gold/30" : "ring-2 ring-primary/20"}`}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                supportLevel === "dedicated" ? "bg-tinerary-gold" : "bg-primary"
              }`}>
                {supportLevel === "dedicated"
                  ? <Crown className="size-5 text-white" />
                  : <Headphones className="size-5 text-white" />
                }
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-bold text-foreground">
                    {supportLevel === "dedicated" ? "Dedicated Account Manager" : "Priority Support"}
                  </h3>
                  <Badge className={`text-xs border-0 ${
                    supportLevel === "dedicated"
                      ? "bg-tinerary-gold/20 text-tinerary-dark"
                      : "bg-primary/10 text-primary"
                  }`}>
                    {tier === "enterprise" ? "Enterprise" : "Premium"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {supportLevel === "dedicated"
                    ? "Your dedicated account manager is available for personalized assistance. Support requests are routed directly to your manager."
                    : "Your support requests are routed to our priority queue. Expect faster response times and direct escalation for critical issues."
                  }
                </p>
                <div className="flex flex-wrap gap-3 mt-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3.5 text-primary" />
                    {supportLevel === "dedicated" ? "< 1 hour response" : "< 4 hour response"}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Mail className="size-3.5 text-primary" />
                    Priority email queue
                  </div>
                  {supportLevel === "dedicated" && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Phone className="size-3.5 text-primary" />
                      Direct phone line
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">{t("settings.help.contactSupport")}</h3>
              {supportLevel !== "email" && (
                <Badge variant="secondary" className="text-xs">
                  <Zap className="size-3 mr-1" />
                  {supportLevel === "dedicated" ? "Dedicated" : "Priority"}
                </Badge>
              )}
            </div>

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
                    {supportLevel !== "email" && (
                      <SelectItem value="priority-escalation">Priority Escalation</SelectItem>
                    )}
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
                    <>
                      {supportLevel !== "email" && <Zap className="mr-2 h-4 w-4" />}
                      {t("settings.help.submitRequest")}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
