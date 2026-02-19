import { get } from './api-client'
import type { TvmazeShow } from '@/types'

export function getShows(page = 0): Promise<TvmazeShow[]> {
  return get<TvmazeShow[]>(`/shows?page=${page}`)
}

export function getShow(id: number): Promise<TvmazeShow> {
  return get<TvmazeShow>(
    `/shows/${id}?embed[]=images&embed[]=seasons&embed[]=episodes&embed[]=crew&embed[]=cast`,
  )
}
