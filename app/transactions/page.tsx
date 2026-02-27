import { PageHeader } from "@/components/page-header"
import { TransactionsContent } from "./transactions-content"

export default function TransactionsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <PageHeader
        title="Transactions & Commission"
        description="Track bookings, commissions, and revenue from Tinerary transactions."
      />
      <TransactionsContent />
    </div>
  )
}
