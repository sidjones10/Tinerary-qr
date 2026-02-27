import { redirect } from "next/navigation"

// Business setup is now handled inline on the Business Hub page.
// Preserve ?tier= param so the inline form can pre-select it.
export default async function BusinessOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string }>
}) {
  const params = await searchParams
  const tier = params.tier
  redirect(tier ? `/business-profile?tier=${tier}` : "/business-profile")
}
