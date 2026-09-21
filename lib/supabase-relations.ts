/**
 * Helpers for PostgREST embedded relations.
 *
 * A to-one embed (`profiles:user_id (...)`) comes back as a single object at
 * runtime, but the generated types widen it to an array. `one()` narrows it
 * back without an `any` cast, and tolerates either shape so the same code
 * works if a query is later changed to a to-many embed.
 */

/** Unwrap a to-one embedded relation to a single row, or null when absent. */
export function one<T>(relation: T | T[] | null | undefined): T | null {
  if (relation == null) return null
  if (Array.isArray(relation)) return relation[0] ?? null
  return relation
}

/** Normalize an embedded relation to an array, whichever shape it arrives in. */
export function many<T>(relation: T | T[] | null | undefined): T[] {
  if (relation == null) return []
  return Array.isArray(relation) ? relation : [relation]
}
