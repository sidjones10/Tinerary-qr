"use client"

import { useState, useEffect } from "react"
import { DollarSign, Plus, Users, TrendingUp, Download, Check, X, UserCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  splits?: {
    user_id: string
    amount: number
    is_paid: boolean
  }[]
}

interface Participant {
  id: string
  name: string
  avatar_url?: string
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
  currentUserId: string
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
  const { toast } = useToast()
  const supabase = createClient()

  // Form state
  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    category: "food",
    paid_by_user_id: currentUserId,
    split_type: "equal" as const,
    date: new Date().toISOString().split("T")[0],
    currency: "USD",
  })

  const categories = [
    { value: "food", label: "Food & Dining", icon: "🍽️" },
    { value: "accommodation", label: "Accommodation", icon: "🏨" },
    { value: "transportation", label: "Transportation", icon: "🚗" },
    { value: "activities", label: "Activities", icon: "🎭" },
    { value: "shopping", label: "Shopping", icon: "🛍️" },
    { value: "other", label: "Other", icon: "📝" },
  ]

  useEffect(() => {
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

      if (error) throw error
      setExpenses(data || [])
    } catch (error: any) {
      console.error("Error fetching expenses:", error)
      toast({
        title: "Error",
        description: "Failed to load expenses",
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

      // Calculate net balances
      const balances: Record<string, number> = {}

      expensesData?.forEach((expense) => {
        // Person who paid gets credit
        balances[expense.paid_by_user_id] = (balances[expense.paid_by_user_id] || 0) + expense.amount

        // People who owe get debited
        expense.expense_splits?.forEach((split: any) => {
          balances[split.user_id] = (balances[split.user_id] || 0) - split.amount
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
      console.error("Error calculating settlements:", error)
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

    try {
      const amount = parseFloat(newExpense.amount)

      // Create expense
      const { data: expenseData, error: expenseError } = await supabase
        .from("expenses")
        .insert({
          itinerary_id: itineraryId,
          user_id: currentUserId,
          description: newExpense.description,
          amount,
          category: newExpense.category,
          paid_by_user_id: newExpense.paid_by_user_id,
          split_type: newExpense.split_type,
          date: newExpense.date,
          currency: newExpense.currency,
        })
        .select()
        .single()

      if (expenseError) throw expenseError

      // Create splits based on split type
      const splitAmount = amount / participants.length
      const splits = participants.map((p) => ({
        expense_id: expenseData.id,
        user_id: p.id,
        amount: splitAmount,
        is_paid: p.id === newExpense.paid_by_user_id,
      }))

      const { error: splitsError } = await supabase.from("expense_splits").insert(splits)

      if (splitsError) throw splitsError

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

      fetchExpenses()
      calculateSettlements()
    } catch (error: any) {
      console.error("Error adding expense:", error)
      toast({
        title: "Error",
        description: "Failed to add expense",
        variant: "destructive",
      })
    }
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
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddExpense}>Add Expense</Button>
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
                <p className="text-2xl font-bold">${totalExpenses.toFixed(2)}</p>
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
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">${expense.amount.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">
                              ${(expense.amount / participants.length).toFixed(2)} per person
                            </p>
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
            <div className="space-y-2">
              <p className="text-sm font-medium">Who owes whom</p>
              <p className="text-xs text-muted-foreground">
                Simplified settlement suggestions to minimize transactions
              </p>
            </div>

            <Separator />

            {settlements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Check className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>All settled up!</p>
                <p className="text-sm mt-2">No pending settlements</p>
              </div>
            ) : (
              <div className="space-y-3">
                {settlements.map((settlement, idx) => (
                  <Card key={idx}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={settlement.from_user?.avatar_url} />
                            <AvatarFallback>
                              {settlement.from_user?.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{settlement.from_user?.name}</p>
                            <p className="text-sm text-muted-foreground">owes</p>
                          </div>
                        </div>

                        <div className="text-center">
                          <p className="text-2xl font-bold text-red-500">${settlement.amount.toFixed(2)}</p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-medium">{settlement.to_user?.name}</p>
                            <p className="text-sm text-muted-foreground">receives</p>
                          </div>
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={settlement.to_user?.avatar_url} />
                            <AvatarFallback>
                              {settlement.to_user?.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="summary" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">Total Group Spending</p>
                  <p className="text-2xl font-bold">${totalExpenses.toFixed(2)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">You Paid</p>
                  <p className="text-2xl font-bold text-green-600">${myTotal.toFixed(2)}</p>
                </CardContent>
              </Card>
            </div>

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
                          <span className="text-sm font-medium">${categoryTotal.toFixed(2)}</span>
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
                    const paidExpenses = expenses.filter((e) => e.paid_by_user_id === participant.id)
                    const paidTotal = paidExpenses.reduce((sum, e) => sum + e.amount, 0)

                    return (
                      <div key={participant.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={participant.avatar_url} />
                            <AvatarFallback>{participant.name.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{participant.name}</span>
                        </div>
                        <span className="text-sm font-medium">${paidTotal.toFixed(2)}</span>
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
