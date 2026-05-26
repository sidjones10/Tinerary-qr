"use client"

import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { Printer, AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { parseLocalDate } from "@/lib/utils"

// Passport-holder printable dimensions (inches) — portrait orientation
const PASSPORT_WIDTH_IN = 3.4
const PASSPORT_HEIGHT_IN = 4.9

// Rough capacity heuristic for the passport preview (used for the multi-page warning)
const ACTIVITIES_PER_PAGE = 6

// Charge applied when the user opts to print without the Tinerary logo
const LOGO_REMOVAL_PRICE_USD = 1.4

// Palette taken from the Canva-style reference
const COLOR_CREAM = "#e6dccb"
const COLOR_GREEN = "#7a8c4f"
const COLOR_PILL = "#b9b1a7"
const COLOR_TEXT = "#1f1f1f"
const COLOR_TEXT_MUTED = "#5a5a5a"

interface Activity {
  id?: string
  title?: string | null
  start_time?: string | null
  location?: string | null
}

interface PassportPrintButtonProps {
  event: {
    id: string
    title: string
    description?: string | null
    start_date?: string | null
    end_date?: string | null
    location?: string | null
    activities?: Activity[] | null
  }
}

const formatTime = (iso?: string | null) => {
  if (!iso) return ""
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ""
  return d
    .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    .replace(/\s+/g, " ")
}

const formatDateRange = (start?: string | null, end?: string | null) => {
  if (!start) return ""
  const s = parseLocalDate(start)
  if (!end || end === start) {
    return s.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
  }
  const e = parseLocalDate(end)
  const sameYear = s.getFullYear() === e.getFullYear()
  const sameMonth = sameYear && s.getMonth() === e.getMonth()
  if (sameMonth) {
    return `${s.toLocaleDateString(undefined, { month: "short" })} ${s.getDate()}–${e.getDate()}, ${e.getFullYear()}`
  }
  return `${s.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${e.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`
}

interface Day {
  key: string
  index: number
  activities: Activity[]
}

const groupActivitiesByDay = (activities: Activity[]): Day[] => {
  const map = new Map<string, Day>()
  const undated: Activity[] = []

  for (const a of activities) {
    if (!a.start_time) {
      undated.push(a)
      continue
    }
    const d = new Date(a.start_time)
    if (isNaN(d.getTime())) {
      undated.push(a)
      continue
    }
    const key = d.toDateString()
    if (!map.has(key)) {
      map.set(key, { key, index: map.size + 1, activities: [] })
    }
    map.get(key)!.activities.push(a)
  }

  const days = Array.from(map.values()).sort(
    (a, b) => new Date(a.key).getTime() - new Date(b.key).getTime(),
  )
  days.forEach((d, i) => (d.index = i + 1))
  if (undated.length > 0) {
    days.push({ key: "undated", index: days.length + 1, activities: undated })
  }
  return days
}

/**
 * Build a closed, wavy rounded-rectangle path used as the green frame ribbon.
 * Stroking this path with a thick width produces the scalloped border look.
 */
function buildWavyFramePath(
  w: number,
  h: number,
  margin: number,
  bumpsX: number,
  bumpsY: number,
  amp: number,
): string {
  const innerW = w - 2 * margin
  const innerH = h - 2 * margin
  const segX = innerW / bumpsX
  const segY = innerH / bumpsY

  let d = `M ${margin} ${margin}`

  for (let i = 0; i < bumpsX; i++) {
    const dir = i % 2 === 0 ? -1 : 1
    d += ` q ${segX / 2} ${dir * amp} ${segX} 0`
  }
  for (let i = 0; i < bumpsY; i++) {
    const dir = i % 2 === 0 ? 1 : -1
    d += ` q ${dir * amp} ${segY / 2} 0 ${segY}`
  }
  for (let i = 0; i < bumpsX; i++) {
    const dir = i % 2 === 0 ? 1 : -1
    d += ` q ${-segX / 2} ${dir * amp} ${-segX} 0`
  }
  for (let i = 0; i < bumpsY; i++) {
    const dir = i % 2 === 0 ? -1 : 1
    d += ` q ${dir * amp} ${-segY / 2} 0 ${-segY}`
  }
  return d + " Z"
}

// ---------------------------------------------------------------------------
// Template registry — each template renders a single passport-sized page given
// the same data shape. Add new templates by registering them here.
// ---------------------------------------------------------------------------

export interface TemplateProps {
  title: string
  dateRange?: string
  location?: string
  description?: string
  days: Day[]
  includeLogo: boolean
  pageIndex: number
  pageCount: number
}

interface Template {
  id: string
  name: string
  description: string
  Component: (props: TemplateProps) => JSX.Element
}

const TEMPLATES: Template[] = [
  {
    id: "wavy-garden",
    name: "Wavy Garden",
    description: "Cream background with a scalloped green border.",
    Component: WavyGardenTemplate,
  },
  {
    id: "tokyo-timeline",
    name: "Tokyo Timeline",
    description: "Minimal black & white with a vertical timeline.",
    Component: TokyoTimelineTemplate,
  },
]

export function PassportPrintButton({ event }: PassportPrintButtonProps) {
  const [open, setOpen] = useState(false)
  const [includeLogo, setIncludeLogo] = useState(true)
  const [isPrinting, setIsPrinting] = useState(false)
  const [templateId, setTemplateId] = useState<string>(TEMPLATES[0].id)
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()

  useEffect(() => setMounted(true), [])

  const template = TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0]

  const activities = (event.activities || []) as Activity[]
  const totalActivities = activities.length
  const willOverflow = totalActivities > ACTIVITIES_PER_PAGE
  const estimatedPages = Math.max(1, Math.ceil(totalActivities / ACTIVITIES_PER_PAGE))
  const dateRange = formatDateRange(event.start_date, event.end_date)

  // Split activities (in order) into pages, then regroup each page into days
  const pages: Day[][] = useMemo(() => {
    if (activities.length === 0) return [[]]
    const result: Day[][] = []
    for (let i = 0; i < activities.length; i += ACTIVITIES_PER_PAGE) {
      const slice = activities.slice(i, i + ACTIVITIES_PER_PAGE)
      result.push(groupActivitiesByDay(slice))
    }
    return result
  }, [activities])

  const handlePrint = async () => {
    if (!includeLogo) {
      const confirmed = window.confirm(
        `Printing without the Tinerary logo costs $${LOGO_REMOVAL_PRICE_USD.toFixed(2)}. Continue?`,
      )
      if (!confirmed) return
      toast({
        title: "Logo removal selected",
        description: `A $${LOGO_REMOVAL_PRICE_USD.toFixed(2)} charge will be added to your account.`,
      })
    }

    setIsPrinting(true)
    await new Promise((r) => setTimeout(r, 50))
    try {
      window.print()
    } finally {
      setIsPrinting(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="bg-white/20 backdrop-blur-sm border-white/40 text-white hover:bg-white/30"
        onClick={() => setOpen(true)}
        aria-label="Print passport-sized itinerary"
      >
        <Printer className="h-4 w-4" />
        <span className="hidden sm:inline ml-2">Print</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl print:hidden">
          <DialogHeader>
            <DialogTitle>Print passport-sized itinerary</DialogTitle>
            <DialogDescription>
              Prints at {PASSPORT_WIDTH_IN}&quot; × {PASSPORT_HEIGHT_IN}&quot; so it fits in a passport holder.
            </DialogDescription>
          </DialogHeader>

          {willOverflow && (
            <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                Your itinerary will print across <strong>{estimatedPages} pages</strong>. Each page is
                {" "}{PASSPORT_WIDTH_IN}&quot; × {PASSPORT_HEIGHT_IN}&quot;.
              </div>
            </div>
          )}

          {/* Template selector */}
          {TEMPLATES.length > 1 && (
            <div className="space-y-2">
              <Label>Template</Label>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplateId(t.id)}
                    className={`rounded-md border p-3 text-left text-sm transition ${
                      templateId === t.id
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-input hover:bg-muted"
                    }`}
                  >
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* On-screen preview (first page) */}
          <div className="flex justify-center py-2">
            <div
              style={{
                width: `${PASSPORT_WIDTH_IN}in`,
                height: `${PASSPORT_HEIGHT_IN}in`,
                boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
              }}
            >
              <template.Component
                title={event.title}
                dateRange={dateRange}
                location={event.location || undefined}
                description={event.description || undefined}
                days={pages[0] || []}
                includeLogo={includeLogo}
                pageIndex={0}
                pageCount={estimatedPages}
              />
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="passport-include-logo"
              checked={includeLogo}
              onCheckedChange={(v) => setIncludeLogo(v === true)}
            />
            <div className="space-y-1 leading-none">
              <Label htmlFor="passport-include-logo" className="cursor-pointer">
                Include Tinerary logo (free)
              </Label>
              <p className="text-xs text-muted-foreground">
                Uncheck to print without branding for ${LOGO_REMOVAL_PRICE_USD.toFixed(2)}.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePrint} disabled={isPrinting}>
              {isPrinting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Preparing…
                </>
              ) : (
                <>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print pages — portaled directly into <body> so we can fully hide the
          rest of the page during print (display: none, not just visibility). */}
      {mounted &&
        createPortal(
          <div className="passport-print-root" aria-hidden>
            {pages.map((pageDays, pageIndex) => (
              <div key={pageIndex} className="passport-print-page">
                <template.Component
                  title={event.title}
                  dateRange={dateRange}
                  location={event.location || undefined}
                  description={event.description || undefined}
                  days={pageDays}
                  includeLogo={includeLogo}
                  pageIndex={pageIndex}
                  pageCount={estimatedPages}
                />
              </div>
            ))}
          </div>,
          document.body,
        )}

      <style jsx global>{`
        .passport-print-root {
          display: none;
        }
        @media print {
          @page {
            size: ${PASSPORT_WIDTH_IN}in ${PASSPORT_HEIGHT_IN}in;
            margin: 0;
          }
          html,
          body {
            background: #fff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body > *:not(.passport-print-root) {
            display: none !important;
          }
          .passport-print-root {
            display: block !important;
            position: static !important;
            width: ${PASSPORT_WIDTH_IN}in !important;
          }
          .passport-print-page {
            width: ${PASSPORT_WIDTH_IN}in;
            height: ${PASSPORT_HEIGHT_IN}in;
            page-break-after: always;
            break-after: page;
            overflow: hidden;
          }
          .passport-print-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }
        }
      `}</style>
    </>
  )
}

function PinIcon({ size = 7, color = COLOR_TEXT_MUTED }: { size?: number; color?: string }) {
  return (
    <svg
      width={`${size}pt`}
      height={`${size}pt`}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <path d="M12 22s-7-7.58-7-12a7 7 0 0 1 14 0c0 4.42-7 12-7 12z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  )
}

function ClockIcon({ size = 7, color = COLOR_TEXT_MUTED }: { size?: number; color?: string }) {
  return (
    <svg
      width={`${size}pt`}
      height={`${size}pt`}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

/**
 * Renders the real Tinerary brand wordmark. `variant="yellow"` uses the
 * print-ready yellow lockup; `variant="orange"` uses the primary brand orange.
 */
function TineraryWordmark({
  height,
  rotate = 0,
  variant = "yellow",
}: {
  height: string
  rotate?: number
  variant?: "yellow" | "orange"
}) {
  const src = variant === "orange" ? "/email/tinerary-logo.png" : "/tinerary-logo-yellow.png"
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Tinerary"
      style={{
        height,
        width: "auto",
        display: "block",
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
        userSelect: "none",
        pointerEvents: "none",
      }}
    />
  )
}

function WavyGardenTemplate({ title, dateRange, location, days, includeLogo, pageIndex, pageCount }: TemplateProps) {
  const subtitle = [dateRange, location].filter(Boolean).join(" · ")
  // SVG viewBox is in centi-inches (each unit = 0.01 in) so paths scale cleanly
  const VB_W = PASSPORT_WIDTH_IN * 100 // 340
  const VB_H = PASSPORT_HEIGHT_IN * 100 // 490
  const wavyPath = buildWavyFramePath(VB_W, VB_H, 30, 11, 17, 7)

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: COLOR_CREAM,
        color: COLOR_TEXT,
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        position: "relative",
        overflow: "hidden",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      } as React.CSSProperties}
    >
      {/* Scattered TINERARY wordmarks — rendered behind the wavy frame so they peek out */}
      {includeLogo && (
        <>
          <div style={{ position: "absolute", top: "-0.12in", left: "0.5in", zIndex: 1 }}>
            <TineraryWordmark height="0.28in" />
          </div>
          <div style={{ position: "absolute", top: "0.2in", right: "-0.25in", zIndex: 1 }}>
            <TineraryWordmark height="0.22in" />
          </div>
          <div style={{ position: "absolute", top: "1.7in", left: "-0.3in", zIndex: 1 }}>
            <TineraryWordmark height="0.2in" />
          </div>
          <div style={{ position: "absolute", top: "2.5in", right: "-0.25in", zIndex: 1 }}>
            <TineraryWordmark height="0.2in" />
          </div>
          <div style={{ position: "absolute", bottom: "1.4in", left: "-0.2in", zIndex: 1 }}>
            <TineraryWordmark height="0.2in" />
          </div>
          <div style={{ position: "absolute", bottom: "-0.08in", left: "0.35in", zIndex: 1 }}>
            <TineraryWordmark height="0.26in" />
          </div>
        </>
      )}

      {/* Wavy green frame */}
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 2,
        }}
      >
        <path
          d={wavyPath}
          fill="none"
          stroke={COLOR_GREEN}
          strokeWidth={28}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>

      {/* Content layer — inside the frame */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "0.55in 0.4in 0.45in 0.4in",
          display: "flex",
          flexDirection: "column",
          zIndex: 3,
        }}
      >
        {/* Title pill */}
        <div
          style={{
            background: COLOR_PILL,
            borderRadius: "0.18in",
            padding: "0.1in 0.14in",
            textAlign: "center",
            marginBottom: "0.16in",
            boxShadow: "0 1px 0 rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              fontFamily: "'Anton', 'Archivo Black', 'Bebas Neue', 'Impact', sans-serif",
              fontSize: "15pt",
              fontWeight: 400,
              letterSpacing: "0.04em",
              color: "#1a1a1a",
              textTransform: "uppercase",
              lineHeight: 1,
              wordBreak: "break-word",
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: "6.5pt", color: "#3a3a3a", marginTop: "0.02in", letterSpacing: "0.02em" }}>
              {subtitle}
            </div>
          )}
        </div>

        {/* Days & activities */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", gap: "0.1in" }}>
          {days.length === 0 && (
            <div style={{ fontSize: "8pt", color: "#888", marginTop: "0.1in" }}>
              No scheduled activities yet.
            </div>
          )}
          {days.map((day) => (
            <div key={day.key} style={{ display: "flex", flexDirection: "column", gap: "0.05in" }}>
              <div
                style={{
                  fontSize: "8.5pt",
                  fontWeight: 700,
                  color: "#2a2a2a",
                  marginBottom: "0.02in",
                  paddingLeft: "0.02in",
                }}
              >
                {day.key === "undated" ? "Other" : `Day ${day.index}`}
              </div>
              {day.activities.map((a, idx) => (
                <ActivityCard key={a.id || idx} activity={a} />
              ))}
            </div>
          ))}
        </div>

        {pageCount > 1 && (
          <div
            style={{
              fontSize: "6pt",
              color: "#777",
              textAlign: "right",
              marginTop: "0.04in",
            }}
          >
            {pageIndex + 1} / {pageCount}
          </div>
        )}
      </div>
    </div>
  )
}

