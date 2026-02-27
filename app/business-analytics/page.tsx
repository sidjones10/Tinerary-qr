import { AppHeader } from "@/components/app-header"
import { PageHeader } from "@/components/page-header"
import { BusinessAnalyticsContent } from "@/app/business-analytics/business-analytics-content"

export default function BusinessAnalyticsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1">
        <div className="container px-4 py-6">
          <PageHeader title="Advanced Analytics & Insights" />
          <BusinessAnalyticsContent />
        </div>
      </main>
    </div>
  )
}
