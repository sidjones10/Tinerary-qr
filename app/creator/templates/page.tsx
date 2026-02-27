"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ShoppingBag,
  Plus,
  Star,
  MapPin,
  Clock,
  DollarSign,
  TrendingUp,
  Eye,
  Sparkles,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { PaywallGate } from "@/components/paywall-gate"
import { createClient } from "@/lib/supabase/client"
import { getCreatorTemplates, createTemplate, type ItineraryTemplate } from "@/lib/creator-service"
import { useToast } from "@/components/ui/use-toast"

const categories = [
  "Beach & Coastal",
  "City Break",
  "Adventure",
  "Food & Wine",
  "Cultural",
  "Wellness & Spa",
  "Road Trip",
  "Budget Travel",
  "Luxury",
  "Family",
]

const STAT_ACCENTS = [
  "stat-accent-salmon",
  "stat-accent-green",
  "stat-accent-gold",
  "stat-accent-purple",
]

const STAT_ICON_COLORS = [
  { color: "text-tinerary-salmon", bg: "bg-tinerary-salmon/10" },
  { color: "text-green-500", bg: "bg-green-500/10" },
  { color: "text-tinerary-gold", bg: "bg-tinerary-gold/10" },
  { color: "text-[#7C3AED]", bg: "bg-[#7C3AED]/10" },
]

export default function CreatorTemplatesPage() {
  const [templates, setTemplates] = useState<ItineraryTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    duration: "",
    price: "",
    category: "",
  })
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/auth?redirectTo=/creator/templates")
        return
      }
      const data = await getCreatorTemplates(session.user.id)
      setTemplates(data)
      setLoading(false)
    }
    load()
  }, [router])

  async function handleCreate() {
    if (!form.title || !form.description || !form.price) {
      toast({ title: "Missing fields", description: "Please fill in title, description, and price", variant: "destructive" })
      return
    }
    setCreating(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const result = await createTemplate(session.user.id, {
      title: form.title,
      description: form.description,
      location: form.location,
      duration: parseInt(form.duration) || 0,
      price: parseFloat(form.price),
      category: form.category || "General",
    })

    if (result.success) {
      toast({ title: "Template created!", description: "Your template is now listed on the marketplace." })
      const updated = await getCreatorTemplates(session.user.id)
      setTemplates(updated)
      setDialogOpen(false)
      setForm({ title: "", description: "", location: "", duration: "", price: "", category: "" })
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
    setCreating(false)
  }

  const totalRevenue = templates.reduce((sum, t) => sum + t.salesCount * t.price, 0)
  const totalSales = templates.reduce((sum, t) => sum + t.salesCount, 0)

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

          <PaywallGate gate="creator_templates">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-tinerary-salmon/10 flex items-center justify-center">
                <ShoppingBag className="size-6 text-tinerary-salmon" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Sell Templates</h1>
                <p className="text-sm text-muted-foreground">
                  Create and sell premium itinerary templates
                </p>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-sunset">
                  <Plus className="size-4 mr-2" /> New Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Template</DialogTitle>
                  <DialogDescription>
                    Package your travel expertise into a sellable itinerary template
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 mt-4">
                  <Input
                    placeholder="Template title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                  <Textarea
                    placeholder="Describe what travelers will get..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Location (e.g. Paris)"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                    />
                    <Input
                      placeholder="Duration (days)"
                      type="number"
                      value={form.duration}
                      onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Price ($)"
                      type="number"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                    />
                    <Select
                      value={form.category}
                      onValueChange={(val) => setForm({ ...form, category: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleCreate}
                    disabled={creating}
                    className="btn-sunset w-full"
                  >
                    {creating ? "Creating..." : "Publish Template"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Templates", value: templates.length.toString(), icon: ShoppingBag },
              { label: "Total Sales", value: totalSales.toLocaleString(), icon: TrendingUp },
              { label: "Revenue", value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign },
              {
                label: "Avg Rating",
                value:
                  templates.length > 0
                    ? (
                        templates.reduce((sum, t) => sum + t.rating, 0) / templates.length
                      ).toFixed(1)
                    : "0",
                icon: Star,
              },
            ].map((stat, i) => (
              <Card key={stat.label} className={`border-border ${STAT_ACCENTS[i]}`}>
                <CardContent className="pt-6">
                  <div className={`size-8 rounded-lg ${STAT_ICON_COLORS[i].bg} flex items-center justify-center mb-2`}>
                    <stat.icon className={`size-4 ${STAT_ICON_COLORS[i].color}`} />
                  </div>
                  <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Templates List */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Your Templates</CardTitle>
              <CardDescription>
                Manage your itinerary templates on the marketplace
              </CardDescription>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <div className="cute-empty-state">
                  <div className="cute-empty-icon">
                    <ShoppingBag className="size-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Templates Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                    Turn your best itineraries into sellable templates. Share your travel expertise and earn.
                  </p>
                  <Button onClick={() => setDialogOpen(true)} className="btn-sunset">
                    <Sparkles className="size-4 mr-2" /> Create Your First Template
                  </Button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="cute-card rounded-2xl border border-border overflow-hidden"
                    >
                      <div className="h-32 bg-gradient-to-br from-tinerary-peach via-tinerary-salmon/20 to-[#7C3AED]/10 flex items-center justify-center">
                        {template.coverImage ? (
                          <img
                            src={template.coverImage}
                            alt={template.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ShoppingBag className="size-8 text-tinerary-salmon/60" />
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-sm font-bold text-foreground truncate">
                            {template.title}
                          </h3>
                          <Badge
                            variant="secondary"
                            className={
                              template.status === "active"
                                ? "bg-tinerary-peach text-tinerary-dark border-0 text-xs"
                                : "bg-secondary text-secondary-foreground border-0 text-xs"
                            }
                          >
                            {template.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                          {template.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                          {template.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="size-3" /> {template.location}
                            </span>
                          )}
                          {template.duration > 0 && (
                            <span className="flex items-center gap-1">
                              <Clock className="size-3" /> {template.duration}d
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-bold text-primary">${template.price}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{template.salesCount} sales</span>
                            {template.rating > 0 && (
                              <span className="flex items-center gap-0.5">
                                <Star className="size-3 fill-tinerary-gold text-tinerary-gold" />
                                {template.rating}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          </PaywallGate>
        </div>
      </main>
    </div>
  )
}
