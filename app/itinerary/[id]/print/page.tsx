"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Check, LayoutGrid, Loader2, Printer, Square } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { createClient } from "@/lib/supabase/client"
import { parseLocalDate } from "@/lib/utils"

// ─────────────────────────────────────────────────────────────────────────────
// Page geometry — letter sheet, passport-sized cards
// ─────────────────────────────────────────────────────────────────────────────
const DPI = 96
const inch = (n: number) => n * DPI
const PAGE = { w: inch(8.5), h: inch(11) }
const QUAD = { cardW: inch(3.4), cardH: inch(4.9), marginX: inch(0.85), marginY: inch(0.6) }
const SOLO = { cardW: inch(3.4), cardH: inch(4.9), marginX: inch(0.05), marginY: inch(0.05) }

// Deterministic density factor — each card multiplies sizes by this.
const REFERENCE_STOPS = 6
const densityScale = (n: number): number => {
  if (!n || n < 1) return 1
  return Math.max(0.72, Math.min(1.28, Math.sqrt(REFERENCE_STOPS / n)))
}

// Logos (kept in /public)
const LOGO_YELLOW = "/tinerary-logo-yellow.png"
const LOGO_DARK = "/email/tinerary-logo.png"

// ─────────────────────────────────────────────────────────────────────────────
// Domain types
// ─────────────────────────────────────────────────────────────────────────────
interface Stop {
  time: string
  name: string
  sub: string | null
}

interface Day {
  label: string
  date: string
  addr: string
  stops: Stop[]
}

interface Itinerary {
  id: string
  title: string
  dateRange: string
  description: string
  shortUrl: string
  shareUrl: string
  days: Day[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Data fetch + mapping — pulls itinerary + activities from Supabase, then
// regroups activities by date into the day/stop shape the templates expect.
// ─────────────────────────────────────────────────────────────────────────────
async function fetchItinerary(id: string): Promise<Itinerary> {
  const supabase = createClient()
  const [{ data: itin, error: itinErr }, { data: activities, error: actErr }] =
    await Promise.all([
      supabase
        .from("itineraries")
        .select("id, title, description, start_date, end_date, location")
        .eq("id", id)
        .single(),
      supabase
        .from("activities")
        .select("id, title, start_time, location, description")
        .eq("itinerary_id", id)
        .order("start_time", { ascending: true }),
    ])

  if (itinErr) throw new Error(itinErr.message)
  if (actErr) throw new Error(actErr.message)
  if (!itin) throw new Error("Itinerary not found")

  return shapeItinerary(itin, activities || [])
}

interface RawItin {
  id: string
  title: string
  description: string | null
  start_date: string | null
  end_date: string | null
  location: string | null
}

interface RawActivity {
  id: string
  title: string | null
  start_time: string | null
  location: string | null
  description: string | null
}

function shapeItinerary(itin: RawItin, activities: RawActivity[]): Itinerary {
  // Date range — "MAR 27 – 31, 2026" style.
  const dateRange = formatDateRange(itin.start_date, itin.end_date)

  // Group activities by calendar day, sorted chronologically.
  const buckets = new Map<string, RawActivity[]>()
  for (const a of activities) {
    if (!a.start_time) continue
    const d = new Date(a.start_time)
    if (isNaN(d.getTime())) continue
    const key = d.toDateString()
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key)!.push(a)
  }

  const sortedKeys = Array.from(buckets.keys()).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime(),
  )

  const days: Day[] = sortedKeys.map((key, idx) => {
    const dayActs = buckets.get(key)!
    return {
      label: `DAY ${idx + 1}`,
      date: new Date(key)
        .toLocaleDateString("en-US", { month: "short", day: "numeric" })
        .toUpperCase(),
      addr: dominantLocation(dayActs) || (itin.location || "").toUpperCase(),
      stops: dayActs.map((a) => ({
        time: a.start_time
          ? new Date(a.start_time)
              .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              .toUpperCase()
          : "",
        name: a.title || "Untitled",
        sub: a.location && !sameHeadLocation(a.location, dominantLocation(dayActs))
          ? a.location
          : null,
      })),
    }
  })

