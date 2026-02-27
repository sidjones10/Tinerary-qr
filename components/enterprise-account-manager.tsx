"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, Clock, User, MessageCircle, Shield } from "lucide-react"
import type { AccountManager } from "@/lib/enterprise"

interface EnterpriseAccountManagerProps {
  manager: AccountManager
}

export function EnterpriseAccountManager({ manager }: EnterpriseAccountManagerProps) {
  return (
    <Card className="border-tinerary-gold/20 bg-gradient-to-br from-tinerary-gold/5 to-transparent">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-br from-tinerary-gold to-tinerary-peach flex items-center justify-center">
            <Shield className="size-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-base">Dedicated Account Manager</CardTitle>
            <CardDescription>Your personal point of contact for all enterprise needs</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Manager info */}
          <div className="flex items-start gap-3 flex-1">
            <div className="size-12 rounded-full bg-tinerary-dark flex items-center justify-center shrink-0">
              {manager.avatarUrl ? (
                <img src={manager.avatarUrl} alt={manager.name} className="size-full rounded-full object-cover" />
              ) : (
                <User className="size-6 text-primary-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{manager.name}</p>
                <Badge variant="secondary" className="text-[10px]">{manager.title}</Badge>
              </div>
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="size-3 shrink-0" />
                  <a href={`mailto:${manager.email}`} className="text-primary hover:underline truncate">
                    {manager.email}
                  </a>
                </div>
                {manager.phone && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="size-3 shrink-0" />
                    <a href={`tel:${manager.phone}`} className="hover:underline">
                      {manager.phone}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="size-3 shrink-0" />
                  <span>{manager.availability}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-col gap-2 sm:w-48">
            <Button size="sm" className="btn-sunset w-full" asChild>
              <a href={`mailto:${manager.email}?subject=Enterprise Support Request`}>
                <Mail className="size-3 mr-1.5" />
                Email Manager
              </a>
            </Button>
            <Button size="sm" variant="outline" className="w-full">
              <MessageCircle className="size-3 mr-1.5" />
              Schedule Call
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
