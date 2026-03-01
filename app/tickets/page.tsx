"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TicketsHeader } from "@/components/tickets-header"
import { TicketsList } from "@/components/tickets-list"

export default function TicketsPage() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <TicketsHeader />

      <Tabs defaultValue="upcoming" className="mt-6">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          <TicketsList upcoming={true} />
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          <TicketsList upcoming={false} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