function ActivityCard({ activity }: { activity: Activity }) {
  const time = formatTime(activity.start_time)
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "0.08in",
        padding: "0.07in 0.1in",
        boxShadow: "0 0.5pt 1pt rgba(0,0,0,0.08)",
        display: "flex",
        flexDirection: "column",
        gap: "0.02in",
      }}
    >
      <div
        style={{
          fontSize: "8pt",
          fontWeight: 700,
          color: COLOR_TEXT,
          lineHeight: 1.15,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {activity.title || "Untitled"}
      </div>
      {activity.location && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.03in",
            fontSize: "6.5pt",
            color: COLOR_TEXT_MUTED,
            lineHeight: 1.1,
          }}
        >
          <PinIcon />
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "2.3in",
            }}
          >
            {activity.location}
          </span>
        </div>
      )}
      {time && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.03in",
            fontSize: "6.5pt",
            color: COLOR_TEXT_MUTED,
            lineHeight: 1.1,
          }}
        >
          <ClockIcon />
          <span>{time}</span>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Template 2 — Tokyo Timeline (clean black & white with vertical timeline)
// ---------------------------------------------------------------------------

const SERIF_STACK =
  "'Cormorant Garamond', 'Playfair Display', Georgia, 'Times New Roman', serif"
const SANS_STACK =
  "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"

