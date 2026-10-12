/**
 * SMS delivery for phone verification.
 *
 * Sends through Twilio when it is configured. In development, with no Twilio
 * credentials, the code is logged to the server console instead so local
 * sign-up still works.
 *
 * This module previously returned `true` in production without sending
 * anything, which made phone verification appear to succeed while no message
 * was ever delivered — and printed the code into the production log.
 */
import { randomInt } from "crypto"
import {
  formatPhoneNumber as formatE164,
  sendVerificationSMS as sendViaTwilio,
} from "@/backend/services/twilio"

export { formatPhoneNumber } from "@/backend/services/twilio"

/** True when Twilio is configured well enough to actually deliver a message. */
function twilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER,
  )
}

/**
 * A 6-digit verification code.
 *
 * Uses crypto.randomInt, not Math.random: this is an authentication secret,
 * and Math.random is predictable from prior outputs.
 */
export function generateVerificationCode(): string {
  return randomInt(100000, 1000000).toString()
}

/**
 * Send a verification code.
 *
 * Returns false when the message could not be delivered, so the caller can
 * surface a real error instead of moving the user to a code-entry screen for
 * a code that was never sent.
 */
export async function sendVerificationSMS(
  phoneNumber: string,
  code: string,
): Promise<boolean> {
  const formattedPhone = formatE164(phoneNumber)

  if (twilioConfigured()) {
    return sendViaTwilio(formattedPhone, code)
  }

  // No provider configured. Acceptable locally; never in production.
  if (process.env.NODE_ENV === "production") {
    console.error(
      "SMS provider is not configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / " +
        "TWILIO_PHONE_NUMBER). Refusing to report a verification code as sent.",
    )
    return false
  }

  console.log("\n" + "=".repeat(60))
  console.log("📱 VERIFICATION CODE (dev — no SMS provider configured)")
  console.log("=".repeat(60))
  console.log(`Phone: ${formattedPhone}`)
  console.log(`Code:  ${code}`)
  console.log("=".repeat(60) + "\n")

  return true
}
