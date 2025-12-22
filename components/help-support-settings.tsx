"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, FileText, Users, Video, MapPin } from "lucide-react"

export function HelpSupportSettings() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Submit support request logic would go here

      toast({
        title: "Request submitted",
        description: "Your support request has been submitted. We'll get back to you soon.",
      })

      setSubject("")
      setMessage("")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit your request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const faqs = [
    {
      question: "How do I create a new itinerary?",
      answer: 'To create a new itinerary, click the "Create New" button on the home page or in the navigation menu.',
    },
    {
      question: "How do I invite friends to my itinerary?",
      answer:
        'Open your itinerary and go to the "People" tab. Click "Invite More Friends" and enter their email or phone number.',
    },
    {
      question: "How do I split expenses with my group?",
      answer:
        'In your itinerary, go to the "Expenses" tab. Add expenses and select how you want to split them among your group.',
    },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Help & Support</CardTitle>
          <CardDescription>Get help and learn more about Itinerary</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Frequently Asked Questions</h3>

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
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Contact Support</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select value={subject} onValueChange={setSubject} required>
                  <SelectTrigger id="subject">
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general-inquiry">General Inquiry</SelectItem>
                    <SelectItem value="account-issue">Account Issue</SelectItem>
                    <SelectItem value="payment-problem">Payment Problem</SelectItem>
                    <SelectItem value="feature-request">Feature Request</SelectItem>
                    <SelectItem value="bug-report">Bug Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Describe your issue or question..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  required
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Help Resources</CardTitle>
          <CardDescription>Explore our help resources to learn more</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-md p-4 flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-md text-blue-600">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium">User Guide</h4>
                <p className="text-sm text-muted-foreground">Learn how to use all features of Itinerary</p>
              </div>
            </div>

            <div className="border rounded-md p-4 flex items-start gap-3">
              <div className="bg-green-100 p-2 rounded-md text-green-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium">Community Forum</h4>
                <p className="text-sm text-muted-foreground">Connect with other travelers</p>
              </div>
            </div>

            <div className="border rounded-md p-4 flex items-start gap-3">
              <div className="bg-purple-100 p-2 rounded-md text-purple-600">
                <Video className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium">Video Tutorials</h4>
                <p className="text-sm text-muted-foreground">Watch step-by-step guides</p>
              </div>
            </div>

            <div className="border rounded-md p-4 flex items-start gap-3">
              <div className="bg-amber-100 p-2 rounded-md text-amber-600">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium">Travel Tips</h4>
                <p className="text-sm text-muted-foreground">Expert advice for better trips</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
