/**
 * Types for TVMaze Show API.
 * @see https://api.tvmaze.com/shows
 * @see https://api.tvmaze.com/shows/:id?embed=cast
 * @see https://api.tvmaze.com/shows/:id?embed[]=crew&embed[]=cast
 */

import type {
  TvmazeImage,
  TvmazeCountry,
  TvmazeLink,
  TvmazeRating,
  TvmazeShowImage,
} from './common'
import type { TvmazeCast, TvmazeCrew } from './person'
import type { TvmazeSeason } from './season'
import type { TvmazeEpisode } from './episode'

export interface TvmazeNetwork {
  id: number
  name: string
  country: TvmazeCountry | null
  officialSite: string | null
}

export interface TvmazeWebChannel {
  id: number
  name: string
  country: TvmazeCountry | null
  officialSite: string | null
}

export interface TvmazeSchedule {
  time: string
  days: string[]
}

export interface TvmazeExternals {
  tvrage: number | null
  thetvdb: number | null
  imdb: string | null
}

export interface TvmazeShowLinks {
  self: TvmazeLink
  previousepisode?: TvmazeLink
  nextepisode?: TvmazeLink
}

export interface TvmazeShowEmbedded {
  cast?: TvmazeCast[]
  crew?: TvmazeCrew[]
  seasons?: TvmazeSeason[]
  episodes?: TvmazeEpisode[]
  images?: TvmazeShowImage[]
}

export interface TvmazeShow {
  id: number
  url: string
  name: string
  type: string
  language: string
  genres: string[]
  status: string
  runtime: number | null
  averageRuntime: number | null
  premiered: string | null
  ended: string | null
  officialSite: string | null
  schedule: TvmazeSchedule
  rating: TvmazeRating
  weight: number
  network: TvmazeNetwork | null
  webChannel: TvmazeWebChannel | null
  dvdCountry: TvmazeCountry | null
  externals: TvmazeExternals
  image: TvmazeImage | null
  summary: string | null
  updated: number
  _links: TvmazeShowLinks
  _embedded?: TvmazeShowEmbedded
}


