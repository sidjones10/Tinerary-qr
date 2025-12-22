"use client"

import { useState } from "react"
import { DollarSign, Calendar, MapPin, Minus, Plus, Globe } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"

interface ExpenseCategory {
  id: string
  name: string
  icon: string
  value: number
  min: number
  max: number
  step: number
  rate: string
  enabled: boolean
}

interface Expense {
  id: string
  name: string
  amount: number
  perPerson: number
  paidBy: string
}

export function ExpenseEstimator() {
  const [destination, setDestination] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [travelers, setTravelers] = useState(2)
  const [days, setDays] = useState(3)
  const [currency, setCurrency] = useState("USD")

  const [categories, setCategories] = useState<ExpenseCategory[]>([
    {
      id: "accommodation",
      name: "Accommodation",
      icon: "🏨",
      value: 150,
      min: 0,
      max: 500,
      step: 10,
      rate: "/night",
      enabled: true,
    },
    {
      id: "transportation",
      name: "Transportation",
      icon: "🚕",
      value: 400,
      min: 0,
      max: 2000,
      step: 50,
      rate: "/person",
      enabled: true,
    },
    {
      id: "food",
      name: "Food & Dining",
      icon: "🍽️",
      value: 60,
      min: 0,
      max: 200,
      step: 5,
      rate: "/person/day",
      enabled: true,
    },
    {
      id: "activities",
      name: "Activities",
      icon: "🎯",
      value: 40,
      min: 0,
      max: 200,
      step: 5,
      rate: "/person/day",
      enabled: true,
    },
  ])

  const [expenses, setExpenses] = useState<Expense[]>([
    {
      id: "1",
      name: "Hotel",
      amount: 1200,
      perPerson: 300,
      paidBy: "Alex Rodriguez",
    },
    {
      id: "2",
      name: "Broadway Tickets",
      amount: 800,
      perPerson: 200,
      paidBy: "You",
    },
    {
      id: "3",
      name: "Dinner at Carbone",
      amount: 450,
      perPerson: 75,
      paidBy: "Taylor Moore",
    },
  ])

  const handleCategoryChange = (id: string, value: number) => {
    setCategories(categories.map((category) => (category.id === id ? { ...category, value } : category)))
  }

  const handleCategoryToggle = (id: string, enabled: boolean) => {
    setCategories(categories.map((category) => (category.id === id ? { ...category, enabled } : category)))
  }

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  const decreaseTravelers = () => {
    if (travelers > 1) setTravelers(travelers - 1)
  }

  const increaseTravelers = () => {
    setTravelers(travelers + 1)
  }

  const decreaseDays = () => {
    if (days > 1) setDays(days - 1)
  }

  const increaseDays = () => {
    setDays(days + 1)
  }

  return (
    <div className="space-y-6">
      {/* Trip Expense Estimator */}
      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="flex items-center text-xl font-semibold">
            <DollarSign className="mr-2 h-5 w-5 text-orange-500" />
            Trip Expense Estimator
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Estimate your trip budget based on destination, duration, and preferences
          </p>
        </CardHeader>
        <CardContent className="px-0 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Destination</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="City, Country"
                  className="pl-9"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Travel Dates</label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Pick a date"
                    className="pl-9"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Pick a date"
                    className="pl-9"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Number of Travelers</label>
              <div className="flex items-center">
                <Button variant="outline" size="icon" onClick={decreaseTravelers} disabled={travelers <= 1}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="mx-4 w-6 text-center">{travelers}</span>
                <Button variant="outline" size="icon" onClick={increaseTravelers}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Number of Days</label>
              <div className="flex items-center">
                <Button variant="outline" size="icon" onClick={decreaseDays} disabled={days <= 1}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="mx-4 w-6 text-center">{days}</span>
                <Button variant="outline" size="icon" onClick={increaseDays}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center">
              <Globe className="mr-2 h-4 w-4 text-gray-400" />
              Currency
            </label>
            <div className="relative">
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm appearance-none"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="USD">$ USD - US Dollar</option>
                <option value="EUR">€ EUR - Euro</option>
                <option value="GBP">£ GBP - British Pound</option>
                <option value="JPY">¥ JPY - Japanese Yen</option>
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M2.5 4.5L6 8L9.5 4.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Currency will be auto-detected based on your destination, but you can change it manually.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md">
            <div>
              <h3 className="text-sm font-medium mb-4">Expense Categories</h3>
              <div className="space-y-6">
                {categories.map((category) => (
                  <div key={category.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="mr-2">{category.icon}</span>
                        <span className="text-sm font-medium">{category.name}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm font-medium mr-2">
                          ${category.value}
                          {category.rate}
                        </span>
                        <Switch
                          checked={category.enabled}
                          onCheckedChange={(checked) => handleCategoryToggle(category.id, checked)}
                        />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs w-10">${category.min}</span>
                      <input
                        type="range"
                        min={category.min}
                        max={category.max}
                        step={category.step}
                        value={category.value}
                        onChange={(e) => handleCategoryChange(category.id, Number.parseInt(e.target.value))}
                        disabled={!category.enabled}
                        className="flex-1 mx-2 h-2 bg-gradient-to-r from-red-400 to-pink-500 rounded-full appearance-none"
                      />
                      <span className="text-xs w-10 text-right">${category.max}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-4">Summary</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category.id} className="flex justify-between items-center">
                    <span className="text-sm">{category.name}</span>
                    <span className="text-sm font-medium">
                      $
                      {category.enabled
                        ? category.id === "accommodation"
                          ? category.value * days
                          : category.id === "transportation"
                            ? category.value * travelers
                            : category.value * days * travelers
                        : 0}
                    </span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-4">
                  <div className="flex justify-between items-center font-bold">
                    <span>Estimated Total</span>
                    <span>
                      $
                      {categories.reduce((sum, category) => {
                        if (!category.enabled) return sum
                        if (category.id === "accommodation") return sum + category.value * days
                        if (category.id === "transportation") return sum + category.value * travelers
                        return sum + category.value * days * travelers
                      }, 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trip Expenses */}
      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-xl font-semibold">Trip Expenses</CardTitle>
          <p className="text-sm text-muted-foreground">Track and split costs with your group</p>
        </CardHeader>
        <CardContent className="px-0 space-y-4">
          {expenses.map((expense) => (
            <div key={expense.id} className="flex justify-between items-center py-3 border-b">
              <div>
                <h4 className="font-medium">{expense.name}</h4>
                <p className="text-sm text-gray-500">Paid by {expense.paidBy}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">${expense.amount}</p>
                <p className="text-sm text-gray-500">${expense.perPerson} per person</p>
              </div>
            </div>
          ))}

          <div className="flex justify-between items-center py-3 font-bold">
            <span>Total</span>
            <span>${totalExpenses}</span>
          </div>

          <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
