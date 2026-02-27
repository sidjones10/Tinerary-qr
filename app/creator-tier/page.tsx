import { PageHeader } from "@/components/page-header"
import { CreatorTierContent } from "./creator-tier-content"

export default function CreatorTierPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <PageHeader
        title="Creator Tier & Post Boosts"
        description="Manage subscription tiers, boost individual posts, and track creator benefits."
      />
      <CreatorTierContent />
    </div>
  )
}
