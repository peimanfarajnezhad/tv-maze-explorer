import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { get, ApiError, ApiRateLimitError } from '../api-client'

vi.mock('@/shared/config', () => ({
  CONFIG: { API_HOST: 'https://api.tvmaze.com' },
}))

describe('ApiError', () => {
  it('stores status and statusText', () => {
    const err = new ApiError(404, 'Not Found')

    expect(err).toBeInstanceOf(Error)
    expect(err.name).toBe('ApiError')
    expect(err.status).toBe(404)
    expect(err.statusText).toBe('Not Found')
    expect(err.message).toBe('API error: 404 Not Found')
  })
})

describe('ApiRateLimitError', () => {
  it('is an ApiError with status 429', () => {
    const err = new ApiRateLimitError('Too Many Requests')

    expect(err).toBeInstanceOf(ApiError)
    expect(err).toBeInstanceOf(Error)
    expect(err.name).toBe('ApiRateLimitError')
    expect(err.status).toBe(429)
    expect(err.statusText).toBe('Too Many Requests')
  })
})

describe('get()', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches from the correct URL with Accept header', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    })

    await get('/shows?page=0')

    expect(mockFetch).toHaveBeenCalledWith('https://api.tvmaze.com/shows?page=0', {
      headers: { Accept: 'application/json' },
    })
  })

  it('strips trailing slashes from API_HOST', async () => {
    const { CONFIG } = await import('@/shared/config')
    const original = CONFIG.API_HOST
    Object.assign(CONFIG, { API_HOST: 'https://api.tvmaze.com///' })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    })

    await get('/shows/1')

    expect(mockFetch).toHaveBeenCalledWith('https://api.tvmaze.com/shows/1', {
      headers: { Accept: 'application/json' },
    })

    Object.assign(CONFIG, { API_HOST: original })
  })

  it('returns parsed JSON on success', async () => {
    const payload = { id: 1, name: 'Test Show' }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(payload),
    })

    const result = await get<{ id: number; name: string }>('/shows/1')

    expect(result).toEqual(payload)
  })

  it('throws ApiRateLimitError on 429', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
    })

    const error = await get('/shows').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiRateLimitError)
    expect((error as ApiRateLimitError).status).toBe(429)
    expect((error as ApiRateLimitError).statusText).toBe('Too Many Requests')
  })

  it('throws ApiError on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    })

    await expect(get('/shows')).rejects.toThrow(ApiError)
  })

  it('throws ApiError with correct status for 404', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    })

    const error = await get('/shows/999').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(404)
    expect((error as ApiError).statusText).toBe('Not Found')
  })

  it('propagates network errors from fetch', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    await expect(get('/shows')).rejects.toThrow(TypeError)
  })
})
