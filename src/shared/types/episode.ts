/**
 * Types for TVMaze Episodes API.
 * @see https://api.tvmaze.com/shows/:id/episodes
 */

import type { TvmazeImage, TvmazeRating } from './common'

export interface TvmazeEpisodeLinks {
  self: { href: string }
  show: { href: string; name: string }
}

export interface TvmazeEpisode {
  id: number
  url: string
  name: string
  season: number
  number: number
  type: string
  airdate: string | null
  airtime: string | null
  airstamp: string | null
  runtime: number | null
  rating: TvmazeRating
  image: TvmazeImage | null
  summary: string | null
  _links: TvmazeEpisodeLinks
}