function formatDateRangeUppercase(dateRange?: string) {
  if (!dateRange) return ""
  // The supplied dateRange uses "Mon Day–Day, Year" or "Mon Day, Year" formats.
  // For this template the reference shows a simpler "JUL 1 - JUL 3" feel.
  return dateRange.toUpperCase()
}

function dayLocationLabel(day: Day): string {
  // Use the most common location among activities in this day. If only one
  // activity has a location, that's it. Strip trailing detail after a comma
  // so we surface the city/neighborhood.
  const counts = new Map<string, number>()
  for (const a of day.activities) {
    if (!a.location) continue
    const head = a.location.split(",")[0].trim()
    if (!head) continue
    counts.set(head, (counts.get(head) || 0) + 1)
  }
  if (counts.size === 0) return ""
  let best = ""
  let bestCount = 0
  for (const [loc, n] of counts) {
    if (n > bestCount) {
      best = loc
      bestCount = n
    }
  }
  return best.toUpperCase()
}

function TokyoTimelineTemplate({
  title,
  dateRange,
  description,
  days,
  includeLogo,
  pageIndex,
  pageCount,
}: TemplateProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#ffffff",
        color: "#111",
        fontFamily: SANS_STACK,
        position: "relative",
        overflow: "hidden",
        padding: "0.28in 0.3in 0.22in 0.3in",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      } as React.CSSProperties}
    >
      {/* Header: logo top-left, centered title block */}
      <div style={{ position: "relative", marginBottom: "0.16in" }}>
        {includeLogo && (
          <div style={{ position: "absolute", left: 0, top: "0.02in" }}>
            <TineraryWordmark height="0.22in" />
          </div>
        )}

        <div style={{ textAlign: "center", paddingTop: "0.06in" }}>
          <div
            style={{
              fontFamily: SERIF_STACK,
              fontWeight: 600,
              fontSize: "24pt",
              letterSpacing: "0.06em",
              lineHeight: 1,
              textTransform: "uppercase",
              wordBreak: "break-word",
            }}
          >
            {title}
          </div>
          {dateRange && (
            <div
              style={{
                fontSize: "7pt",
                letterSpacing: "0.18em",
                color: "#222",
                marginTop: "0.07in",
                textTransform: "uppercase",
              }}
            >
              {formatDateRangeUppercase(dateRange)}
            </div>
          )}
          {description && (
            <div
              style={{
                fontSize: "6.5pt",
                letterSpacing: "0.14em",
                color: "#555",
                marginTop: "0.04in",
                textTransform: "uppercase",
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                lineHeight: 1.25,
                maxHeight: "0.28in",
              }}
            >
              {description}
            </div>
          )}
        </div>
      </div>

      {/* Body: vertical timeline of days */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {days.length === 0 && (
          <div style={{ fontSize: "8pt", color: "#888", textAlign: "center", marginTop: "0.2in" }}>
            No scheduled activities yet.
          </div>
        )}
        {days.map((day, dayIdx) => {
          const loc = dayLocationLabel(day)
          return (
            <div key={day.key}>
              {dayIdx > 0 && (
                <div
                  style={{
                    borderTop: "0.6pt solid #111",
                    margin: "0.06in 0",
                  }}
                />
              )}
              <DayTimelineBlock dayIndex={day.index} location={loc} activities={day.activities} />
            </div>
          )
        })}
      </div>

      {pageCount > 1 && (
        <div style={{ fontSize: "6pt", color: "#999", textAlign: "right", marginTop: "0.04in" }}>
          {pageIndex + 1} / {pageCount}
        </div>
      )}
    </div>
  )
}

