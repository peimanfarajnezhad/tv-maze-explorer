import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getShows, getShow } from '../tvmaze'
import type { TvmazeShow } from '@/types'

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
  it('fetches a single show with all embeds (images, seasons, episodes, crew, cast)', async () => {
    const show = { id: 42, name: 'Test' } as unknown as TvmazeShow
    mockGet.mockResolvedValueOnce(show)

    const result = await getShow(42)

    expect(mockGet).toHaveBeenCalledWith(
      '/shows/42?embed[]=images&embed[]=seasons&embed[]=episodes&embed[]=crew&embed[]=cast',
    )
    expect(result).toBe(show)
  })

  it('propagates errors from the api client', async () => {
    mockGet.mockRejectedValueOnce(new Error('not found'))

    await expect(getShow(999)).rejects.toThrow('not found')
  })
})