  const origin = typeof window !== "undefined" ? window.location.origin : ""
  return {
    id: itin.id,
    title: (itin.title || "Untitled").toUpperCase(),
    dateRange,
    description: itin.description || "",
    shortUrl: `tinerary.app/i/${itin.id.slice(0, 8)}`,
    shareUrl: `${origin}/event/${itin.id}`,
    days,
  }
}

function dominantLocation(activities: RawActivity[]): string {
  const counts = new Map<string, number>()
  for (const a of activities) {
    if (!a.location) continue
    const head = a.location.split(",")[0].trim()
    if (!head) continue
    counts.set(head, (counts.get(head) || 0) + 1)
  }
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

function sameHeadLocation(loc: string, head: string): boolean {
  if (!loc || !head) return false
  return loc.split(",")[0].trim().toUpperCase() === head
}

function formatDateRange(start?: string | null, end?: string | null): string {
  if (!start) return ""
  const s = parseLocalDate(start)
  if (!end || end === start) {
    return s
      .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      .toUpperCase()
  }
  const e = parseLocalDate(end)
  const sameYear = s.getFullYear() === e.getFullYear()
  const sameMonth = sameYear && s.getMonth() === e.getMonth()
  if (sameMonth) {
    return `${s
      .toLocaleDateString("en-US", { month: "short" })
      .toUpperCase()} ${s.getDate()}–${e.getDate()}, ${e.getFullYear()}`
  }
  return `${s
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .toUpperCase()} – ${e
    .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    .toUpperCase()}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Page builder — slices selected day indices into per-page slot arrays
// ─────────────────────────────────────────────────────────────────────────────
function buildPages(
  selected: number[],
  allDays: Day[],
  layout: "quad" | "solo",
): (Day | null)[][] {
  const perPage = layout === "quad" ? 4 : 1
  const picked = selected.map((i) => allDays[i]).filter(Boolean)
  if (picked.length === 0) return []
  const out: (Day | null)[][] = []
  for (let i = 0; i < picked.length; i += perPage) {
    const slots: (Day | null)[] = picked.slice(i, i + perPage)
    while (slots.length < perPage) slots.push(null)
    out.push(slots)
  }
  return out
}

// ─────────────────────────────────────────────────────────────────────────────
// Building blocks — logo, watermark, crop marks
// ─────────────────────────────────────────────────────────────────────────────
function TinerarLogo({
  height = 14,
  variant = "yellow",
}: {
  height?: number
  variant?: "yellow" | "dark"
}) {
  const src = variant === "dark" ? LOGO_DARK : LOGO_YELLOW
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt="Tinerary"
      style={{ height, width: "auto", display: "inline-block", verticalAlign: "middle" }}
    />
  )
}

function Watermark({ opacity = 0.085, rotation = -22 }: { opacity?: number; rotation?: number }) {
  const rawId = React.useId()
  const id = rawId.replace(/:/g, "")
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <pattern
          id={`wm-${id}`}
          x="0"
          y="0"
          width="190"
          height="150"
          patternUnits="userSpaceOnUse"
          patternTransform={`rotate(${rotation})`}
        >
          <image href={LOGO_DARK} x="0" y="10" width="75" height="17" opacity={opacity} />
          <image
            href={LOGO_DARK}
            x="100"
            y="50"
            width="42"
            height="10"
            opacity={opacity}
            transform="rotate(9 121 55)"
          />
          <image
            href={LOGO_DARK}
            x="30"
            y="100"
            width="58"
            height="13"
            opacity={opacity}
            transform="rotate(-7 59 107)"
          />
          <text x="92" y="22" fontSize="9" fill="#1a1a1a" opacity={opacity * 1.4}>
            ✦
          </text>
          <text x="160" y="115" fontSize="7" fill="#1a1a1a" opacity={opacity * 1.4}>
            ★
          </text>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#wm-${id})`} />
    </svg>
  )
}

