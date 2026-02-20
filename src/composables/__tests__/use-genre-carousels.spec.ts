import { describe, it, expect, beforeEach } from 'vitest'
import { useGenreCarousels } from '../use-genre-carousels'
import { clearDb, makeShow, mountComposable, flushPromises, waitUntil } from '@/test-utils'
import { bulkPutShows } from '@/db'
import { useShowSyncStore } from '@/stores/show-sync'

const CAROUSEL_SIZE = 15

describe('useGenreCarousels', () => {
  beforeEach(async () => {
    await clearDb()
  })

  it('returns refs genres, carousels, isLoading and load function', () => {
    const { result } = mountComposable(() => useGenreCarousels())

    expect(result.genres).toBeDefined()
    expect(Array.isArray(result.genres.value)).toBe(true)
    expect(result.carousels).toBeDefined()
    expect(Array.isArray(result.carousels.value)).toBe(true)
    expect(result.isLoading).toBeDefined()
    expect(typeof result.load).toBe('function')
  })

  it('loads genres and carousels from IndexedDB on mount', async () => {
    await bulkPutShows([
      makeShow(1, 'Show A', { genres: ['Drama'], rating: { average: 9 } }),
      makeShow(2, 'Show B', { genres: ['Drama', 'Comedy'], rating: { average: 8 } }),
      makeShow(3, 'Show C', { genres: ['Comedy'], rating: { average: 7 } }),
    ])

    const { result } = mountComposable(() => useGenreCarousels())
    await flushPromises()

    expect(result.genres.value).toEqual(['Comedy', 'Drama'])
    expect(result.carousels.value).toHaveLength(2)
    expect(result.carousels.value.map((c) => c.genre)).toEqual(['Comedy', 'Drama'])
    expect(result.carousels.value[0]!.shows).toHaveLength(2)
    expect(result.carousels.value[1]!.shows).toHaveLength(2)
    expect(result.isLoading.value).toBe(false)
  })

  it('sorts carousel shows by rating descending', async () => {
    await bulkPutShows([
      makeShow(1, 'Low', { genres: ['Drama'], rating: { average: 5 } }),
      makeShow(2, 'High', { genres: ['Drama'], rating: { average: 9 } }),
      makeShow(3, 'Mid', { genres: ['Drama'], rating: { average: 7 } }),
    ])

    const { result } = mountComposable(() => useGenreCarousels())
    await flushPromises()

    const dramaCarousel = result.carousels.value.find((c) => c.genre === 'Drama')
    expect(dramaCarousel?.shows.map((s) => s.name)).toEqual(['High', 'Mid', 'Low'])
  })

  it('limits each carousel to CAROUSEL_SIZE shows', async () => {
    const shows = Array.from({ length: 20 }, (_, i) =>
      makeShow(i + 1, `Show ${i}`, { genres: ['Action'] }),
    )
    await bulkPutShows(shows)

    const { result } = mountComposable(() => useGenreCarousels())
    await flushPromises()

    const actionCarousel = result.carousels.value.find((c) => c.genre === 'Action')
    expect(actionCarousel?.shows).toHaveLength(CAROUSEL_SIZE)
  })

  it('re-loads when totalShowsStored changes', async () => {
    await bulkPutShows([makeShow(1, 'First', { genres: ['Drama'] })])

    const { result } = mountComposable(() => useGenreCarousels())
    await flushPromises()

    expect(result.carousels.value).toHaveLength(1)

    const store = useShowSyncStore()
    store.$patch({ totalShowsStored: 1 })
    await bulkPutShows([
      makeShow(1, 'First', { genres: ['Drama'] }),
      makeShow(2, 'Second', { genres: ['Comedy'] }),
    ])
    store.$patch({ totalShowsStored: 2 })
    await waitUntil(() => result.carousels.value.length === 2)

    expect(result.genres.value).toEqual(['Comedy', 'Drama'])
    expect(result.carousels.value).toHaveLength(2)
  })

  it('load() can be called manually and refreshes data', async () => {
    await bulkPutShows([makeShow(1, 'First', { genres: ['Drama'] })])

    const { result } = mountComposable(() => useGenreCarousels())
    await flushPromises()

    expect(result.genres.value).toEqual(['Drama'])

    await bulkPutShows([
      makeShow(1, 'First', { genres: ['Drama'] }),
      makeShow(2, 'Second', { genres: ['Comedy'] }),
    ])
    await result.load()
    await flushPromises()

    expect(result.genres.value).toEqual(['Comedy', 'Drama'])
  })

  it('does not reassign genres/carousels when totalShowsStored changes but DB content is unchanged', async () => {
    await bulkPutShows([
      makeShow(1, 'First', { genres: ['Drama'] }),
      makeShow(2, 'Second', { genres: ['Comedy'] }),
    ])

    const { result } = mountComposable(() => useGenreCarousels())
    await flushPromises()

    const genresRefBefore = result.genres.value
    const carouselsRefBefore = result.carousels.value
    expect(genresRefBefore).toEqual(['Comedy', 'Drama'])
    expect(carouselsRefBefore).toHaveLength(2)

    const store = useShowSyncStore()
    store.$patch({ totalShowsStored: 2 })
    await new Promise((r) => setTimeout(r, 350))
    await flushPromises()

    expect(result.genres.value).toBe(genresRefBefore)
    expect(result.carousels.value).toBe(carouselsRefBefore)
  })
})
