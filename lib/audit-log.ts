/**
 * Server-side audit logging for admin and security-sensitive actions.
 *
 * Logs are stored in the `admin_audit_logs` table. If the table doesn't exist
 * yet the function fails silently so it never breaks the action being audited.
 */

import { createClient } from "@supabase/supabase-js"

export interface AuditLogEntry {
  /** The admin user who performed the action */
  actor_id: string
  /** Human-readable action name, e.g. "delete_user", "send_bulk_email" */
  action: string
  /** The entity being acted upon (user id, itinerary id, etc.) */
  target_id?: string
  /** Additional context about the action */
  metadata?: Record<string, unknown>
  /** Client IP address */
  ip_address?: string
}

/**
 * Write an entry to the admin audit log.
 *
 * Uses the service-role client to bypass RLS. Failures are caught and logged
 * to the console — they should never prevent the primary action from completing.
 */
export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return

    const admin = createClient(url, key)
    await admin.from("admin_audit_logs").insert({
      actor_id: entry.actor_id,
      action: entry.action,
      target_id: entry.target_id || null,
      metadata: entry.metadata || {},
      ip_address: entry.ip_address || null,
      created_at: new Date().toISOString(),
    })
  } catch (err) {
    // Never let audit logging break the primary operation
    console.error("Audit log write failed:", err)
  }
}