function CropMarks({ layout }: { layout: "quad" | "solo" }) {
  const cfg = layout === "quad" ? QUAD : SOLO
  const L = 10
  const x0 = cfg.marginX
  const y0 = cfg.marginY
  const cols = layout === "quad" ? 2 : 1
  const rows = layout === "quad" ? 2 : 1
  const x1 = x0 + cols * cfg.cardW
  const y1 = y0 + rows * cfg.cardH
  const cx = (x0 + x1) / 2
  const cy = (y0 + y1) / 2

  const tick = (x: number, y: number, dx: number, dy: number, k: string) => (
    <line
      key={k}
      x1={x}
      y1={y}
      x2={x + dx}
      y2={y + dy}
      stroke="#1a1a1a"
      strokeWidth="0.6"
      opacity="0.55"
    />
  )

  return (
    <svg className="absolute inset-0 pointer-events-none" width={PAGE.w} height={PAGE.h} aria-hidden>
      {tick(x0, y0, -L, 0, "tl-h")}
      {tick(x0, y0, 0, -L, "tl-v")}
      {tick(x1, y0, L, 0, "tr-h")}
      {tick(x1, y0, 0, -L, "tr-v")}
      {tick(x0, y1, -L, 0, "bl-h")}
      {tick(x0, y1, 0, L, "bl-v")}
      {tick(x1, y1, L, 0, "br-h")}
      {tick(x1, y1, 0, L, "br-v")}
      {layout === "quad" && (
        <>
          {tick(cx, y0, 0, -L, "tm")}
          {tick(cx, y1, 0, L, "bm")}
          {tick(x0, cy, -L, 0, "lm")}
          {tick(x1, cy, L, 0, "rm")}
        </>
      )}
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Template: Tokyo Timeline
// ─────────────────────────────────────────────────────────────────────────────
function TokyoTimeline({
  itinerary,
  day,
  b,
  includeBrand,
}: {
  itinerary: Itinerary
  day: Day | null
  b: number
  includeBrand: boolean
}) {
  if (!day) return null
  return (
    <div
      className="relative bg-white overflow-hidden h-full w-full"
      style={{ padding: `${22 * b}px ${20 * b}px` }}
    >
      {includeBrand && <Watermark opacity={0.075} />}
      <div className="relative text-center" style={{ marginBottom: 10 * b }}>
        {includeBrand && (
          <div style={{ marginBottom: 4 * b }}>
            <TinerarLogo height={11 * b} variant="yellow" />
          </div>
        )}
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 700,
            fontSize: 26 * b,
            lineHeight: 1,
            letterSpacing: 3,
            color: "#0a0a0a",
          }}
        >
          {itinerary.title}
        </h1>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 7 * b,
            letterSpacing: 2,
            color: "#0a0a0a",
            marginTop: 5 * b,
          }}
        >
          {itinerary.dateRange}
        </div>
        {itinerary.description && (
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 6 * b,
              letterSpacing: 1.5,
              color: "#444",
              marginTop: 5 * b,
              lineHeight: 1.5,
              textTransform: "uppercase",
            }}
          >
            {itinerary.description}
          </div>
        )}
      </div>

      <div
        className="relative grid items-stretch"
        style={{
          gridTemplateColumns: `${48 * b}px ${44 * b}px ${12 * b}px 1fr`,
          gap: `${4 * b}px ${6 * b}px`,
          marginTop: 6 * b,
        }}
      >
        <div
          className="flex flex-col justify-center text-center"
          style={{ gridRow: `1 / span ${day.stops.length || 1}` }}
        >
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 14 * b,
              letterSpacing: 2,
              color: "#0a0a0a",
            }}
          >
            {day.label}
          </div>
          {day.addr && (
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 5.5 * b,
                letterSpacing: 1.5,
                color: "#666",
                marginTop: 4 * b,
                lineHeight: 1.4,
              }}
            >
              {day.addr}
            </div>
          )}
        </div>

        {day.stops.map((s, i) => (
          <React.Fragment key={i}>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 7 * b,
                color: "#0a0a0a",
                letterSpacing: 0.5,
                alignSelf: "center",
              }}
            >
              {s.time}
            </div>
            <div className="relative flex justify-center" style={{ minHeight: 16 * b }}>
              {i < day.stops.length - 1 && (
                <div
                  style={{
                    position: "absolute",
                    top: 8 * b,
                    bottom: -8 * b,
                    width: 1,
                    background: "#0a0a0a",
                  }}
                />
              )}
              <div
                style={{
                  width: 6 * b,
                  height: 6 * b,
                  borderRadius: "50%",
                  background: "#0a0a0a",
                  marginTop: 5 * b,
                  zIndex: 1,
                }}
              />
            </div>
            <div style={{ paddingTop: 1 * b, alignSelf: "center" }}>
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 9 * b,
                  color: "#0a0a0a",
                  lineHeight: 1.15,
                  fontWeight: 500,
                }}
              >
                {s.name}
              </div>
              {s.sub && (
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 5.5 * b,
                    color: "#777",
                    marginTop: 1 * b,
                    lineHeight: 1.3,
                  }}
                >
                  {s.sub}
                </div>
              )}
            </div>
          </React.Fragment>
        ))}
      </div>

      <div
        className="absolute left-0 right-0 flex items-center justify-center"
        style={{ bottom: 8 * b, gap: 6 * b }}
      >
        <div style={{ background: "white", padding: 1.5 }}>
          <QRCodeSVG value={itinerary.shareUrl} size={22 * b} level="L" includeMargin={false} />
        </div>
        <div className="flex flex-col items-start">
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 5 * b,
              letterSpacing: 1.5,
              color: "#bbb",
            }}
          >
            SCAN FOR LIVE MAP
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 6 * b,
              letterSpacing: 1,
              color: "#444",
            }}
          >
            {itinerary.shortUrl}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Template: Wavy Garden
