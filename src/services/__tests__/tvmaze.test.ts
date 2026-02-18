import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getShows, getShow, getSeasonEpisodes } from '../tvmaze'
import type { TvmazeShow, TvmazeEpisode } from '@/types'

const mockGet = vi.fn()

vi.mock('../api-client', () => ({
  get: (...args: unknown[]) => mockGet(...args),
}))

beforeEach(() => {
  mockGet.mockReset()
})

describe('getShows()', () => {
  it('fetches page 0 by default', async () => {
    const shows: TvmazeShow[] = []
    mockGet.mockResolvedValueOnce(shows)

    const result = await getShows()

    expect(mockGet).toHaveBeenCalledWith('/shows?page=0')
    expect(result).toBe(shows)
  })

  it('passes the page number to the query string', async () => {
    mockGet.mockResolvedValueOnce([])

    await getShows(5)

    expect(mockGet).toHaveBeenCalledWith('/shows?page=5')
  })

  it('returns the array from api-client', async () => {
    const shows = [{ id: 1, name: 'Show A' }] as unknown as TvmazeShow[]
    mockGet.mockResolvedValueOnce(shows)

    const result = await getShows()

    expect(result).toEqual(shows)
  })

  it('propagates errors from the api client', async () => {
    mockGet.mockRejectedValueOnce(new Error('network failure'))

    await expect(getShows()).rejects.toThrow('network failure')
  })
})

describe('getShow()', () => {
  it('fetches a single show with crew and cast embeds', async () => {
    const show = { id: 42, name: 'Test' } as unknown as TvmazeShow
    mockGet.mockResolvedValueOnce(show)

    const result = await getShow(42)

    expect(mockGet).toHaveBeenCalledWith('/shows/42?embed[]=crew&embed[]=cast')
    expect(result).toBe(show)
  })

  it('propagates errors from the api client', async () => {
    mockGet.mockRejectedValueOnce(new Error('not found'))

    await expect(getShow(999)).rejects.toThrow('not found')
  })
})

describe('getSeasonEpisodes()', () => {
  it('fetches episodes for the given season id', async () => {
    const episodes = [{ id: 1, name: 'Pilot' }] as unknown as TvmazeEpisode[]
    mockGet.mockResolvedValueOnce(episodes)

    const result = await getSeasonEpisodes(7)

    expect(mockGet).toHaveBeenCalledWith('/seasons/7/episodes')
    expect(result).toEqual(episodes)
  })

  it('propagates errors from the api client', async () => {
    mockGet.mockRejectedValueOnce(new Error('server error'))

    await expect(getSeasonEpisodes(1)).rejects.toThrow('server error')
  })
})
