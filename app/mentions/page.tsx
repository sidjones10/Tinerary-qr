import { PageHeader } from "@/components/page-header"
import { MentionsContent } from "./mentions-content"

export default function MentionsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <PageHeader
        title="Organic Mention Highlights"
        description="When users mention your business in itineraries, highlight those mentions to add branding and booking links."
      />
      <MentionsContent />
    </div>
  )
}
