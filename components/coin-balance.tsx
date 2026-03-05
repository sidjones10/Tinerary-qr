"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Coins } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { PHASE_2_ENABLED } from "@/lib/phase2"

export function CoinBalance() {
  const [balance, setBalance] = useState<number | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function fetchBalance() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      setUserId(session.user.id)

      try {
        const res = await fetch("/api/coins")
        if (res.ok) {
          const data = await res.json()
          setBalance(data.balance ?? 0)
        } else {
          setBalance(0)
        }
      } catch {
        setBalance(0)
      }
    }

    fetchBalance()

    // Re-fetch on auth change
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchBalance()
    })

    return () => subscription?.unsubscribe()
  }, [])

  if (balance === null || !userId) return null

  return (
    <Button variant="ghost" size="sm" className="gap-1.5 px-2.5" asChild>
      <Link href="/coins" title="Tinerary Coins">
        <Coins className="h-4 w-4 text-tinerary-gold" />
        <span className="text-sm font-medium tabular-nums">{balance.toLocaleString()}</span>
      </Link>
    </Button>
  )
}
