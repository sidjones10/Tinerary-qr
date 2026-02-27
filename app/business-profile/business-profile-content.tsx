"use client"

import { useCallback, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  MapPin,
  Globe,
  Star,
  Clock,
  Users,
  Eye,
  CalendarDays,
  CheckCircle2,
  ArrowUpRight,
  Trash2,
  Tag,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { CreateDealDialog } from "@/components/create-deal-dialog"
import { deleteDeal } from "@/app/actions/promotion-actions"

interface BusinessData {
  id: string
  name: string
  description: string | null
  logo: string | null
  website: string | null
  category: string
  rating: number | null
  review_count: number | null
  created_at: string
}

interface DealData {
  id: string
  title: string
  type: string
  category: string
  status: string
  location: string
  price: number | null
  discount: number | null
  start_date: string
  end_date: string
  promotion_metrics?: {
    views: number
    clicks: number
    saves: number
  } | null
}

export function BusinessProfileContent() {
  const [business, setBusiness] = useState<BusinessData | null>(null)
  const [deals, setDeals] = useState<DealData[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { toast } = useToast()

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      setLoading(false)
      return
    }

    // Fetch business profile
    const { data: biz } = await supabase
      .from("businesses")
      .select("*")
      .eq("user_id", session.user.id)
      .single()

    if (biz) {
      setBusiness(biz)

      // Fetch deals for this business
      const { data: promos } = await supabase
        .from("promotions")
        .select("*, promotion_metrics(*)")
        .eq("business_id", biz.id)
        .order("created_at", { ascending: false })

      setDeals(promos || [])
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleDeleteDeal(id: string) {
    setDeletingId(id)
    try {
      const result = await deleteDeal(id)
      if (result && "success" in result && result.success) {
        setDeals((prev: DealData[]) => prev.filter((d: DealData) => d.id !== id))
        toast({ title: "Deal deleted" })
      } else {
        toast({ title: "Error", description: "Failed to delete deal.", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete deal.", variant: "destructive" })
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="mt-6 flex flex-col gap-6">
        <Card className="overflow-hidden border-border animate-pulse">
          <div className="h-32 bg-muted" />
          <CardContent className="pt-6"><div className="h-6 w-48 bg-muted rounded" /></CardContent>
        </Card>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="mt-6">
        <Card className="border-border">
          <CardContent className="py-12 text-center">
            <Tag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Business Profile Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create a business profile to start listing deals and reaching travelers on Tinerary.
            </p>
            <p className="text-xs text-muted-foreground">
              To get started, upgrade to a business account on the{" "}
              <a href="/business" className="text-primary hover:underline">Business Plans</a> page.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const activeDeals = deals.filter((d) => d.status === "active")
  const totalViews = deals.reduce((sum, d) => sum + ((d.promotion_metrics as any)?.views || 0), 0)
  const totalClicks = deals.reduce((sum, d) => sum + ((d.promotion_metrics as any)?.clicks || 0), 0)
  const totalSaves = deals.reduce((sum, d) => sum + ((d.promotion_metrics as any)?.saves || 0), 0)

  return (
    <div className="mt-6 flex flex-col gap-6">
      {/* Profile Card */}
      <Card className="overflow-hidden border-border">
        <div className="h-32 bg-gradient-to-r from-tinerary-peach to-secondary" />
        <CardContent className="relative -mt-12">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="size-24 rounded-2xl bg-card border-4 border-card flex items-center justify-center shadow-md">
              {business.logo ? (
                <img src={business.logo} alt={business.name} className="size-full rounded-2xl object-cover" />
              ) : (
                <span className="text-3xl font-bold text-tinerary-salmon">
                  {business.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">{business.name}</h2>
                <CheckCircle2 className="size-5 text-primary" />
              </div>
              {business.description && (
                <p className="text-sm text-muted-foreground mt-0.5">{business.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Tag className="size-3" /> {business.category}
                </span>
                {business.website && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Globe className="size-3" /> {business.website}
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" /> Joined {new Date(business.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </span>
                {business.rating && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="size-3" /> {business.rating} ({business.review_count || 0} reviews)
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Views", value: totalViews.toLocaleString(), icon: Eye },
          { label: "Total Clicks", value: totalClicks.toLocaleString(), icon: ArrowUpRight },
          { label: "Total Saves", value: totalSaves.toLocaleString(), icon: CalendarDays },
          { label: "Active Deals", value: activeDeals.length.toString(), icon: Tag },
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

      {/* Deals Management */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Deals</CardTitle>
              <CardDescription>Create and manage deals that travelers will see on Tinerary</CardDescription>
            </div>
            <CreateDealDialog onDealCreated={loadData} />
          </div>
        </CardHeader>
        <CardContent>
          {deals.length === 0 ? (
            <div className="text-center py-8">
              <Tag className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No deals yet. Create your first deal to start reaching travelers.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {deals.map((deal) => (
                <div
                  key={deal.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{deal.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {deal.type} &middot; {deal.category} &middot; {deal.location}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(deal.start_date).toLocaleDateString()} – {new Date(deal.end_date).toLocaleDateString()}
                      {deal.price != null && ` · $${deal.price}`}
                      {deal.discount != null && ` · ${deal.discount}% off`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <div className="text-right mr-2 hidden sm:block">
                      <p className="text-xs text-muted-foreground">
                        {(deal.promotion_metrics as any)?.views || 0} views
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={
                        deal.status === "active"
                          ? "bg-tinerary-peach text-tinerary-dark border-0"
                          : "bg-secondary text-secondary-foreground border-0"
                      }
                    >
                      {deal.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteDeal(deal.id)}
                      disabled={deletingId === deal.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
