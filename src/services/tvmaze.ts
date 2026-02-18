import { get } from './api-client'
import type { TvmazeShow } from '@/types'
import type { TvmazeEpisode } from '@/types'

export function getShows(page = 0): Promise<TvmazeShow[]> {
  return get<TvmazeShow[]>(`/shows?page=${page}`)
}

export function getShow(id: number): Promise<TvmazeShow> {
  return get<TvmazeShow>(`/shows/${id}?embed[]=crew&embed[]=cast`)
}

export function getSeasonEpisodes(seasonId: number): Promise<TvmazeEpisode[]> {
  return get<TvmazeEpisode[]>(`/seasons/${seasonId}/episodes`)
}