// ─────────────────────────────────────────────────────────────────────────────
function WavyGarden({
  itinerary,
  day,
  b,
  includeBrand,
}: {
  itinerary: Itinerary
  day: Day | null
  b: number
  includeBrand: boolean
}) {
  if (!day) return null
  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: "#5C6A3A" }}>
      <svg
        viewBox="0 0 326 470"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
        aria-hidden
      >
        <path
          d="M 16 22
             Q 24 14, 38 22 T 70 22 T 102 22 T 134 22 T 166 22 T 198 22 T 230 22 T 262 22 T 294 22
             Q 308 24, 304 38 T 304 70 T 304 102 T 304 134 T 304 166 T 304 198 T 304 230 T 304 262 T 304 294 T 304 326 T 304 358 T 304 390 T 304 422 T 304 448
             Q 308 462, 294 456 T 262 456 T 230 456 T 198 456 T 166 456 T 134 456 T 102 456 T 70 456 T 38 456
             Q 24 458, 16 448 T 16 416 T 16 384 T 16 352 T 16 320 T 16 288 T 16 256 T 16 224 T 16 192 T 16 160 T 16 128 T 16 96 T 16 64 T 16 32 Z"
          fill="#F2E9D2"
        />
      </svg>

      {includeBrand && (
        <div
          className="absolute pointer-events-none overflow-hidden"
          style={{ top: 22, left: 16, right: 16, bottom: 22 }}
        >
          <Watermark opacity={0.08} />
        </div>
      )}

      <div
        className="relative h-full flex flex-col"
        style={{ padding: `${30 * b}px ${28 * b}px ${22 * b}px` }}
      >
        <div className="text-center" style={{ marginBottom: 6 * b }}>
          {includeBrand && <TinerarLogo height={11 * b} variant="dark" />}
          <h1
            style={{
              fontFamily: "'Caprasimo', serif",
              fontSize: 22 * b,
              lineHeight: 1,
              color: "#1a1a1a",
              marginTop: 3 * b,
              letterSpacing: -0.5,
            }}
          >
            {itinerary.title}
          </h1>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 6 * b,
              letterSpacing: 1.5,
              color: "#1a1a1a",
              marginTop: 3 * b,
            }}
          >
            {itinerary.dateRange} · {day.label}
          </div>
        </div>

        <div className="flex items-center" style={{ gap: 4 * b, marginBottom: 6 * b }}>
          <div className="flex-1" style={{ height: 1, background: "#5C6A3A", opacity: 0.4 }} />
          <span
            style={{
              fontFamily: "'Caprasimo', serif",
              fontSize: 7 * b,
              color: "#5C6A3A",
              letterSpacing: 1.5,
            }}
          >
            THE STOPS
          </span>
          <div className="flex-1" style={{ height: 1, background: "#5C6A3A", opacity: 0.4 }} />
        </div>

        <div className="flex-1 flex flex-col" style={{ gap: 3 * b }}>
          {day.stops.map((s, i) => (
            <div key={i} className="flex items-start" style={{ gap: 5 * b }}>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 6 * b,
                  color: "#5C6A3A",
                  width: 30 * b,
                  paddingTop: 2 * b,
                  flexShrink: 0,
                }}
              >
                {s.time}
              </div>
              <div
                className="flex items-center justify-center flex-shrink-0 rounded-full"
                style={{
                  width: 12 * b,
                  height: 12 * b,
                  background: "#5C6A3A",
                  color: "#F2E9D2",
                  fontFamily: "'Caprasimo', serif",
                  fontSize: 7 * b,
                  marginTop: 1 * b,
                }}
              >
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  style={{
                    fontFamily: "'Fraunces', serif",
                    fontWeight: 600,
                    fontSize: 9 * b,
                    color: "#1a1a1a",
                    lineHeight: 1.1,
                  }}
                >
                  {s.name}
                </div>
                {s.sub && (
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 5 * b,
                      color: "#1a1a1a",
                      opacity: 0.6,
                      marginTop: 1 * b,
                      lineHeight: 1.3,
                    }}
                  >
                    {s.sub}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center" style={{ marginTop: 6 * b, gap: 6 * b }}>
          <div style={{ background: "white", padding: 1.5 }}>
            <QRCodeSVG
              value={itinerary.shareUrl}
              size={22 * b}
              level="L"
              includeMargin={false}
              fgColor="#1a1a1a"
            />
          </div>
          <div className="flex flex-col items-start">
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 5 * b,
                letterSpacing: 1.5,
                color: "#5C6A3A",
              }}
            >
              SCAN FOR LIVE MAP
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 6 * b,
                letterSpacing: 1,
                color: "#1a1a1a",
              }}
            >
              {itinerary.shortUrl}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Print page — one letter sheet, possibly 4 cards
