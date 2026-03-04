"use client"

import { useEffect, useState, useCallback } from "react"
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
  Sparkles,
  Pencil,
  Trash2,
  Archive,
  ToggleLeft,
  ToggleRight,
  FileText,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  getCreatorTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getUserItinerariesForTemplate,
  type ItineraryTemplate,
} from "@/lib/creator-service"
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

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400",
  draft: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400",
  archived: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
}

type FormData = {
  title: string
  description: string
  location: string
  duration: string
  price: string
  category: string
}

const emptyForm: FormData = {
  title: "",
  description: "",
  location: "",
  duration: "",
  price: "",
  category: "",
}

function validateForm(form: FormData): string | null {
  if (!form.title.trim() || form.title.trim().length < 3) {
    return "Title must be at least 3 characters"
  }
  if (!form.description.trim() || form.description.trim().length < 10) {
    return "Description must be at least 10 characters"
  }
  if (!form.location.trim()) {
    return "Location is required"
  }
  const duration = parseInt(form.duration)
  if (!duration || duration < 1) {
    return "Duration must be at least 1 day"
  }
  const price = parseFloat(form.price)
  if (!price || price < 1) {
    return "Price must be at least $1.00"
  }
  if (!form.category) {
    return "Category is required"
  }
  return null
}

export default function CreatorTemplatesPage() {
  const [templates, setTemplates] = useState<ItineraryTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState<FormData>({ ...emptyForm })
  const [itineraries, setItineraries] = useState<
    { id: string; title: string; description: string; location: string; duration: number; category: string }[]
  >([])
  const [loadingItineraries, setLoadingItineraries] = useState(false)
  const [selectedItineraryId, setSelectedItineraryId] = useState<string>("")

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<FormData>({ ...emptyForm })
  const [editingTemplate, setEditingTemplate] = useState<ItineraryTemplate | null>(null)

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deletingTemplate, setDeletingTemplate] = useState<ItineraryTemplate | null>(null)

  const router = useRouter()
  const { toast } = useToast()

  const refreshTemplates = useCallback(async (uid: string) => {
    const data = await getCreatorTemplates(uid)
    setTemplates(data)
  }, [])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/auth?redirectTo=/creator/templates")
        return
      }
      setUserId(session.user.id)
      await refreshTemplates(session.user.id)
      setLoading(false)
    }
    load()
  }, [router, refreshTemplates])

  // Load itineraries when create dialog opens
  useEffect(() => {
    if (createOpen && userId && itineraries.length === 0) {
      setLoadingItineraries(true)
      getUserItinerariesForTemplate(userId).then((data) => {
        setItineraries(data)
        setLoadingItineraries(false)
      })
    }
  }, [createOpen, userId, itineraries.length])

  function handleSelectItinerary(itineraryId: string) {
    setSelectedItineraryId(itineraryId)
    const it = itineraries.find((i) => i.id === itineraryId)
    if (it) {
      setCreateForm({
        title: it.title,
        description: it.description,
        location: it.location,
        duration: it.duration.toString(),
        price: "",
        category: it.category || "",
      })
    }
  }

  async function handleCreate() {
    const error = validateForm(createForm)
    if (error) {
      toast({ title: "Validation Error", description: error, variant: "destructive" })
      return
    }
    if (!userId) return
    setCreating(true)

    const result = await createTemplate(userId, {
      title: createForm.title.trim(),
      description: createForm.description.trim(),
      location: createForm.location.trim(),
      duration: parseInt(createForm.duration),
      price: parseFloat(parseFloat(createForm.price).toFixed(2)),
      category: createForm.category,
    })

    if (result.success) {
      toast({ title: "Template created!", description: "Your template is now listed on the marketplace." })
      await refreshTemplates(userId)
      setCreateOpen(false)
      setCreateForm({ ...emptyForm })
      setSelectedItineraryId("")
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
    setCreating(false)
  }

  function openEditDialog(template: ItineraryTemplate) {
    setEditingTemplate(template)
    setEditForm({
      title: template.title,
      description: template.description,
      location: template.location,
      duration: template.duration.toString(),
      price: template.price.toString(),
      category: template.category,
    })
    setEditOpen(true)
  }

  async function handleEdit() {
    const error = validateForm(editForm)
    if (error) {
      toast({ title: "Validation Error", description: error, variant: "destructive" })
      return
    }
    if (!userId || !editingTemplate) return
    setEditing(true)

    const result = await updateTemplate(userId, editingTemplate.id, {
      title: editForm.title.trim(),
      description: editForm.description.trim(),
      location: editForm.location.trim(),
      duration: parseInt(editForm.duration),
      price: parseFloat(parseFloat(editForm.price).toFixed(2)),
      category: editForm.category,
    })

    if (result.success) {
      toast({ title: "Template updated!", description: "Your changes have been saved." })
      await refreshTemplates(userId)
      setEditOpen(false)
      setEditingTemplate(null)
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
    setEditing(false)
  }

  async function handleToggleStatus(template: ItineraryTemplate) {
    if (!userId) return
    const newStatus = template.status === "active" ? "draft" : "active"
    const result = await updateTemplate(userId, template.id, { status: newStatus })

    if (result.success) {
      toast({
        title: newStatus === "active" ? "Template activated" : "Template set to draft",
        description: newStatus === "active"
          ? "Your template is now visible on the marketplace."
          : "Your template is no longer visible on the marketplace.",
      })
      await refreshTemplates(userId)
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
  }

  async function handleArchive(template: ItineraryTemplate) {
    if (!userId) return
    const result = await updateTemplate(userId, template.id, { status: "archived" })

    if (result.success) {
      toast({ title: "Template archived", description: "Your template has been archived." })
      await refreshTemplates(userId)
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
  }

  function openDeleteDialog(template: ItineraryTemplate) {
    setDeletingTemplate(template)
    setDeleteOpen(true)
  }

  async function handleDelete() {
    if (!userId || !deletingTemplate) return
    setDeleting(true)

    const result = await deleteTemplate(userId, deletingTemplate.id)

    if (result.success) {
      toast({ title: "Template deleted", description: "Your template has been permanently removed." })
      await refreshTemplates(userId)
      setDeleteOpen(false)
      setDeletingTemplate(null)
    } else {
      toast({ title: "Cannot delete", description: result.error, variant: "destructive" })
    }
    setDeleting(false)
  }

  const activeTemplates = templates.filter((t) => t.status === "active")
  const totalRevenue = templates.reduce((sum, t) => sum + t.salesCount * t.price, 0)
  const totalSales = templates.reduce((sum, t) => sum + t.salesCount, 0)

  // Template form fields shared between create and edit dialogs
  function TemplateFormFields({
    form,
    setForm,
  }: {
    form: FormData
    setForm: (f: FormData) => void
  }) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <Label htmlFor="template-title">Title</Label>
          <Input
            id="template-title"
            placeholder="e.g. 5-Day Paris Food & Culture Tour"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            maxLength={100}
          />
        </div>
        <div>
          <Label htmlFor="template-desc">Description</Label>
          <Textarea
            id="template-desc"
            placeholder="Describe what travelers will get: daily activities, hidden gems, restaurant picks, tips..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            maxLength={1000}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {form.description.length}/1000
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="template-location">Location</Label>
            <Input
              id="template-location"
              placeholder="e.g. Paris, France"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="template-duration">Duration (days)</Label>
            <Input
              id="template-duration"
              placeholder="e.g. 5"
              type="number"
              min={1}
              max={90}
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="template-price">Price (USD)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="template-price"
                className="pl-8"
                placeholder="e.g. 9.99"
                type="number"
                min={1}
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="template-category">Category</Label>
            <Select
              value={form.category}
              onValueChange={(val) => setForm({ ...form, category: val })}
            >
              <SelectTrigger id="template-category">
                <SelectValue placeholder="Select category" />
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
        </div>
      </div>
    )
  }

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

            {/* ─── Create Template Dialog ─── */}
            <Dialog open={createOpen} onOpenChange={(open) => {
              setCreateOpen(open)
              if (!open) {
                setCreateForm({ ...emptyForm })
                setSelectedItineraryId("")
              }
            }}>
              <DialogTrigger asChild>
                <Button className="btn-sunset">
                  <Plus className="size-4 mr-2" /> New Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Template</DialogTitle>
                  <DialogDescription>
                    Package your travel expertise into a sellable itinerary template.
                    You can start from scratch or pre-fill from one of your itineraries.
                  </DialogDescription>
                </DialogHeader>

                {/* Pre-fill from itinerary */}
                {itineraries.length > 0 && (
                  <div className="mb-2">
                    <Label htmlFor="from-itinerary">Pre-fill from itinerary</Label>
                    <Select
                      value={selectedItineraryId}
                      onValueChange={handleSelectItinerary}
                    >
                      <SelectTrigger id="from-itinerary">
                        <SelectValue placeholder="(Optional) Choose an itinerary..." />
                      </SelectTrigger>
                      <SelectContent>
                        {itineraries.map((it) => (
                          <SelectItem key={it.id} value={it.id}>
                            {it.title}
                            {it.location ? ` — ${it.location}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      This will pre-fill the form fields. You can still edit everything.
                    </p>
                  </div>
                )}
                {loadingItineraries && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Loader2 className="size-4 animate-spin" />
                    Loading your itineraries...
                  </div>
                )}

                <TemplateFormFields form={createForm} setForm={setCreateForm} />

                <DialogFooter className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCreateOpen(false)}
                    disabled={creating}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={creating}
                    className="btn-sunset"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Publish Template"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* ─── Stats ─── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Active Templates", value: loading ? "..." : activeTemplates.length.toString(), icon: ShoppingBag },
              { label: "Total Sales", value: loading ? "..." : totalSales.toLocaleString(), icon: TrendingUp },
              { label: "Revenue", value: loading ? "..." : `$${totalRevenue.toFixed(2)}`, icon: DollarSign },
              {
                label: "Avg Rating",
                value: loading
                  ? "..."
                  : templates.length > 0
                    ? (templates.reduce((sum, t) => sum + t.rating, 0) / templates.length).toFixed(1)
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

          {/* ─── Templates List ─── */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Your Templates</CardTitle>
              <CardDescription>
                Manage your itinerary templates on the marketplace
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-2xl border border-border overflow-hidden animate-pulse">
                      <div className="h-32 bg-muted" />
                      <div className="p-4 space-y-3">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-full" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : templates.length === 0 ? (
                <div className="cute-empty-state">
                  <div className="cute-empty-icon">
                    <ShoppingBag className="size-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Templates Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                    Turn your best itineraries into sellable templates. Share your travel expertise and earn.
                  </p>
                  <Button onClick={() => setCreateOpen(true)} className="btn-sunset">
                    <Sparkles className="size-4 mr-2" /> Create Your First Template
                  </Button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="cute-card rounded-2xl border border-border overflow-hidden group"
                    >
                      {/* Cover */}
                      <div className="h-32 bg-gradient-to-br from-tinerary-peach via-tinerary-salmon/20 to-[#7C3AED]/10 flex items-center justify-center relative">
                        {template.coverImage ? (
                          <img
                            src={template.coverImage}
                            alt={template.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ShoppingBag className="size-8 text-tinerary-salmon/60" />
                        )}
                        {/* Quick status toggle overlay */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 text-xs shadow-md"
                            onClick={() => handleToggleStatus(template)}
                          >
                            {template.status === "active" ? (
                              <><ToggleRight className="size-3 mr-1" /> Active</>
                            ) : (
                              <><ToggleLeft className="size-3 mr-1" /> Draft</>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-sm font-bold text-foreground truncate pr-2">
                            {template.title}
                          </h3>
                          <Badge
                            variant="secondary"
                            className={`${STATUS_STYLES[template.status] || ""} border-0 text-xs shrink-0`}
                          >
                            {template.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                          {template.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
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
                          {template.category && (
                            <span className="flex items-center gap-1">
                              <FileText className="size-3" /> {template.category}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-lg font-bold text-primary">${template.price.toFixed(2)}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{template.salesCount} sales</span>
                            {template.rating > 0 && (
                              <span className="flex items-center gap-0.5">
                                <Star className="size-3 fill-tinerary-gold text-tinerary-gold" />
                                {template.rating.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-2 border-t border-border">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 h-8 text-xs"
                            onClick={() => openEditDialog(template)}
                          >
                            <Pencil className="size-3 mr-1" /> Edit
                          </Button>
                          {template.status !== "archived" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs"
                              onClick={() => handleArchive(template)}
                              title="Archive template"
                            >
                              <Archive className="size-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs text-destructive hover:text-destructive"
                            onClick={() => openDeleteDialog(template)}
                            title={template.salesCount > 0 ? "Cannot delete: has sales" : "Delete template"}
                            disabled={template.salesCount > 0}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ─── Edit Template Dialog ─── */}
          <Dialog open={editOpen} onOpenChange={(open) => {
            setEditOpen(open)
            if (!open) setEditingTemplate(null)
          }}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Template</DialogTitle>
                <DialogDescription>
                  Update your template details. Changes are saved immediately.
                </DialogDescription>
              </DialogHeader>

              <TemplateFormFields form={editForm} setForm={setEditForm} />

              {editingTemplate && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2 border-t border-border">
                  <span>{editingTemplate.salesCount} sales</span>
                  {editingTemplate.rating > 0 && (
                    <span className="flex items-center gap-0.5">
                      <Star className="size-3 fill-tinerary-gold text-tinerary-gold" />
                      {editingTemplate.rating.toFixed(1)} ({editingTemplate.reviewCount} reviews)
                    </span>
                  )}
                  <span className="ml-auto">
                    Status: <Badge variant="secondary" className={`${STATUS_STYLES[editingTemplate.status] || ""} border-0 text-xs`}>
                      {editingTemplate.status}
                    </Badge>
                  </span>
                </div>
              )}

              <DialogFooter className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditOpen(false)}
                  disabled={editing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEdit}
                  disabled={editing}
                  className="btn-sunset"
                >
                  {editing ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ─── Delete Confirmation Dialog ─── */}
          <Dialog open={deleteOpen} onOpenChange={(open) => {
            setDeleteOpen(open)
            if (!open) setDeletingTemplate(null)
          }}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Delete Template</DialogTitle>
                <DialogDescription>
                  Are you sure you want to permanently delete{" "}
                  <span className="font-semibold text-foreground">
                    &ldquo;{deletingTemplate?.title}&rdquo;
                  </span>
                  ? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => setDeleteOpen(false)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Permanently"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          </PaywallGate>
        </div>
      </main>
    </div>
  )
}
