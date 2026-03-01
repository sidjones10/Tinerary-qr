/**
 * Content moderation utilities for Tinerary.
 *
 * Provides profanity filtering (with censoring) and basic checks for
 * inappropriate content in user-generated text.
 */

// Common profanity/slur list. This covers the most common cases.
// Words are stored lowercase for case-insensitive matching.
const PROFANITY_LIST = [
  // Strong profanity
  "fuck", "fucker", "fucking", "fucked", "fucks", "motherfucker", "motherfucking",
  "shit", "shitting", "shitty", "bullshit",
  "ass", "asshole", "assholes",
  "bitch", "bitches", "bitching",
  "damn", "dammit", "goddamn", "goddammit",
  "dick", "dickhead", "dicks",
  "cock", "cocks", "cocksucker",
  "cunt", "cunts",
  "bastard", "bastards",
  "piss", "pissed", "pissing",
  "whore", "whores",
  "slut", "sluts",
  "crap", "crappy",
  // Slurs (abbreviated/partial to avoid full reproduction but still detect)
  "nigger", "nigga", "niggas",
  "faggot", "fag", "fags",
  "retard", "retarded", "retards",
  "kike",
  "spic", "spics",
  "chink", "chinks",
  "wetback",
  "tranny",
]

// Common leet-speak and character substitution patterns
const LEET_MAP: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  "$": "s",
  "!": "i",
}

/**
 * Normalize text by converting leet-speak and removing separators
 * that people use to bypass filters.
 */
function normalizeText(text: string): string {
  let normalized = text.toLowerCase()

  // Replace leet-speak characters
  for (const [leet, char] of Object.entries(LEET_MAP)) {
    normalized = normalized.replaceAll(leet, char)
  }

  // Remove common separator characters used to bypass filters (e.g., "f.u.c.k", "f-u-c-k")
  normalized = normalized.replace(/[.\-_*~|]/g, "")

  return normalized
}

/**
 * Check if text contains profanity. Returns the list of detected words.
 */
export function detectProfanity(text: string): string[] {
  if (!text) return []

  const normalized = normalizeText(text)
  const detected: string[] = []

  for (const word of PROFANITY_LIST) {
    // Use word boundary matching to avoid false positives
    // e.g., "class" should not match "ass"
    const regex = new RegExp(`\\b${word}\\b`, "i")
    if (regex.test(normalized)) {
      detected.push(word)
    }
  }

  return detected
}

/**
 * Censor profanity in text by replacing middle characters with asterisks.
 * e.g., "fuck" -> "f**k", "shit" -> "s**t"
 *
 * This allows the text to still be readable while masking the profanity.
 */
export function censorText(text: string): string {
  if (!text) return text

  let result = text

  for (const word of PROFANITY_LIST) {
    // Match the word with word boundaries, case insensitive
    const regex = new RegExp(`\\b(${escapeRegex(word)})\\b`, "gi")
    result = result.replace(regex, (match) => {
      if (match.length <= 2) return match[0] + "*"
      // Keep first and last character, replace middle with asterisks
      return match[0] + "*".repeat(match.length - 2) + match[match.length - 1]
    })
  }

  return result
}

/**
 * Check text for inappropriateness and return a moderation result.
 */
export function moderateText(text: string): {
  isClean: boolean
  hasProfanity: boolean
  detectedWords: string[]
  censoredText: string
  severity: "none" | "mild" | "moderate" | "severe"
} {
  if (!text) {
    return {
      isClean: true,
      hasProfanity: false,
      detectedWords: [],
      censoredText: text,
      severity: "none",
    }
  }

  const detectedWords = detectProfanity(text)
  const hasProfanity = detectedWords.length > 0

  // Determine severity
  const severeWords = [
    "nigger", "nigga", "faggot", "kike", "spic", "chink", "wetback", "tranny",
    "cunt", "cocksucker", "motherfucker",
  ]
  const moderateWords = [
    "fuck", "fucking", "fucked", "shit", "bitch", "dick", "cock", "whore", "slut",
    "ass", "asshole", "piss",
  ]

  let severity: "none" | "mild" | "moderate" | "severe" = "none"
  if (detectedWords.some((w) => severeWords.includes(w))) {
    severity = "severe"
  } else if (detectedWords.some((w) => moderateWords.includes(w))) {
    severity = "moderate"
  } else if (hasProfanity) {
    severity = "mild"
  }

  return {
    isClean: !hasProfanity,
    hasProfanity,
    detectedWords,
    censoredText: censorText(text),
    severity,
  }
}

/**
 * Check multiple text fields from an itinerary and return combined moderation results.
 */
export function moderateItineraryContent(fields: {
  title?: string
  description?: string
  location?: string
  activityTitles?: string[]
  activityDescriptions?: string[]
}): {
  isClean: boolean
  issues: { field: string; severity: string; detectedWords: string[] }[]
  censoredFields: Record<string, string>
} {
  const issues: { field: string; severity: string; detectedWords: string[] }[] = []
  const censoredFields: Record<string, string> = {}

  // Check each field
  if (fields.title) {
    const result = moderateText(fields.title)
    if (!result.isClean) {
      issues.push({ field: "title", severity: result.severity, detectedWords: result.detectedWords })
      censoredFields.title = result.censoredText
    }
  }

  if (fields.description) {
    const result = moderateText(fields.description)
    if (!result.isClean) {
      issues.push({ field: "description", severity: result.severity, detectedWords: result.detectedWords })
      censoredFields.description = result.censoredText
    }
  }

  if (fields.location) {
    const result = moderateText(fields.location)
    if (!result.isClean) {
      issues.push({ field: "location", severity: result.severity, detectedWords: result.detectedWords })
      censoredFields.location = result.censoredText
    }
  }

  if (fields.activityTitles) {
    fields.activityTitles.forEach((title, i) => {
      const result = moderateText(title)
      if (!result.isClean) {
        issues.push({ field: `activity_title_${i}`, severity: result.severity, detectedWords: result.detectedWords })
      }
    })
  }

  if (fields.activityDescriptions) {
    fields.activityDescriptions.forEach((desc, i) => {
      const result = moderateText(desc)
      if (!result.isClean) {
        issues.push({ field: `activity_description_${i}`, severity: result.severity, detectedWords: result.detectedWords })
      }
    })
  }

  return {
    isClean: issues.length === 0,
    issues,
    censoredFields,
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
