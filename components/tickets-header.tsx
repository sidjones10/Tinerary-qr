import { Ticket } from "lucide-react"

export function TicketsHeader() {
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center gap-2">
        <Ticket className="h-5 w-5" />
        <h1 className="text-2xl font-bold">My Tickets</h1>
      </div>

      <p className="text-muted-foreground">Access all your tickets for upcoming and past events.</p>
    </div>
  )
}
