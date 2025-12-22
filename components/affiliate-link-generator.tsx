"use client"

import { useState } from "react"
import { Copy, ExternalLink } from "lucide-react"
import { generateAffiliateLink } from "@/app/actions/promotion-actions"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AffiliateLinkGeneratorProps {
  userId: string
  promotions?: any[]
  itineraries?: any[]
}

export function AffiliateLinkGenerator({ userId, promotions = [], itineraries = [] }: AffiliateLinkGeneratorProps) {
  const [type, setType] = useState<"promotion" | "itinerary" | "external">("promotion")
  const [selectedId, setSelectedId] = useState("")
  const [externalUrl, setExternalUrl] = useState("")
  const [affiliateUrl, setAffiliateUrl] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const handleGenerate = async () => {
    if (type === "external" && !externalUrl) {
      toast({
        title: "URL required",
        description: "Please enter an external URL",
        variant: "destructive",
      })
      return
    }

    if ((type === "promotion" || type === "itinerary") && !selectedId) {
      toast({
        title: "Selection required",
        description: `Please select a ${type} to generate an affiliate link`,
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      const formData = new FormData()
      formData.append("userId", userId)
      formData.append("type", type)

      if (type === "external") {
        formData.append("externalUrl", externalUrl)
      } else {
        formData.append("promotionId", selectedId)
      }

      const result = await generateAffiliateLink(formData)

      if (result.success) {
        setAffiliateUrl(result.affiliateUrl)
        toast({
          title: "Affiliate link generated!",
          description: "Your affiliate link has been created successfully",
        })
      } else {
        toast({
          title: "Generation failed",
          description: result.error || "There was an error generating your affiliate link",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error generating affiliate link:", error)
      toast({
        title: "Generation failed",
        description: "There was an error generating your affiliate link",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(affiliateUrl)
    toast({
      title: "Copied to clipboard!",
      description: "The affiliate link has been copied to your clipboard",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Affiliate Link</CardTitle>
        <CardDescription>Create trackable links to earn commission on bookings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Link Type</Label>
          <RadioGroup
            value={type}
            onValueChange={(value) => {
              setType(value as any)
              setSelectedId("")
              setAffiliateUrl("")
            }}
          >
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="promotion" id="promotion" />
                <Label htmlFor="promotion">Promotion</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="itinerary" id="itinerary" />
                <Label htmlFor="itinerary">Itinerary</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="external" id="external" />
                <Label htmlFor="external">External URL</Label>
              </div>
            </div>
          </RadioGroup>
        </div>

        {type === "external" ? (
          <div className="space-y-2">
            <Label htmlFor="externalUrl">External URL</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="externalUrl"
                placeholder="https://example.com"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
              />
            </div>
          </div>
        ) : (
          <Tabs defaultValue={type === "promotion" ? "promotions" : "itineraries"}>
            <TabsList>
              <TabsTrigger
                value="promotions"
                disabled={type !== "promotion"}
                onClick={() => type !== "promotion" && setType("promotion")}
              >
                Promotions
              </TabsTrigger>
              <TabsTrigger
                value="itineraries"
                disabled={type !== "itinerary"}
                onClick={() => type !== "itinerary" && setType("itinerary")}
              >
                Itineraries
              </TabsTrigger>
            </TabsList>

            <TabsContent value="promotions" className="space-y-4">
              {promotions.length > 0 ? (
                <div className="space-y-2">
                  <Label htmlFor="promotionSelect">Select Promotion</Label>
                  <select
                    id="promotionSelect"
                    className="w-full p-2 border rounded-md"
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                  >
                    <option value="">Select a promotion</option>
                    {promotions.map((promo) => (
                      <option key={promo.id} value={promo.id}>
                        {promo.title}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No promotions available. Browse the discover page to find promotions.
                </div>
              )}
            </TabsContent>

            <TabsContent value="itineraries" className="space-y-4">
              {itineraries.length > 0 ? (
                <div className="space-y-2">
                  <Label htmlFor="itinerarySelect">Select Itinerary</Label>
                  <select
                    id="itinerarySelect"
                    className="w-full p-2 border rounded-md"
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                  >
                    <option value="">Select an itinerary</option>
                    {itineraries.map((itinerary) => (
                      <option key={itinerary.id} value={itinerary.id}>
                        {itinerary.title}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No itineraries available. Create or join itineraries first.
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || (type !== "external" && !selectedId) || (type === "external" && !externalUrl)}
          className="w-full"
        >
          {isGenerating ? "Generating..." : "Generate Affiliate Link"}
        </Button>

        {affiliateUrl && (
          <div className="mt-4 space-y-2">
            <Label htmlFor="affiliateUrl">Your Affiliate Link</Label>
            <div className="flex items-center space-x-2">
              <Input id="affiliateUrl" value={affiliateUrl} readOnly className="font-mono text-sm" />
              <Button size="icon" variant="outline" onClick={copyToClipboard}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" asChild>
                <a href={affiliateUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Share this link to earn commission on any bookings made through it
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
