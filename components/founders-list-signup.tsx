"use client"

import { useState } from "react"

interface Props {
  source?: string
  className?: string
  placeholder?: string
}

export function FoundersListSignup({ source = "homepage", className = "", placeholder = "Leave your email if you travel like this." }: Props) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [message, setMessage] = useState<string>("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === "submitting") return
    setStatus("submitting")
    setMessage("")
    try {
      const res = await fetch("/api/founders-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source,
          referrer: typeof document !== "undefined" ? document.referrer : "",
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setStatus("error")
        setMessage(data?.error ?? "Something went wrong.")
        return
      }
      setStatus("success")
      setMessage("You're on the Founders' List.")
      setEmail("")
    } catch {
      setStatus("error")
      setMessage("Network error. Please try again.")
    }
  }

  if (status === "success") {
    return (
      <div className={`text-center ${className}`}>
        <p className="text-lg">{message}</p>
        <p className="mt-2 text-sm opacity-70">Watch your inbox.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={`w-full max-w-xl mx-auto ${className}`}>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          aria-label="Email address"
          className="flex-1 px-4 py-3 bg-transparent border border-current/40 placeholder:text-current/60 focus:outline-none focus:border-current text-base"
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          className="px-6 py-3 bg-current text-[color:var(--manifesto-bg,#0a0a0a)] font-medium tracking-wide uppercase text-sm hover:opacity-90 disabled:opacity-60"
        >
          {status === "submitting" ? "Joining…" : "Join the Founders' List"}
        </button>
      </div>
      {status === "error" && (
        <p className="mt-2 text-sm opacity-80">{message}</p>
      )}
    </form>
  )
}
