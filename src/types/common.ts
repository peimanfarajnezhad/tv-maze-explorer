/**
 * Shared types used across TVMaze API responses.
 */

export interface TvmazeImage {
  medium: string
  original: string
}

export interface TvmazeCountry {
  name: string
  code: string
  timezone: string
}

export interface TvmazeLink {
  href: string
  name?: string
}

export interface TvmazeRating {
  average: number | null
}
