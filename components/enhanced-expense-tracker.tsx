"use client"

import { useState, useEffect } from "react"
import { DollarSign, Plus, Users, TrendingUp, Download, Check, X, UserCheck, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { getCurrencySymbol, formatDualCurrency, type Currency } from "@/lib/currency-utils"

interface Expense {
  id: string
  description: string
  amount: number
  category: string
  paid_by_user_id: string
  split_type: "equal" | "percentage" | "custom" | "shares"
  date: string
  currency: string
  paid_by?: {
    id: string
    name: string
    avatar_url?: string
  }
  expense_splits?: {
    user_id: string
    amount: number
    is_paid: boolean
  }[]
}

interface Participant {
  id: string
  name: string
  avatar_url?: string
  role?: string
}

interface Settlement {
  from_user_id: string
  to_user_id: string
  amount: number
  from_user?: Participant
  to_user?: Participant
}

interface EnhancedExpenseTrackerProps {
  itineraryId: string
  participants: Participant[]
  currentUserId?: string
}

export function EnhancedExpenseTracker({
  itineraryId,
  participants,
  currentUserId,
}: EnhancedExpenseTrackerProps) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userCurrency, setUserCurrency] = useState<Currency>("USD")
  const [itineraryCurrency, setItineraryCurrency] = useState<Currency>("USD")
  const { toast } = useToast()
  const supabase = createClient()

  // Form state
  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    category: "food",
    paid_by_user_id: currentUserId || "",
    split_type: "equal" as const,
    date: new Date().toISOString().split("T")[0],
    currency: "USD",
  })
  const [splitAmong, setSplitAmong] = useState<string[]>(participants.map(p => p.id))
  const [settlingId, setSettlingId] = useState<string | null>(null)
  // Per-person values for non-equal split types (keyed by user id)
  const [customValues, setCustomValues] = useState<Record<string, string>>({})

  const categories = [
    { value: "food", label: "Food & Dining", icon: "🍽️" },
    { value: "accommodation", label: "Accommodation", icon: "🏨" },
    { value: "transportation", label: "Transportation", icon: "🚗" },
    { value: "activities", label: "Activities", icon: "🎭" },
    { value: "shopping", label: "Shopping", icon: "🛍️" },
    { value: "other", label: "Other", icon: "📝" },
  ]

  // Fetch user's currency preference
  useEffect(() => {
    const fetchUserCurrency = async () => {
      if (!currentUserId) return

      try {
        const { data, error } = await supabase
          .from("user_preferences")
          .select("language_preferences")
          .eq("user_id", currentUserId)
          .single()

        if (!error && data?.language_preferences?.currency) {
          const currency = data.language_preferences.currency.toUpperCase()
          setUserCurrency(currency)
          setNewExpense(prev => ({ ...prev, currency }))
        }
      } catch {
        // Silently ignore - column may not exist if migration not applied
      }
    }

    fetchUserCurrency()
  }, [currentUserId])

  // Fetch itinerary currency
  useEffect(() => {
    const fetchItineraryCurrency = async () => {
      try {
        const { data, error } = await supabase
          .from("itineraries")
          .select("currency")
          .eq("id", itineraryId)
          .single()

        if (!error && data?.currency) {
          setItineraryCurrency(data.currency as Currency)
          // Use itinerary currency for new expenses by default
          setNewExpense(prev => ({ ...prev, currency: data.currency }))
        }
      } catch (error) {
        console.error("Error fetching itinerary currency:", error)
      }
    }

    fetchItineraryCurrency()
    fetchExpenses()
    calculateSettlements()
  }, [itineraryId])

  const fetchExpenses = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select(`
          *,
          paid_by:paid_by_user_id (
            id,
            name,
            avatar_url
          ),
          expense_splits (
            user_id,
            amount,
            is_paid
          )
        `)
        .eq("itinerary_id", itineraryId)
        .order("date", { ascending: false })

      if (error) {
        console.error("Supabase error fetching expenses:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }
      setExpenses(data || [])
    } catch (error: any) {
      console.error("Error fetching expenses:", error?.message || error)
      toast({
        title: "Error",
        description: error?.message || "Failed to load expenses. Please check database schema.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateSettlements = async () => {
    try {
      // Fetch all expenses with splits
      const { data: expensesData, error } = await supabase
        .from("expenses")
        .select(`
          *,
          expense_splits (
            user_id,
            amount,
            is_paid
          )
        `)
        .eq("itinerary_id", itineraryId)

      if (error) throw error

      // Calculate net balances based only on unpaid splits
      const balances: Record<string, number> = {}

      expensesData?.forEach((expense) => {
        // Only count unpaid splits from non-payers as outstanding debts
        expense.expense_splits?.forEach((split: any) => {
          if (!split.is_paid && split.user_id !== expense.paid_by_user_id) {
            // This person still owes the payer
            balances[split.user_id] = (balances[split.user_id] || 0) - split.amount
            balances[expense.paid_by_user_id] = (balances[expense.paid_by_user_id] || 0) + split.amount
          }
        })
      })

      // Calculate settlements (simplified debt resolution)
      const newSettlements: Settlement[] = []
      const debtors = Object.entries(balances).filter(([_, amount]) => amount < 0)
      const creditors = Object.entries(balances).filter(([_, amount]) => amount > 0)

      debtors.forEach(([debtorId, debtAmount]) => {
        let remainingDebt = Math.abs(debtAmount)

        for (const [creditorId, creditAmount] of creditors) {
          if (remainingDebt <= 0) break

          const settlementAmount = Math.min(remainingDebt, creditAmount)
          if (settlementAmount > 0.01) {
            newSettlements.push({
              from_user_id: debtorId,
              to_user_id: creditorId,
              amount: settlementAmount,
              from_user: participants.find((p) => p.id === debtorId),
              to_user: participants.find((p) => p.id === creditorId),
            })
          }

          remainingDebt -= settlementAmount
          // Update creditor's available credit
          creditors[creditors.findIndex(([id]) => id === creditorId)][1] -= settlementAmount
        }
      })

      setSettlements(newSettlements)
    } catch (error: any) {
      console.error("Error calculating settlements:", error?.message || error)
      toast({
        title: "Error",
        description: error?.message || "Failed to calculate settlements. Please check database schema.",
        variant: "destructive",
      })
    }
  }

  const handleAddExpense = async () => {
    if (!newExpense.description || !newExpense.amount) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const amount = parseFloat(newExpense.amount)

    // Validate non-equal split types
    if (newExpense.split_type === "percentage") {
      const totalPct = splitAmong.reduce((sum, id) => sum + parseFloat(customValues[id] || "0"), 0)
      if (Math.abs(totalPct - 100) > 0.01) {
        toast({ title: "Invalid split", description: "Percentages must add up to 100%", variant: "destructive" })
        return
      }
    } else if (newExpense.split_type === "custom") {
      const totalCustom = splitAmong.reduce((sum, id) => sum + parseFloat(customValues[id] || "0"), 0)
      if (Math.abs(totalCustom - amount) > 0.01) {
        toast({ title: "Invalid split", description: "Custom amounts must add up to the total expense", variant: "destructive" })
        return
      }
    }

    try {
      setIsSubmitting(true)

      // Save split_type as 'custom' in DB to prevent the DB trigger from creating
      // its own splits (trigger only fires for 'equal' and uses itinerary_attendees
      // which may not include all invited users). We create all splits manually.
      const { data: expenseData, error: expenseError } = await supabase
        .from("expenses")
        .insert({
          itinerary_id: itineraryId,
          user_id: currentUserId,
          title: newExpense.description || newExpense.category || 'Expense',
          description: newExpense.description,
          amount,
          category: newExpense.category,
          paid_by_user_id: newExpense.paid_by_user_id,
          split_type: "custom",
          date: newExpense.date,
          currency: newExpense.currency,
        })
        .select()
        .single()

      if (expenseError) throw expenseError

      // Calculate per-person split amounts based on split type
      const splits = splitAmong.map((userId) => {
        let splitAmount: number
        if (newExpense.split_type === "equal") {
          splitAmount = amount / splitAmong.length
        } else if (newExpense.split_type === "percentage") {
          const pct = parseFloat(customValues[userId] || "0")
          splitAmount = (amount * pct) / 100
        } else if (newExpense.split_type === "shares") {
          const userShares = parseFloat(customValues[userId] || "1")
          const totalShares = splitAmong.reduce((sum, id) => sum + parseFloat(customValues[id] || "1"), 0)
          splitAmount = (amount * userShares) / totalShares
        } else {
          // custom amounts
          splitAmount = parseFloat(customValues[userId] || "0")
        }
        return {
          expense_id: expenseData.id,
          user_id: userId,
          amount: Math.round(splitAmount * 100) / 100,
          is_paid: userId === newExpense.paid_by_user_id,
        }
      })

      const { error: splitError } = await supabase
        .from("expense_splits")
        .insert(splits)

      if (splitError) throw splitError

      toast({
        title: "Expense added",
        description: "The expense has been added successfully",
      })

      setShowAddDialog(false)
      setNewExpense({
        description: "",
        amount: "",
        category: "food",
        paid_by_user_id: currentUserId,
        split_type: "equal",
        date: new Date().toISOString().split("T")[0],
        currency: "USD",
      })
      setSplitAmong(participants.map(p => p.id))
      setCustomValues({})

      fetchExpenses()
      calculateSettlements()
    } catch (error: any) {
      console.error("Error adding expense:", {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        fullError: error
      })
      toast({
        title: "Error",
        description: error?.message || "Failed to add expense. Please check database schema.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMarkSettled = async (fromUserId: string, toUserId: string) => {
    const key = `${fromUserId}-${toUserId}`
    setSettlingId(key)
    try {
      // Find all unpaid splits where fromUser owes toUser (toUser paid the expense)
      const { data: expensesData, error: fetchError } = await supabase
        .from("expenses")
        .select(`
          id,
          paid_by_user_id,
          expense_splits (
            id,
            user_id,
            is_paid
          )
        `)
        .eq("itinerary_id", itineraryId)
        .eq("paid_by_user_id", toUserId)

      if (fetchError) throw fetchError

      // Collect all unpaid split IDs where fromUser owes
      const splitIds: string[] = []
      expensesData?.forEach((expense) => {
        expense.expense_splits?.forEach((split: any) => {
          if (split.user_id === fromUserId && !split.is_paid) {
            splitIds.push(split.id)
          }
        })
      })

      if (splitIds.length > 0) {
        const { error: updateError } = await supabase
          .from("expense_splits")
          .update({ is_paid: true, paid_at: new Date().toISOString() })
          .in("id", splitIds)

        if (updateError) throw updateError
      }

      toast({
        title: "Settlement recorded",
        description: "The debt has been marked as settled",
      })

      // Refresh data
      fetchExpenses()
      calculateSettlements()
    } catch (error: any) {
      console.error("Error marking settlement:", error?.message || error)
      toast({
        title: "Error",
        description: error?.message || "Failed to mark settlement",
        variant: "destructive",
      })
    } finally {
      setSettlingId(null)
    }
  }

  // Helper function to format amount with dual currency if needed
  const formatAmount = (amount: number, expenseCurrency?: string) => {
    const currency = (expenseCurrency || itineraryCurrency) as Currency

    // If user's currency is different from the expense/itinerary currency, show both
    if (userCurrency !== currency) {
      return formatDualCurrency(amount, currency, userCurrency, { showBothCodes: true })
    }

    // Otherwise just show the amount with the currency symbol
    return `${getCurrencySymbol(currency)}${amount.toFixed(2)}`
  }

  const exportToCSV = () => {
    const headers = ["Date", "Description", "Category", "Paid By", "Amount", "Currency"]
    const rows = expenses.map((e) => [
      e.date,
      e.description,
      e.category,
      e.paid_by?.name || "Unknown",
      e.amount.toFixed(2),
      e.currency,
    ])

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `expenses-${itineraryId}.csv`
    link.click()

    toast({
      title: "Export successful",
      description: "Expenses have been exported to CSV",
    })
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const myExpenses = expenses.filter((e) => e.paid_by_user_id === currentUserId)
  const myTotal = myExpenses.reduce((sum, e) => sum + e.amount, 0)

  // Calculate what each participant owes (their share from splits) and what they paid
  const getParticipantSummary = (participantId: string) => {
    let totalOwed = 0 // what they owe based on splits
    let totalPaid = 0 // what they paid out of pocket
    expenses.forEach((e) => {
      if (e.paid_by_user_id === participantId) {
        totalPaid += e.amount
      }
      const split = e.expense_splits?.find(s => s.user_id === participantId)
      if (split) {
        totalOwed += split.amount
      }
    })
    return { totalOwed, totalPaid, net: totalPaid - totalOwed }
  }

  const myShare = expenses.reduce((sum, e) => {
    const split = e.expense_splits?.find(s => s.user_id === currentUserId)
    return sum + (split?.amount || 0)
  }, 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Expense Tracker
            </CardTitle>
            <CardDescription>Track and split expenses with your group</CardDescription>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Expense</DialogTitle>
                <DialogDescription>Record a new expense and split it with your group</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="e.g., Dinner at restaurant"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <div className="flex items-center border rounded-md">
                      <DollarSign className="ml-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="border-0"
                        value={newExpense.amount}
                        onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newExpense.date}
                      onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={newExpense.category} onValueChange={(v) => setNewExpense({ ...newExpense, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.icon} {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paid-by">Paid By</Label>
                  <Select
                    value={newExpense.paid_by_user_id}
                    onValueChange={(v) => setNewExpense({ ...newExpense, paid_by_user_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {participants.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Split Type</Label>
                  <Select value={newExpense.split_type} onValueChange={(v: any) => setNewExpense({ ...newExpense, split_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equal">Split Equally</SelectItem>
                      <SelectItem value="percentage">By Percentage</SelectItem>
                      <SelectItem value="shares">By Shares</SelectItem>
                      <SelectItem value="custom">Custom Amounts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Split Among</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto py-0 px-1 text-xs text-muted-foreground"
                      onClick={() => {
                        if (splitAmong.length === participants.length) {
                          setSplitAmong([newExpense.paid_by_user_id || currentUserId || ""])
                        } else {
                          setSplitAmong(participants.map(p => p.id))
                        }
                      }}
                    >
                      {splitAmong.length === participants.length ? "Deselect all" : "Select all"}
                    </Button>
                  </div>
                  <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                    {participants.map((p) => {
                      const isSelected = splitAmong.includes(p.id)
                      return (
                        <div key={p.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`split-${p.id}`}
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSplitAmong([...splitAmong, p.id])
                              } else {
                                if (splitAmong.length > 1) {
                                  setSplitAmong(splitAmong.filter(id => id !== p.id))
                                }
                              }
                            }}
                          />
                          <label
                            htmlFor={`split-${p.id}`}
                            className="flex items-center gap-2 text-sm cursor-pointer flex-1 min-w-0"
                          >
                            <Avatar className="h-6 w-6 shrink-0">
                              <AvatarImage src={p.avatar_url} />
                              <AvatarFallback className="text-xs">{p.name.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="truncate">{p.name}</span>
                            {p.id === newExpense.paid_by_user_id && (
                              <Badge variant="outline" className="text-xs py-0 shrink-0">Payer</Badge>
                            )}
                            {p.role === 'invited' && (
                              <Badge variant="secondary" className="text-xs py-0 shrink-0">Invited</Badge>
                            )}
                            {p.role === 'tentative' && (
                              <Badge variant="secondary" className="text-xs py-0 shrink-0">Maybe</Badge>
                            )}
                          </label>
                          {isSelected && newExpense.split_type !== "equal" && (
                            <div className="flex items-center gap-1 shrink-0">
                              <Input
                                type="number"
                                step={newExpense.split_type === "custom" ? "0.01" : "1"}
                                min="0"
                                className="w-20 h-7 text-xs"
                                placeholder={
                                  newExpense.split_type === "percentage" ? "%" :
                                  newExpense.split_type === "shares" ? "shares" : "$"
                                }
                                value={customValues[p.id] || ""}
                                onChange={(e) => setCustomValues({ ...customValues, [p.id]: e.target.value })}
                              />
                              <span className="text-xs text-muted-foreground">
                                {newExpense.split_type === "percentage" ? "%" :
                                 newExpense.split_type === "shares" ? "sh" : "$"}
                              </span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  {splitAmong.length > 0 && newExpense.amount && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      {newExpense.split_type === "equal" ? (
                        <p>
                          {formatAmount(parseFloat(newExpense.amount) / splitAmong.length)} per person ({splitAmong.length} {splitAmong.length === 1 ? "person" : "people"})
                        </p>
                      ) : newExpense.split_type === "percentage" ? (
                        <p>
                          Total: {splitAmong.reduce((sum, id) => sum + parseFloat(customValues[id] || "0"), 0).toFixed(0)}% of {formatAmount(parseFloat(newExpense.amount))}
                          {Math.abs(splitAmong.reduce((sum, id) => sum + parseFloat(customValues[id] || "0"), 0) - 100) > 0.01 && (
                            <span className="text-red-500 ml-1">(must equal 100%)</span>
                          )}
                        </p>
                      ) : newExpense.split_type === "custom" ? (
                        <p>
                          Assigned: {formatAmount(splitAmong.reduce((sum, id) => sum + parseFloat(customValues[id] || "0"), 0))} of {formatAmount(parseFloat(newExpense.amount))}
                          {Math.abs(splitAmong.reduce((sum, id) => sum + parseFloat(customValues[id] || "0"), 0) - parseFloat(newExpense.amount)) > 0.01 && (
                            <span className="text-red-500 ml-1">(must equal total)</span>
                          )}
                        </p>
                      ) : (
                        <p>{splitAmong.length} {splitAmong.length === 1 ? "person" : "people"} sharing by shares</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddExpense} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Expense"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="expenses" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="settlements">Settlements</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="expenses" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold">{formatAmount(totalExpenses)}</p>
              </div>
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>

            <Separator />

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading expenses...</div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No expenses yet</p>
                <p className="text-sm mt-2">Add your first expense to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {expenses.map((expense) => {
                  const category = categories.find((c) => c.value === expense.category)
                  return (
                    <Card key={expense.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{expense.description}</span>
                              <Badge variant="outline">{category?.icon} {category?.label}</Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <UserCheck className="h-3.5 w-3.5" />
                                <span>Paid by {expense.paid_by?.name || "Unknown"}</span>
                              </div>
                              <span>{new Date(expense.date).toLocaleDateString()}</span>
                            </div>
                            {expense.expense_splits && expense.expense_splits.length > 0 && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                <Users className="h-3 w-3" />
                                <span>
                                  Split among {expense.expense_splits.length} {expense.expense_splits.length === 1 ? "person" : "people"}
                                  {expense.expense_splits.length <= 4 && (
                                    <>: {expense.expense_splits.map(s => {
                                      const p = participants.find(pp => pp.id === s.user_id)
                                      return p?.name || "Unknown"
                                    }).join(", ")}</>
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">{formatAmount(expense.amount, expense.currency)}</p>
                            {expense.expense_splits && expense.expense_splits.length > 1 && (
                              <p className="text-xs text-muted-foreground">
                                {(() => {
                                  const amounts = expense.expense_splits!.map(s => s.amount)
                                  const allEqual = amounts.every(a => Math.abs(a - amounts[0]) < 0.01)
                                  if (allEqual) {
                                    return `${formatAmount(amounts[0], expense.currency)} each`
                                  }
                                  const mySplit = expense.expense_splits!.find(s => s.user_id === currentUserId)
                                  return mySplit ? `Your share: ${formatAmount(mySplit.amount, expense.currency)}` : ""
                                })()}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="settlements" className="space-y-4 mt-4">
            {settlements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Check className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p className="font-medium">All settled up!</p>
                <p className="text-sm mt-1">No one owes anything</p>
              </div>
            ) : (
              <div className="space-y-3">
                {settlements.map((settlement, idx) => {
                  const settleKey = `${settlement.from_user_id}-${settlement.to_user_id}`
                  const isSettling = settlingId === settleKey
                  const canSettle = currentUserId === settlement.from_user_id || currentUserId === settlement.to_user_id

                  return (
                    <Card key={idx}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 shrink-0">
                            <AvatarImage src={settlement.from_user?.avatar_url} />
                            <AvatarFallback>
                              {settlement.from_user?.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">
                              <span className="font-medium">{settlement.from_user?.name}</span>
                              {" owes "}
                              <span className="font-medium">{settlement.to_user?.name}</span>
                            </p>
                            <p className="text-xl font-bold text-red-500">{formatAmount(settlement.amount)}</p>
                          </div>
                          <Avatar className="h-10 w-10 shrink-0">
                            <AvatarImage src={settlement.to_user?.avatar_url} />
                            <AvatarFallback>
                              {settlement.to_user?.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>

                        {canSettle && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full gap-2 mt-3"
                            disabled={isSettling}
                            onClick={() => handleMarkSettled(settlement.from_user_id, settlement.to_user_id)}
                          >
                            {isSettling ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Settling...
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4" />
                                Mark as Settled
                              </>
                            )}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="summary" className="space-y-4 mt-4">
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground mb-1">Total Spent</p>
                  <p className="text-lg font-bold">{formatAmount(totalExpenses)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground mb-1">You Paid</p>
                  <p className="text-lg font-bold">{formatAmount(myTotal)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground mb-1">Your Share</p>
                  <p className="text-lg font-bold">{formatAmount(myShare)}</p>
                </CardContent>
              </Card>
            </div>

            {myTotal - myShare !== 0 && (
              <Card className={myTotal > myShare ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950" : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"}>
                <CardContent className="p-3 text-center">
                  <p className={`text-sm font-medium ${myTotal > myShare ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
                    {myTotal > myShare
                      ? `You are owed ${formatAmount(myTotal - myShare)}`
                      : `You owe ${formatAmount(myShare - myTotal)}`
                    }
                  </p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Expenses by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categories.map((category) => {
                    const categoryExpenses = expenses.filter((e) => e.category === category.value)
                    const categoryTotal = categoryExpenses.reduce((sum, e) => sum + e.amount, 0)
                    const percentage = totalExpenses > 0 ? (categoryTotal / totalExpenses) * 100 : 0

                    if (categoryTotal === 0) return null

                    return (
                      <div key={category.value}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm flex items-center gap-1">
                            <span>{category.icon}</span>
                            <span>{category.label}</span>
                          </span>
                          <span className="text-sm font-medium">{formatAmount(categoryTotal)}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-violet-500 to-pink-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{percentage.toFixed(1)}% of total</p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Participant Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {participants.map((participant) => {
                    const summary = getParticipantSummary(participant.id)

                    return (
                      <div key={participant.id} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={participant.avatar_url} />
                              <AvatarFallback>{participant.name.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{participant.name}</span>
                          </div>
                          <span className={`text-sm font-medium ${summary.net > 0.01 ? "text-green-600" : summary.net < -0.01 ? "text-red-600" : ""}`}>
                            {summary.net > 0.01 ? `+${formatAmount(summary.net)}` : summary.net < -0.01 ? `-${formatAmount(Math.abs(summary.net))}` : "Settled"}
                          </span>
                        </div>
                        <div className="flex gap-4 ml-10 text-xs text-muted-foreground">
                          <span>Paid: {formatAmount(summary.totalPaid)}</span>
                          <span>Share: {formatAmount(summary.totalOwed)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
