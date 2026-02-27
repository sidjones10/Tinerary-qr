"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Coins } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

export function CoinBalance() {
  const [balance, setBalance] = useState<number | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function fetchBalance() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      setUserId(session.user.id)

      // Ensure balance row exists
      await supabase.rpc("ensure_coin_balance", { p_user_id: session.user.id })

      const { data } = await supabase
        .from("coin_balances")
        .select("balance")
        .eq("user_id", session.user.id)
        .single()

      setBalance(data?.balance ?? 0)
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
