import { PageHeader } from "@/components/page-header"
import { AffiliateContent } from "./affiliate-content"

export default function AffiliatePage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <PageHeader
        title="Affiliate Marketing & Packing List Commerce"
        description="Earn through referral links, experience promotions, and auto-matched packing list product links."
      />
      <AffiliateContent />
    </div>
  )
}
