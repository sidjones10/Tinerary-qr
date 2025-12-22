"use client"

import { useState } from "react"
import { CreditCard, DollarSign, Plus, QrCode, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ExpenseSplitter() {
  const [expenses, setExpenses] = useState([{ id: 1, name: "Accommodation", amount: 1200, splitType: "equal" }])

  const addExpense = () => {
    const newId = expenses.length > 0 ? Math.max(...expenses.map((e) => e.id)) + 1 : 1
    setExpenses([...expenses, { id: newId, name: "", amount: 0, splitType: "equal" }])
  }

  const removeExpense = (id: number) => {
    setExpenses(expenses.filter((expense) => expense.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="p-3 bg-green-50 rounded-lg border border-green-100">
        <p className="text-sm text-green-800">
          <strong>Expense Splitting</strong> allows you to track shared costs and collect payments from your group.
        </p>
      </div>

      <Tabs defaultValue="expenses">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="payment">Payment Methods</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4 mt-4">
          {expenses.map((expense) => (
            <Card key={expense.id} className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => removeExpense(expense.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>

              <CardContent className="p-4 grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Expense Name</Label>
                    <Input placeholder="Hotel, Dinner, etc." defaultValue={expense.name} />
                  </div>
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <div className="flex items-center border rounded-md">
                      <DollarSign className="ml-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="0.00"
                        className="border-0"
                        defaultValue={expense.amount || ""}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Split Type</Label>
                  <RadioGroup defaultValue={expense.splitType} className="flex space-x-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="equal" id={`equal-${expense.id}`} />
                      <Label htmlFor={`equal-${expense.id}`}>Equal</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="percentage" id={`percentage-${expense.id}`} />
                      <Label htmlFor={`percentage-${expense.id}`}>Percentage</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="custom" id={`custom-${expense.id}`} />
                      <Label htmlFor={`custom-${expense.id}`}>Custom</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" onClick={addExpense} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4 mt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Payment Collection Method</Label>
              <RadioGroup defaultValue="direct">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="direct" id="direct" />
                  <Label htmlFor="direct" className="flex items-center">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Direct Payment (Credit Card)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="qr" id="qr" />
                  <Label htmlFor="qr" className="flex items-center">
                    <QrCode className="mr-2 h-4 w-4" />
                    Payment App QR Codes
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Payment Apps</Label>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex items-center">
                  <Label className="flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="h-4 w-4 rounded border border-primary mr-2 peer-checked:bg-primary peer-checked:text-primary-foreground" />
                    <span>Venmo</span>
                  </Label>
                </div>
                <div className="flex items-center">
                  <Label className="flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="h-4 w-4 rounded border border-primary mr-2 peer-checked:bg-primary peer-checked:text-primary-foreground" />
                    <span>CashApp</span>
                  </Label>
                </div>
                <div className="flex items-center">
                  <Label className="flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="h-4 w-4 rounded border border-primary mr-2 peer-checked:bg-primary peer-checked:text-primary-foreground" />
                    <span>Zelle</span>
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Venmo Username</Label>
              <Input placeholder="@username" />
            </div>

            <div className="space-y-2">
              <Label>CashApp Username</Label>
              <Input placeholder="$username" />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
