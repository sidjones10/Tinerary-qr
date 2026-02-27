import { PageHeader } from "@/components/page-header"
import { BusinessProfileContent } from "./business-profile-content"

export default function BusinessProfilePage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <PageHeader
        title="Business Profile"
        description="Manage your business listing, branding, and subscription tier."
      />
      <BusinessProfileContent />
    </div>
  )
}
