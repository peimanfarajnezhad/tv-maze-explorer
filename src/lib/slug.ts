/**
 * URL-friendly slug helpers for genre routes.
 * Both id and name in /genres/:name use kebab-case.
 */

/**
 * Convert a genre display name to a kebab-case URL slug.
 * e.g. "Science-Fiction" → "science-fiction"
 */
export function genreNameToSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Convert a URL slug back to a display name (title-case).
 * e.g. "science-fiction" → "Science Fiction"
 * When knownGenres is provided, returns the exact genre string from DB if the slug matches.
 */
export function slugToGenreDisplayName(
  slug: string,
  knownGenres?: string[]
): string {
  if (knownGenres?.length) {
    const found = knownGenres.find((g) => genreNameToSlug(g) === slug)
    if (found) return found
  }
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}
