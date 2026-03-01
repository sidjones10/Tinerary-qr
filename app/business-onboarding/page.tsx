import { redirect } from "next/navigation"

// Business setup is handled via the dialog on the Business Settings page.
// Preserve ?tier= param so the dialog can pre-select it.
export default async function BusinessOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string }>
}) {
  const params = await searchParams
  const tier = params.tier
  redirect(tier ? `/settings?section=business&tier=${tier}` : "/settings?section=business")
}
