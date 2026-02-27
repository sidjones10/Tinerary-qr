"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Building2, Check, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AppHeader } from "@/components/app-header"
import { BUSINESS_TIERS } from "@/lib/tiers"
import type { BusinessTierSlug } from "@/lib/tiers"
import { createBusiness } from "@/app/actions/business-actions"

const CATEGORIES = [
  "Accommodation",
  "Activities & Tours",
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Wellness & Spa",
  "Travel Services",
  "Other",
]

export default function BusinessOnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedTier = searchParams.get("tier") as BusinessTierSlug | null

  const [step, setStep] = useState<1 | 2>(preselectedTier ? 2 : 1)
  const [selectedTier, setSelectedTier] = useState<BusinessTierSlug>(
    preselectedTier && ["basic", "premium", "enterprise"].includes(preselectedTier)
      ? preselectedTier
      : "basic"
  )
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [website, setWebsite] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    setError(null)
    setSubmitting(true)

    const formData = new FormData()
    formData.set("name", name)
    formData.set("category", category)
    formData.set("description", description)
    formData.set("website", website)
    formData.set("tier", selectedTier)

    const result = await createBusiness(formData)

    if (result && "success" in result) {
      if (result.success) {
        router.push("/business-profile")
      } else {
        setError(result.error || "Something went wrong. Please try again.")
        setSubmitting(false)
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1">
        <div className="container max-w-3xl px-4 py-6 md:py-10">
          <Link
            href="/business"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Business Plans
          </Link>

          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Building2 className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {step === 1 ? "Choose Your Plan" : "Set Up Your Business"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {step === 1
                  ? "Select the plan that fits your business."
                  : "Tell us about your business to get started."}
              </p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            <div
              className={`flex items-center justify-center size-7 rounded-full text-xs font-bold ${
                step >= 1
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step > 1 ? <Check className="size-3.5" /> : "1"}
            </div>
            <div className={`h-px flex-1 ${step > 1 ? "bg-primary" : "bg-border"}`} />
            <div
              className={`flex items-center justify-center size-7 rounded-full text-xs font-bold ${
                step >= 2
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              2
            </div>
          </div>

          {/* Step 1: Tier Selection */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              {BUSINESS_TIERS.map((tier) => (
                <button
                  key={tier.slug}
                  type="button"
                  onClick={() => setSelectedTier(tier.slug)}
                  className={`w-full text-left rounded-xl border p-5 transition-all ${
                    selectedTier === tier.slug
                      ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`size-4 rounded-full border-2 flex items-center justify-center ${
                          selectedTier === tier.slug
                            ? "border-primary"
                            : "border-muted-foreground/40"
                        }`}
                      >
                        {selectedTier === tier.slug && (
                          <div className="size-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <h3 className="font-semibold text-foreground">{tier.name}</h3>
                      {tier.highlighted && (
                        <span className="text-[10px] font-medium bg-tinerary-peach text-tinerary-dark px-2 py-0.5 rounded-full">
                          Most Popular
                        </span>
                      )}
                    </div>
                    <span className="text-lg font-bold text-foreground">
                      ${tier.price}
                      <span className="text-xs font-normal text-muted-foreground">
                        /{tier.priceSuffix}
                      </span>
                    </span>
                  </div>
                  <div className="ml-7 flex flex-wrap gap-x-4 gap-y-1">
                    {tier.features.slice(0, 4).map((f) => (
                      <span key={f} className="text-xs text-muted-foreground flex items-center gap-1">
                        <Check className="size-3 text-primary shrink-0" />
                        {f}
                      </span>
                    ))}
                    {tier.features.length > 4 && (
                      <span className="text-xs text-muted-foreground">
                        +{tier.features.length - 4} more
                      </span>
                    )}
                  </div>
                </button>
              ))}

              <Button
                className="btn-sunset mt-4 self-end"
                size="lg"
                onClick={() => setStep(2)}
              >
                Continue
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </div>
          )}

          {/* Step 2: Business Details */}
          {step === 2 && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Business Details</CardTitle>
                <CardDescription>
                  Selected plan:{" "}
                  <span className="font-medium text-foreground">
                    {BUSINESS_TIERS.find((t) => t.slug === selectedTier)?.name} — $
                    {BUSINESS_TIERS.find((t) => t.slug === selectedTier)?.price}/
                    {BUSINESS_TIERS.find((t) => t.slug === selectedTier)?.priceSuffix}
                  </span>
                  {!preselectedTier && (
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="ml-2 text-primary hover:underline text-xs"
                    >
                      Change
                    </button>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-5">
                  {/* Business Name */}
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="name">
                      Business Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="e.g. Sunset Beach Resort"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={100}
                    />
                  </div>

                  {/* Category */}
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="category">
                      Category <span className="text-destructive">*</span>
                    </Label>
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Select a category</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Briefly describe what your business offers to travelers..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      maxLength={500}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {description.length}/500
                    </p>
                  </div>

                  {/* Website */}
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      placeholder="https://yourbusiness.com"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </div>

                  {/* Error */}
                  {error && (
                    <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                      {error}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    {!preselectedTier ? (
                      <Button variant="ghost" onClick={() => setStep(1)}>
                        <ArrowLeft className="mr-2 size-4" />
                        Back
                      </Button>
                    ) : (
                      <div />
                    )}
                    <Button
                      className="btn-sunset"
                      size="lg"
                      disabled={!name.trim() || !category || submitting}
                      onClick={handleSubmit}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          Create Business
                          <ArrowRight className="ml-2 size-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
