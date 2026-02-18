/**
 * Types for TVMaze Seasons API.
 * @see https://api.tvmaze.com/shows/:id/seasons
 */

import type { TvmazeImage } from './common'
import type { TvmazeNetwork, TvmazeWebChannel } from './show'

export interface TvmazeSeasonLinks {
  self: { href: string }
}

export interface TvmazeSeason {
  id: number
  url: string
  number: number
  name: string
  episodeOrder: number
  premiereDate: string | null
  endDate: string | null
  network: TvmazeNetwork | null
  webChannel: TvmazeWebChannel | null
  image: TvmazeImage | null
  summary: string | null
  _links: TvmazeSeasonLinks
}