function DayTimelineBlock({
  dayIndex,
  location,
  activities,
}: {
  dayIndex: number
  location: string
  activities: Activity[]
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "0.55in 0.18in 0.42in 1fr",
        alignItems: "stretch",
        columnGap: "0.06in",
        padding: "0.04in 0",
      }}
    >
      {/* Day + location label */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: SERIF_STACK,
            fontSize: "11pt",
            fontWeight: 600,
            letterSpacing: "0.05em",
            lineHeight: 1,
            textTransform: "uppercase",
          }}
        >
          Day {dayIndex}
        </div>
        {location && (
          <div
            style={{
              fontSize: "6.5pt",
              letterSpacing: "0.14em",
              color: "#333",
              marginTop: "0.04in",
              textTransform: "uppercase",
            }}
          >
            {location}
          </div>
        )}
      </div>

      {/* Timeline column: vertical line + dots */}
      <div style={{ position: "relative", display: "flex", flexDirection: "column" }}>
        {/* vertical line */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "0.06in",
            bottom: "0.06in",
            width: "0.6pt",
            background: "#111",
            transform: "translateX(-50%)",
          }}
        />
        {activities.map((a, idx) => (
          <div
            key={a.id || idx}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "0.28in",
              position: "relative",
            }}
          >
            <div
              style={{
                width: "0.08in",
                height: "0.08in",
                borderRadius: "50%",
                background: "#111",
                zIndex: 1,
              }}
            />
          </div>
        ))}
      </div>

      {/* Times column */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {activities.map((a, idx) => (
          <div
            key={a.id || idx}
            style={{
              flex: 1,
              minHeight: "0.28in",
              display: "flex",
              alignItems: "center",
              fontSize: "7.5pt",
              fontVariantNumeric: "tabular-nums",
              color: "#111",
            }}
          >
            {formatTime(a.start_time) || "—"}
          </div>
        ))}
      </div>

      {/* Activity descriptions */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {activities.map((a, idx) => (
          <div
            key={a.id || idx}
            style={{
              flex: 1,
              minHeight: "0.28in",
              display: "flex",
              alignItems: "center",
              fontSize: "7pt",
              lineHeight: 1.25,
              color: "#111",
              paddingRight: "0.04in",
            }}
          >
            <span
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {a.title || "Untitled"}
              {a.location && a.location.split(",")[0].trim().toUpperCase() !== location && (
                <span style={{ color: "#666" }}> · {a.location}</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
