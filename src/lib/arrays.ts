/**
 * Returns true if two string arrays have the same length and elements in order.
 * Useful to avoid replacing refs when content is unchanged (e.g. for Vue reactivity).
 */
export function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  return a.every((g, i) => g === b[i])
}
