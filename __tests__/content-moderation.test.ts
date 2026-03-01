import { describe, it, expect } from "vitest"
import {
  detectProfanity,
  censorText,
  moderateText,
  moderateItineraryContent,
} from "@/lib/content-moderation"

describe("content-moderation", () => {
  describe("detectProfanity", () => {
    it("detects common profanity", () => {
      expect(detectProfanity("what the fuck")).toContain("fuck")
      expect(detectProfanity("this is shit")).toContain("shit")
    })

    it("returns empty array for clean text", () => {
      expect(detectProfanity("A lovely day in Paris")).toEqual([])
      expect(detectProfanity("Beautiful beach trip")).toEqual([])
    })

    it("avoids false positives for words containing profanity substrings", () => {
      expect(detectProfanity("class assignment")).toEqual([])
      expect(detectProfanity("Scunthorpe")).toEqual([])
      expect(detectProfanity("cocktail party")).toEqual([])
    })

    it("detects leet-speak variations", () => {
      expect(detectProfanity("fck th!s sh!t").length).toBeGreaterThan(0)
    })
  })

  describe("censorText", () => {
    it("censors profanity with asterisks keeping first and last character", () => {
      const result = censorText("what the fuck")
      expect(result).toBe("what the f**k")
    })

    it("leaves clean text unchanged", () => {
      const text = "A wonderful trip to Rome"
      expect(censorText(text)).toBe(text)
    })

    it("handles multiple profane words", () => {
      const result = censorText("holy shit that was damn good")
      expect(result).toContain("s**t")
      expect(result).toContain("d**n")
    })
  })

  describe("moderateText", () => {
    it("returns isClean true for clean text", () => {
      const result = moderateText("A family-friendly road trip")
      expect(result.isClean).toBe(true)
      expect(result.severity).toBe("none")
    })

    it("detects moderate severity", () => {
      const result = moderateText("this place was shit")
      expect(result.isClean).toBe(false)
      expect(result.severity).toBe("moderate")
    })

    it("detects mild severity", () => {
      const result = moderateText("damn that was crappy")
      expect(result.isClean).toBe(false)
      expect(["mild", "moderate"]).toContain(result.severity)
    })
  })

  describe("moderateItineraryContent", () => {
    it("checks multiple fields", () => {
      const result = moderateItineraryContent({
        title: "Nice Trip",
        description: "A damn good time",
        location: "Paris",
      })
      expect(result.isClean).toBe(false)
      expect(result.issues.length).toBeGreaterThan(0)
      expect(result.issues[0].field).toBe("description")
    })

    it("returns clean for safe content", () => {
      const result = moderateItineraryContent({
        title: "Weekend in NYC",
        description: "Exploring museums and restaurants",
        location: "New York",
      })
      expect(result.isClean).toBe(true)
      expect(result.issues.length).toBe(0)
    })
  })
})
