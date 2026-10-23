/**
 * Shared types for the create wizard.
 *
 * Each step previously declared its own inline `formData` slice and an
 * `onChange: (field: string, value: any) => void`. That made every step
 * structurally incompatible with the page: a handler accepting only
 * `keyof CreateFormData` is not assignable to one accepting any `string`,
 * and a step asking for a field the form didn't have (`inviteEmails`) could
 * never be satisfied. One shared contract removes both problems.
 */

export interface CreateFormData {
  title: string
  type: "event" | "trip"
  startDate: string
  endDate: string
  location: string
  description: string
  coverImage: string | null
  isPublic: boolean
  activities: Array<{
    title: string
    location: string
    time: string
    description: string
    day: string
  }>
  /** Not collected by the wizard yet; the preview step renders it if present. */
  inviteEmails?: string[]
}

/** Props every editable wizard step receives. */
export interface WizardStepProps {
  formData: CreateFormData
  onChange: (field: keyof CreateFormData, value: any) => void
  errors?: Record<string, string>
}

/** The read-only preview step takes no handlers. */
export interface WizardPreviewProps {
  formData: CreateFormData
}
