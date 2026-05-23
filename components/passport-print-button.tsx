"use client"

import { useMemo, useRef, useState } from "react"
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

// Passport-holder printable dimensions (inches)
const PASSPORT_WIDTH_IN = 4.9
const PASSPORT_HEIGHT_IN = 3.4

// Rough capacity heuristic for the passport preview (used for the multi-page warning)
const ACTIVITIES_PER_PAGE = 6

// Charge applied when the user opts to print without the Tinerary logo
const LOGO_REMOVAL_PRICE_USD = 1.4

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
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

const formatDayLabel = (dateStr: string) => {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
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
  label: string
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
      map.set(key, { key, label: formatDayLabel(a.start_time), activities: [] })
    }
    map.get(key)!.activities.push(a)
  }

  const days = Array.from(map.values()).sort(
    (a, b) => new Date(a.key).getTime() - new Date(b.key).getTime(),
  )
  if (undated.length > 0) {
    days.push({ key: "undated", label: "Other", activities: undated })
  }
  return days
}

export function PassportPrintButton({ event }: PassportPrintButtonProps) {
  const [open, setOpen] = useState(false)
  const [includeLogo, setIncludeLogo] = useState(true)
  const [isPrinting, setIsPrinting] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const activities = (event.activities || []) as Activity[]
  const days = useMemo(() => groupActivitiesByDay(activities), [activities])
  const totalActivities = activities.length
  const willOverflow = totalActivities > ACTIVITIES_PER_PAGE
  const estimatedPages = Math.max(1, Math.ceil(totalActivities / ACTIVITIES_PER_PAGE))

  const handlePrint = async () => {
    if (!includeLogo) {
      const confirmed = window.confirm(
        `Printing without the Tinerary logo costs $${LOGO_REMOVAL_PRICE_USD.toFixed(2)}. Continue?`,
      )
      if (!confirmed) return
      // Payment intent stub — actual checkout integration is handled elsewhere.
      toast({
        title: "Logo removal selected",
        description: `A $${LOGO_REMOVAL_PRICE_USD.toFixed(2)} charge will be added to your account.`,
      })
    }

    setIsPrinting(true)
    // Allow the dialog UI to update before invoking the native print dialog
    await new Promise((r) => setTimeout(r, 50))
    try {
      window.print()
    } finally {
      setIsPrinting(false)
    }
  }

  const dateRange = formatDateRange(event.start_date, event.end_date)

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
        <DialogContent className="sm:max-w-2xl print:hidden">
          <DialogHeader>
            <DialogTitle>Print passport-sized itinerary</DialogTitle>
            <DialogDescription>
              Prints at {PASSPORT_WIDTH_IN}&quot; × {PASSPORT_HEIGHT_IN}&quot; so it fits in a passport holder or wallet.
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

          {/* On-screen preview (single page) */}
          <div className="flex justify-center py-2">
            <div
              className="rounded-md border bg-white shadow-sm overflow-hidden"
              style={{
                width: `${PASSPORT_WIDTH_IN}in`,
                height: `${PASSPORT_HEIGHT_IN}in`,
                transform: "scale(1.05)",
                transformOrigin: "top center",
              }}
            >
              <PassportPage
                event={event}
                days={days}
                dateRange={dateRange}
                includeLogo={includeLogo}
                pageIndex={0}
                pageCount={estimatedPages}
              />
            </div>
          </div>

          <div className="space-y-3">
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

      {/* Hidden printable area — chunked into passport-sized pages */}
      <div ref={printRef} className="passport-print-root" aria-hidden>
        {Array.from({ length: estimatedPages }).map((_, pageIndex) => {
          const pageActivities = activities.slice(
            pageIndex * ACTIVITIES_PER_PAGE,
            (pageIndex + 1) * ACTIVITIES_PER_PAGE,
          )
          const pageDays = groupActivitiesByDay(pageActivities)
          return (
            <div key={pageIndex} className="passport-print-page">
              <PassportPage
                event={event}
                days={pageDays}
                dateRange={dateRange}
                includeLogo={includeLogo}
                pageIndex={pageIndex}
                pageCount={estimatedPages}
              />
            </div>
          )
        })}
      </div>

      <style jsx global>{`
        .passport-print-root {
          position: absolute;
          left: -10000px;
          top: 0;
          width: ${PASSPORT_WIDTH_IN}in;
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
          /* Hide everything by default, then re-show only the print root. */
          body * {
            visibility: hidden !important;
          }
          .passport-print-root,
          .passport-print-root * {
            visibility: visible !important;
          }
          .passport-print-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
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

interface PassportPageProps {
  event: PassportPrintButtonProps["event"]
  days: Day[]
  dateRange: string
  includeLogo: boolean
  pageIndex: number
  pageCount: number
}

function PassportPage({ event, days, dateRange, includeLogo, pageIndex, pageCount }: PassportPageProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#f5efe4",
        color: "#111",
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        boxSizing: "border-box",
        padding: "0.18in 0.22in",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.08in" }}>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: "11pt",
              fontWeight: 700,
              lineHeight: 1.15,
              textTransform: "uppercase",
              letterSpacing: "0.02em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "3.4in",
            }}
          >
            {event.title}
          </div>
          <div style={{ fontSize: "7pt", color: "#555", marginTop: "0.02in" }}>
            {[dateRange, event.location].filter(Boolean).join(" · ")}
          </div>
        </div>
        {includeLogo && (
          <div
            style={{
              fontSize: "9pt",
              fontWeight: 800,
              color: "#E6A92B",
              fontFamily: "'Comic Sans MS', 'Chalkboard SE', cursive",
              marginLeft: "0.1in",
              flexShrink: 0,
            }}
          >
            TINERARY
          </div>
        )}
      </div>

      {/* Body — days & activities */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", gap: "0.05in" }}>
        {days.length === 0 && (
          <div style={{ fontSize: "8pt", color: "#777", marginTop: "0.1in" }}>No scheduled activities.</div>
        )}
        {days.map((day) => (
          <div key={day.key}>
            <div
              style={{
                fontSize: "7pt",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: "#3b6a2a",
                marginBottom: "0.03in",
              }}
            >
              {day.label}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.03in" }}>
              {day.activities.map((a, idx) => (
                <div
                  key={a.id || idx}
                  style={{
                    background: "#fff",
                    border: "0.5pt solid #e5e0d2",
                    borderRadius: "0.05in",
                    padding: "0.04in 0.07in",
                    fontSize: "7.5pt",
                    lineHeight: 1.25,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: "0.08in",
                  }}
                >
                  <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {a.title || "Untitled"}
                    {a.location && (
                      <span style={{ fontWeight: 400, color: "#666" }}> · {a.location}</span>
                    )}
                  </div>
                  <div style={{ color: "#555", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                    {formatTime(a.start_time)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {pageCount > 1 && (
        <div style={{ fontSize: "6pt", color: "#888", textAlign: "right", marginTop: "0.04in" }}>
          {pageIndex + 1} / {pageCount}
        </div>
      )}
    </div>
  )
}
