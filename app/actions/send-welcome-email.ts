"use server"

import { sendWelcomeEmail } from "@/lib/email-notifications"

export async function triggerWelcomeEmail(email: string, name: string) {
  try {
    await sendWelcomeEmail(email, name)
    return { success: true }
  } catch (error) {
    console.error("Failed to send welcome email:", error)
    return { success: false }
  }
}
