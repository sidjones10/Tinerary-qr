"use client"

import type React from "react"
import { useState } from "react"

interface ExpenseFormProps {
  onSubmit: (expense: { description: string; amount: number; isSplit: boolean }) => void
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onSubmit }) => {
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState(0)
  const [isSplit, setIsSplit] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ description, amount, isSplit })
    setDescription("")
    setAmount(0)
    setIsSplit(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="description">Description:</label>
        <input
          type="text"
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="amount">Amount:</label>
        <input
          type="number"
          id="amount"
          value={amount}
          onChange={(e) => setAmount(Number.parseFloat(e.target.value))}
          required
        />
      </div>
      <div>
        <label htmlFor="isSplit">Split Expense:</label>
        <input type="checkbox" id="isSplit" checked={isSplit} onChange={(e) => setIsSplit(e.target.checked)} />
      </div>
      <button type="submit">Add Expense</button>
    </form>
  )
}

export default ExpenseForm