// ─────────────────────────────────────────────────────────────────────────────
type TemplateKey = "tokyo" | "wavy"
const TEMPLATES: Record<
  TemplateKey,
  { name: string; desc: string; Component: typeof TokyoTimeline }
> = {
  tokyo: {
    name: "Tokyo Timeline",
    desc: "Minimal black & white with a vertical timeline.",
    Component: TokyoTimeline,
  },
  wavy: {
    name: "Wavy Garden",
    desc: "Cream background with a scalloped green border.",
    Component: WavyGarden,
  },
}

function PrintPage({
  itinerary,
  slots,
  Template,
  layout,
  includeBrand,
  showCutMarks,
  pageNum,
  totalPages,
}: {
  itinerary: Itinerary
  slots: (Day | null)[]
  Template: typeof TokyoTimeline
  layout: "quad" | "solo"
  includeBrand: boolean
  showCutMarks: boolean
  pageNum: number
  totalPages: number
}) {
  const cfg = layout === "quad" ? QUAD : SOLO
  const cols = layout === "quad" ? 2 : 1
  const rows = layout === "quad" ? 2 : 1

  return (
    <div
      className="relative bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] print-page"
      style={{ width: PAGE.w, height: PAGE.h }}
    >
      {showCutMarks && <CropMarks layout={layout} />}

      <div
        style={{
          position: "absolute",
          top: cfg.marginY,
          left: cfg.marginX,
          width: cfg.cardW * cols,
          height: cfg.cardH * rows,
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
        }}
      >
        {slots.map((day, i) => (
          <div key={i} style={{ width: cfg.cardW, height: cfg.cardH, overflow: "hidden" }}>
            {day ? (
              <Template
                itinerary={itinerary}
                day={day}
                b={densityScale(day.stops.length || 1)}
                includeBrand={includeBrand}
              />
            ) : (
              <div className="w-full h-full bg-white" />
            )}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div
          className="absolute"
          style={{
            bottom: 12,
            right: 16,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 8,
            letterSpacing: 1.5,
            color: "#999",
          }}
        >
          {pageNum} / {totalPages}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page export
// ─────────────────────────────────────────────────────────────────────────────
const LOGO_REMOVAL_PRICE_USD = 1.4

export default function ItineraryPrintPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [itinerary, setItinerary] = useState<Itinerary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [layout, setLayout] = useState<"quad" | "solo">("quad")
  const [tpl, setTpl] = useState<TemplateKey>("tokyo")
  const [showCutMarks, setShowCutMarks] = useState(true)
  const [includeBrand, setIncludeBrand] = useState(true)
  const [selectedDays, setSelectedDays] = useState<number[]>([])

  useEffect(() => {
    let cancelled = false
    if (!id) return
    fetchItinerary(id)
      .then((data) => {
        if (cancelled) return
        setItinerary(data)
        setSelectedDays(data.days.map((_, i) => i))
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message || "Failed to load itinerary")
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const pages = useMemo(
    () => (itinerary ? buildPages(selectedDays, itinerary.days, layout) : []),
    [itinerary, selectedDays, layout],
  )

  const toggleDay = (i: number) =>
    setSelectedDays((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i].sort((a, b) => a - b),
    )

  const handlePrint = () => {
    if (!includeBrand) {
      const ok = window.confirm(
        `Printing without Tinerary branding costs $${LOGO_REMOVAL_PRICE_USD.toFixed(2)}. Continue?`,
      )
      if (!ok) return
    }
    window.print()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1a1a18]">
        <Loader2 className="h-8 w-8 animate-spin text-[#F4C84A]" />
      </div>
    )
  }

  if (error || !itinerary) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#1a1a18] text-white gap-4 p-6 text-center">
        <h1 className="text-xl font-semibold">Couldn&apos;t load this itinerary</h1>
        <p className="text-sm text-white/60">{error}</p>
        <Link
          href={`/event/${id}`}
          className="rounded-full px-4 py-2 bg-[#F4C84A] text-[#1a1a18] text-sm font-medium"
        >
          Back to itinerary
        </Link>
      </div>
    )
  }

  const Template = TEMPLATES[tpl].Component

  return (
    <div className="min-h-screen" style={{ background: "#1a1a18" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caprasimo&family=Fraunces:ital,wght@0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:wght@500;600;700&display=swap');

        @page { size: letter; margin: 0; }
        @media print {
          html, body { background: white !important; margin: 0 !important; padding: 0 !important; }
          .no-print { display: none !important; }
          .print-page {
            box-shadow: none !important;
            margin: 0 !important;
            page-break-after: always;
            break-after: page;
          }
          .print-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* Toolbar */}
      <div
        className="no-print sticky top-0 z-50"
        style={{
          background: "rgba(20,20,18,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #2a2a26",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push(`/event/${id}`)}
              className="p-2 rounded-full hover:bg-[#2a2a26]"
              aria-label="Back to itinerary"
            >
              <ArrowLeft className="h-4 w-4 text-white/70" />
            </button>
            <TinerarLogo height={26} variant="yellow" />
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                letterSpacing: 2,
                color: "#7a7a72",
              }}
            >
              PRINT ENGINE
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div
              className="flex rounded-full p-1"
              style={{ background: "#0f0f0d", border: "1px solid #2a2a26" }}
            >
              {(Object.entries(TEMPLATES) as [TemplateKey, (typeof TEMPLATES)[TemplateKey]][]).map(
                ([key, t]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTpl(key)}
                    className="px-3 py-1.5 rounded-full transition-all"
                    style={{
                      background: tpl === key ? "#F4C84A" : "transparent",
                      color: tpl === key ? "#1a1a18" : "#a8a8a0",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      letterSpacing: 1,
                    }}
                  >
                    {t.name.toUpperCase()}
                  </button>
                ),
              )}
            </div>

            <div
              className="flex rounded-full p-1"
              style={{ background: "#0f0f0d", border: "1px solid #2a2a26" }}
            >
              {(
                [
                  { key: "quad" as const, Icon: LayoutGrid, label: "4-UP" },
                  { key: "solo" as const, Icon: Square, label: "1-UP" },
                ]
              ).map(({ key, Icon, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setLayout(key)}
                  className="px-3 py-1.5 rounded-full flex items-center gap-2 transition-all"
                  style={{
                    background: layout === key ? "#F4C84A" : "transparent",
                    color: layout === key ? "#1a1a18" : "#a8a8a0",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    letterSpacing: 1,
                  }}
                >
                  <Icon size={12} strokeWidth={2.5} />
                  {label}
                </button>
              ))}
            </div>

            <label
              className="flex items-center gap-2 px-3 py-2 rounded-full cursor-pointer"
              style={{
                background: "#0f0f0d",
                border: "1px solid #2a2a26",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: "#a8a8a0",
                letterSpacing: 1,
              }}
            >
              <input
                type="checkbox"
                checked={showCutMarks}
                onChange={(e) => setShowCutMarks(e.target.checked)}
                className="accent-[#F4C84A]"
              />
              CROP MARKS
            </label>

            <label
              className="flex items-center gap-2 px-3 py-2 rounded-full cursor-pointer"
              style={{
                background: "#0f0f0d",
                border: "1px solid #2a2a26",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: "#a8a8a0",
                letterSpacing: 1,
              }}
              title={`Uncheck to print without branding for $${LOGO_REMOVAL_PRICE_USD.toFixed(2)}`}
            >
              <input
                type="checkbox"
                checked={includeBrand}
                onChange={(e) => setIncludeBrand(e.target.checked)}
                className="accent-[#F4C84A]"
              />
              TINERARY LOGO
            </label>

            <button
              type="button"
              onClick={handlePrint}
              disabled={selectedDays.length === 0}
              className="flex items-center gap-2 px-5 py-2 rounded-full hover:scale-105 transition-transform disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
              style={{
                background: "#F4C84A",
                color: "#1a1a18",
                fontFamily: "'Caprasimo', serif",
                fontSize: 13,
              }}
            >
              <Printer size={14} strokeWidth={2.5} />
              PRINT
            </button>
          </div>
        </div>

        {/* Day picker */}
        <div className="max-w-6xl mx-auto px-6 pb-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                letterSpacing: 2,
                color: "#7a7a72",
                minWidth: 50,
              }}
            >
              DAYS
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {itinerary.days.map((d, i) => {
                const active = selectedDays.includes(i)
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all"
                    style={{
                      background: active ? "#F4C84A" : "transparent",
                      color: active ? "#1a1a18" : "#a8a8a0",
                      border: `1px solid ${active ? "#F4C84A" : "#2a2a26"}`,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      letterSpacing: 1,
                    }}
                  >
                    {active && <Check size={10} strokeWidth={3} />}
                    {d.label} · {d.stops.length}
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              onClick={() => setSelectedDays(itinerary.days.map((_, i) => i))}
              className="px-3 py-1.5 rounded-full transition-all hover:bg-[#2a2a26]"
              style={{
                background: "transparent",
                color: "#7a7a72",
                border: "1px solid #2a2a26",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                letterSpacing: 1,
              }}
            >
              ALL
            </button>
            <button
              type="button"
              onClick={() => setSelectedDays([])}
              className="px-3 py-1.5 rounded-full transition-all hover:bg-[#2a2a26]"
              style={{
                background: "transparent",
                color: "#7a7a72",
                border: "1px solid #2a2a26",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                letterSpacing: 1,
              }}
            >
              NONE
            </button>
          </div>

          <div
            className="flex items-center gap-4 mt-3"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              letterSpacing: 1.5,
              color: "#7a7a72",
            }}
          >
            <span>
              SELECTED: <span style={{ color: "#F4C84A" }}>{selectedDays.length}</span>
            </span>
            <span>
              PAGES: <span style={{ color: "#F4C84A" }}>{pages.length}</span>
            </span>
            {pages.length > 0 && layout === "quad" && (
              <span>
                BLANKS:{" "}
                <span style={{ color: "#F4C84A" }}>
                  {pages.length * 4 - selectedDays.length}
                </span>
              </span>
            )}
            <span style={{ color: "#5a5a52" }}>·</span>
            <span
              style={{ fontStyle: "italic", fontFamily: "'Fraunces', serif", fontSize: 11 }}
            >
              {TEMPLATES[tpl].desc}
            </span>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="py-12 px-6 flex flex-col items-center gap-8">
        {pages.length === 0 ? (
          <div
            className="py-32 text-center"
            style={{
              fontFamily: "'Fraunces', serif",
              fontStyle: "italic",
              fontSize: 18,
              color: "#5a5a52",
            }}
          >
            Select at least one day to preview.
          </div>
        ) : (
          pages.map((slots, i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <div
                className="no-print"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  letterSpacing: 2,
                  color: "#5a5a52",
                }}
              >
                PAGE {i + 1} / {pages.length}
              </div>
              <PrintPage
                itinerary={itinerary}
                slots={slots}
                Template={Template}
                layout={layout}
                includeBrand={includeBrand}
                showCutMarks={showCutMarks}
                pageNum={i + 1}
                totalPages={pages.length}
              />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
