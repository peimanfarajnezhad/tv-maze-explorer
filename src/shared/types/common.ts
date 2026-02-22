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

export interface TvmazeShowImage {
  id: number
  type: string
  main: boolean
  resolutions: {
    original?: { url: string; width: number; height: number }
    medium?: { url: string; width: number; height: number }
  }
}
