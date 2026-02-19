/**
 * Returns true if two string arrays have the same length and elements in order.
 * Useful to avoid replacing refs when content is unchanged (e.g. for Vue reactivity).
 */
export function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  return a.every((g, i) => g === b[i])
}

/** Shape used for carousel equality (genre + show ids). Compatible with GenreCarousel. */
export interface CarouselLike {
  genre: string
  shows: Array<{ id: number }>
}

/**
 * Returns true if two carousel arrays have the same genres and same show ids per genre in order.
 * Used to avoid replacing refs when carousel content is unchanged (e.g. during sync progress).
 */
export function carouselsEqual(a: CarouselLike[], b: CarouselLike[]): boolean {
  if (a.length !== b.length) return false
  return a.every((row, i) => {
    const other = b[i]
    if (!other || row.genre !== other.genre) return false
    if (row.shows.length !== other.shows.length) return false
    return row.shows.every((s, j) => s.id === other.shows[j]?.id)
  })
}
