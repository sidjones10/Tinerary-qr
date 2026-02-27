"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Rocket,
  Eye,
  Heart,
  Zap,
  ArrowUpRight,
  Check,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AppHeader } from "@/components/app-header"
import { createClient } from "@/lib/supabase/client"
import { getBoostCampaigns, createBoostCampaign, type BoostCampaign } from "@/lib/creator-service"
import { BOOST_PACKAGES } from "@/lib/tiers"
import { useToast } from "@/components/ui/use-toast"

export default function CreatorBoostPage() {
  const [campaigns, setCampaigns] = useState<BoostCampaign[]>([])
  const [itineraries, setItineraries] = useState<{ id: string; title: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItinerary, setSelectedItinerary] = useState("")
  const [selectedPackage, setSelectedPackage] = useState("")
  const [creating, setCreating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/auth?redirectTo=/creator/boost")
        return
      }

      const [campaignData, { data: iData }] = await Promise.all([
        getBoostCampaigns(session.user.id),
        supabase
          .from("itineraries")
          .select("id, title")
          .eq("user_id", session.user.id)
          .eq("is_public", true)
          .order("created_at", { ascending: false }),
      ])

      setCampaigns(campaignData)
      setItineraries(iData || [])
      setLoading(false)
    }
    load()
  }, [router])

  async function handleCreateBoost() {
    if (!selectedItinerary || !selectedPackage) return
    setCreating(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const result = await createBoostCampaign(session.user.id, selectedItinerary, selectedPackage)
    if (result.success) {
      toast({ title: "Boost created!", description: "Your post boost campaign is now active." })
      const updated = await getBoostCampaigns(session.user.id)
      setCampaigns(updated)
      setDialogOpen(false)
      setSelectedItinerary("")
      setSelectedPackage("")
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
    setCreating(false)
  }

  const activeCampaigns = campaigns.filter((c) => c.status === "active")
  const totalSpend = campaigns.reduce((sum, c) => sum + c.spent, 0)
  const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0)

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1">
        <div className="container px-4 py-6 md:py-10">
          <Link
            href="/creator"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Creator Hub
          </Link>

          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Rocket className="size-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Boost Posts</h1>
                <p className="text-sm text-muted-foreground">
                  Amplify your itineraries with targeted impressions
                </p>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-sunset">Boost a Post</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Post Boost</DialogTitle>
                  <DialogDescription>
                    Select an itinerary and boost package to amplify your content
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 mt-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Select Itinerary</label>
                    <Select value={selectedItinerary} onValueChange={setSelectedItinerary}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an itinerary..." />
                      </SelectTrigger>
                      <SelectContent>
                        {itineraries.map((it) => (
                          <SelectItem key={it.id} value={it.id}>
                            {it.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Select Package</label>
                    <div className="grid grid-cols-2 gap-3">
                      {BOOST_PACKAGES.map((pkg) => (
                        <div
                          key={pkg.name}
                          onClick={() => setSelectedPackage(pkg.name)}
                          className={`p-3 rounded-xl border cursor-pointer text-center transition-all ${
                            selectedPackage === pkg.name
                              ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                              : "border-border hover:border-primary/30"
                          }`}
                        >
                          <p className="text-lg font-bold text-primary">${pkg.price}</p>
                          <p className="text-sm font-semibold">{pkg.name}</p>
                          <p className="text-xs text-muted-foreground">{pkg.impressions} imp.</p>
                          <p className="text-xs text-muted-foreground">{pkg.duration}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={handleCreateBoost}
                    disabled={!selectedItinerary || !selectedPackage || creating}
                    className="btn-sunset w-full"
                  >
                    {creating ? "Creating..." : "Create Boost"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Boost Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Spend", value: `$${totalSpend.toFixed(2)}`, icon: Zap },
              { label: "Boosted Impressions", value: totalImpressions.toLocaleString(), icon: Eye },
              { label: "Active Boosts", value: activeCampaigns.length.toString(), icon: Rocket },
              { label: "Total Campaigns", value: campaigns.length.toString(), icon: ArrowUpRight },
            ].map((stat) => (
              <Card key={stat.label} className="border-border">
                <CardContent className="pt-6">
                  <stat.icon className="size-5 text-muted-foreground" />
                  <p className="mt-3 text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Boost Packages Info */}
          <Card className="border-border mb-8">
            <CardHeader>
              <CardTitle>Boost Packages</CardTitle>
              <CardDescription>Choose from four tiers of post amplification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {BOOST_PACKAGES.map((pkg) => (
                  <div
                    key={pkg.name}
                    className="flex flex-col items-center p-5 rounded-2xl bg-muted text-center border border-border"
                  >
                    <p className="text-2xl font-bold text-primary">${pkg.price}</p>
                    <p className="text-sm font-semibold text-foreground mt-1">{pkg.name}</p>
                    <div className="w-full h-px bg-border my-3" />
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Impressions:</span>{" "}
                      {pkg.impressions}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Duration:</span>{" "}
                      {pkg.duration}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cost per 1K: {pkg.costPer1K}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Campaigns */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="size-5 text-primary" /> Your Boost Campaigns
              </CardTitle>
              <CardDescription>Track and manage your active and past boosts</CardDescription>
            </CardHeader>
            <CardContent>
              {campaigns.length === 0 ? (
                <div className="text-center py-8">
                  <Rocket className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No boost campaigns yet. Create your first boost to amplify your content.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {campaigns.map((campaign) => {
                    const progress = campaign.budget > 0 ? (campaign.spent / campaign.budget) * 100 : 0
                    return (
                      <div
                        key={campaign.id}
                        className="p-4 rounded-xl bg-muted flex flex-col gap-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {campaign.itineraryTitle}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {campaign.packageName} &middot; Budget: $
                              {campaign.budget.toFixed(2)} &middot; Spent: $
                              {campaign.spent.toFixed(2)}
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className={
                              campaign.status === "active"
                                ? "bg-tinerary-peach text-tinerary-dark border-0"
                                : "bg-secondary text-secondary-foreground border-0"
                            }
                          >
                            {campaign.status}
                          </Badge>
                        </div>
                        <Progress
                          value={progress}
                          className="h-2 [&>[data-slot=progress-indicator]]:bg-primary"
                        />
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Eye className="size-3" /> {campaign.impressions.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Heart className="size-3" /> {campaign.engagement.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
