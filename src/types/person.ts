/**
 * Types for Person, Character and Cast from TVMaze API.
 * Used in show detail with ?embed=cast
 */

import type { TvmazeImage, TvmazeCountry } from './common'

export interface TvmazePerson {
  id: number
  url: string
  name: string
  country: TvmazeCountry | null
  birthday: string | null
  deathday: string | null
  gender: string
  image: TvmazeImage | null
  updated: number
  _links: {
    self: { href: string }
  }
}

export interface TvmazeCharacter {
  id: number
  url: string
  name: string
  image: TvmazeImage | null
  _links: {
    self: { href: string }
  }
}

export interface TvmazeCast {
  person: TvmazePerson
  character: TvmazeCharacter
  self: boolean
  voice: boolean
}

/** Crew member (e.g. Creator, Executive Producer). From ?embed[]=crew */
export interface TvmazeCrew {
  type: string
  person: TvmazePerson
}
