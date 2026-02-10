import React from "react"
import type { Metadata } from "next"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminAuthGuard } from "@/components/admin/admin-auth-guard"

export const metadata: Metadata = {
  title: "Admin Dashboard - Tinerary",
  description: "Tinerary admin dashboard for tracking metrics, users, and searches",
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthGuard>
      <div
        className="flex min-h-screen"
        style={{
          background: "linear-gradient(135deg, #fef9f3 0%, #fff5ee 50%, #fef9f3 100%)",
        }}
      >
        <AdminSidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </AdminAuthGuard>
  )
}
