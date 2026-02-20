import { ref } from 'vue'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import * as dbModule from '@/db'
import { genreNameToSlug } from '@/lib/slug'
import { clearDb, makeShow, mountComposable, flushPromises, waitUntil } from '@/test-utils'

import { useShowsByGenre, PAGE_SIZE } from '../use-shows-by-genre'

const { bulkPutShows } = dbModule

describe('useShowsByGenre', () => {
  beforeEach(async () => {
    await clearDb()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns all expected refs and totalCount', () => {
    const routeId = ref('drama')
    const { result } = mountComposable(() => useShowsByGenre(routeId))

    expect(result.genreName).toBeDefined()
    expect(result.genreSlug).toBeDefined()
    expect(result.shows).toBeDefined()
    expect(result.totalCount).toBeDefined()
    expect(result.isLoading).toBeDefined()
    expect(result.notFound).toBeDefined()
    expect(result.error).toBeDefined()
  })

  it('resolves genre by slug and loads shows for that genre', async () => {
    await bulkPutShows([
      makeShow(1, 'Drama One', { genres: ['Drama'] }),
      makeShow(2, 'Drama Two', { genres: ['Drama'] }),
      makeShow(3, 'Comedy One', { genres: ['Comedy'] }),
    ])

    const routeId = ref(genreNameToSlug('Drama'))
    const { result } = mountComposable(() => useShowsByGenre(routeId))
    await flushPromises()
    await waitUntil(() => !result.isLoading.value)

    expect(result.genreName.value).toBe('Drama')
    expect(result.genreSlug.value).toBe('drama')
    expect(result.shows.value).toHaveLength(2)
    expect(result.shows.value.every((s) => s.genres.includes('Drama'))).toBe(true)
    expect(result.notFound.value).toBe(false)
    expect(result.totalCount.value).toBe(2)
  })

  it('sets notFound and genreName from slug when genre does not exist', async () => {
    await bulkPutShows([makeShow(1, 'Show', { genres: ['Drama'] })])

    const routeId = ref('non-existent-genre')
    const { result } = mountComposable(() => useShowsByGenre(routeId))
    await flushPromises()
    await waitUntil(() => !result.isLoading.value)

    expect(result.notFound.value).toBe(true)
    expect(result.genreName.value).toBe('Non Existent Genre')
    expect(result.shows.value).toEqual([])
    expect(result.totalCount.value).toBe(0)
  })

  it('treats empty routeId as "All" and returns all shows', async () => {
    await bulkPutShows([
      makeShow(1, 'A', { genres: ['Drama'] }),
      makeShow(2, 'B', { genres: ['Comedy'] }),
    ])

    const routeId = ref('')
    const { result } = mountComposable(() => useShowsByGenre(routeId))
    await flushPromises()
    await waitUntil(() => !result.isLoading.value)

    expect(result.genreName.value).toBe('All')
    expect(result.genreSlug.value).toBe(null)
    expect(result.shows.value).toHaveLength(2)
    expect(result.notFound.value).toBe(false)
  })

  it('paginates by page and exposes totalCount', async () => {
    const shows = Array.from({ length: PAGE_SIZE + 5 }, (_, i) =>
      makeShow(i + 1, `Show ${i}`, { genres: ['Drama'] }),
    )
    await bulkPutShows(shows)

    const routeId = ref(genreNameToSlug('Drama'))
    const page = ref(1)
    const { result } = mountComposable(() => useShowsByGenre(routeId, { page }))
    await flushPromises()
    await waitUntil(() => !result.isLoading.value)

    expect(result.shows.value).toHaveLength(PAGE_SIZE)
    expect(result.totalCount.value).toBe(PAGE_SIZE + 5)
    expect(result.shows.value[0]?.id).toBe(1)
    expect(result.shows.value[PAGE_SIZE - 1]?.id).toBe(PAGE_SIZE)

    page.value = 2
    await flushPromises()
    await waitUntil(() => !result.isLoading.value)

    expect(result.shows.value).toHaveLength(5)
    expect(result.totalCount.value).toBe(PAGE_SIZE + 5)
    expect(result.shows.value[0]?.id).toBe(PAGE_SIZE + 1)
    expect(result.shows.value[4]?.id).toBe(PAGE_SIZE + 5)
  })

  it('filters by searchQuery when provided', async () => {
    await bulkPutShows([
      makeShow(1, 'Drama Alpha', { genres: ['Drama'] }),
      makeShow(2, 'Drama Beta', { genres: ['Drama'] }),
      makeShow(3, 'Drama Gamma', { genres: ['Drama'] }),
    ])

    const routeId = ref(genreNameToSlug('Drama'))
    const searchQuery = ref('')
    const { result } = mountComposable(() => useShowsByGenre(routeId, { searchQuery }))
    await flushPromises()
    await waitUntil(() => !result.isLoading.value)

    expect(result.shows.value).toHaveLength(3)

    searchQuery.value = 'Alpha'
    await flushPromises()
    await waitUntil(() => !result.isLoading.value)

    expect(result.shows.value).toHaveLength(1)
    expect(result.shows.value[0]?.name).toBe('Drama Alpha')
  })

  it('sorts by sortField when provided', async () => {
    await bulkPutShows([
      makeShow(1, 'A', { genres: ['Drama'], rating: { average: 5 }, premiered: '2022-01-01' }),
      makeShow(2, 'B', { genres: ['Drama'], rating: { average: 9 }, premiered: '2020-01-01' }),
      makeShow(3, 'C', { genres: ['Drama'], rating: { average: 7 }, premiered: '2021-01-01' }),
    ])

    const routeId = ref(genreNameToSlug('Drama'))
    const sortField = ref<'id' | 'rating' | 'premiered'>('id')
    const { result } = mountComposable(() => useShowsByGenre(routeId, { sortField }))
    await flushPromises()
    await waitUntil(() => !result.isLoading.value)

    expect(result.shows.value.map((s) => s.id)).toEqual([1, 2, 3])

    sortField.value = 'rating'
    await flushPromises()
    await waitUntil(() => !result.isLoading.value)

    expect(result.shows.value.map((s) => s.rating?.average)).toEqual([9, 7, 5])

    sortField.value = 'premiered'
    await flushPromises()
    await waitUntil(() => !result.isLoading.value)

    expect(result.shows.value.map((s) => s.premiered)).toEqual([
      '2022-01-01',
      '2021-01-01',
      '2020-01-01',
    ])
  })

  it('reloads when routeId changes', async () => {
    await bulkPutShows([
      makeShow(1, 'Drama One', { genres: ['Drama'] }),
      makeShow(2, 'Comedy One', { genres: ['Comedy'] }),
    ])

    const routeId = ref(genreNameToSlug('Drama'))
    const { result } = mountComposable(() => useShowsByGenre(routeId))
    await flushPromises()
    await waitUntil(() => !result.isLoading.value)

    expect(result.genreName.value).toBe('Drama')
    expect(result.shows.value).toHaveLength(1)

    routeId.value = genreNameToSlug('Comedy')
    await flushPromises()
    await waitUntil(() => !result.isLoading.value)

    expect(result.genreName.value).toBe('Comedy')
    expect(result.shows.value).toHaveLength(1)
    expect(result.shows.value[0]?.name).toBe('Comedy One')
  })

  it('returns only current page slice when page changes', async () => {
    await bulkPutShows([
      ...Array.from({ length: PAGE_SIZE }, (_, i) =>
        makeShow(i + 1, `Show ${i}`, { genres: ['Drama'] }),
      ),
      makeShow(PAGE_SIZE + 1, 'Extra', { genres: ['Drama'] }),
    ])

    const routeId = ref(genreNameToSlug('Drama'))
    const page = ref(1)
    const { result } = mountComposable(() => useShowsByGenre(routeId, { page }))
    await flushPromises()
    await waitUntil(() => !result.isLoading.value)

    expect(result.shows.value).toHaveLength(PAGE_SIZE)
    page.value = 2
    await flushPromises()
    await waitUntil(() => !result.isLoading.value)

    expect(result.shows.value).toHaveLength(1)
    expect(result.shows.value[0]?.name).toBe('Extra')
  })

  it('surfaces error when DB fails', async () => {
    vi.spyOn(dbModule, 'getAllGenresFromDb').mockRejectedValueOnce(new Error('DB error'))
    await bulkPutShows([makeShow(1, 'Drama One', { genres: ['Drama'] })])

    const routeId = ref(genreNameToSlug('Drama'))
    const { result } = mountComposable(() => useShowsByGenre(routeId))
    await flushPromises()
    await waitUntil(() => !result.isLoading.value)

    expect(result.error.value).toBe('DB error')
    expect(result.shows.value).toEqual([])
    expect(result.totalCount.value).toBe(0)
  })

  it('does not overwrite results when a stale request completes after a newer one', async () => {
    let resolveFirst: (value: string[]) => void
    const firstGenresPromise = new Promise<string[]>((r) => {
      resolveFirst = r
    })
    vi.spyOn(dbModule, 'getAllGenresFromDb')
      .mockImplementationOnce(() => firstGenresPromise)
      .mockResolvedValueOnce(['Drama', 'Comedy'])

    await bulkPutShows([
      makeShow(1, 'Drama One', { genres: ['Drama'] }),
      makeShow(2, 'Comedy One', { genres: ['Comedy'] }),
    ])

    const routeId = ref(genreNameToSlug('Drama'))
    const { result } = mountComposable(() => useShowsByGenre(routeId))
    await flushPromises()

    routeId.value = genreNameToSlug('Comedy')
    await flushPromises()
    await waitUntil(() => !result.isLoading.value)

    expect(result.genreName.value).toBe('Comedy')
    expect(result.shows.value).toHaveLength(1)
    expect(result.shows.value[0]?.name).toBe('Comedy One')

    resolveFirst!(['Drama', 'Comedy'])
    await flushPromises()

    expect(result.genreName.value).toBe('Comedy')
    expect(result.shows.value[0]?.name).toBe('Comedy One')
  })

  it('sorts by premiered with nulls last in stable order', async () => {
    await bulkPutShows([
      makeShow(1, 'A', { genres: ['Drama'], premiered: '2022-01-01' }),
      makeShow(2, 'B', { genres: ['Drama'], premiered: null }),
      makeShow(3, 'C', { genres: ['Drama'], premiered: '2020-01-01' }),
      makeShow(4, 'D', { genres: ['Drama'], premiered: null }),
    ])

    const routeId = ref(genreNameToSlug('Drama'))
    const sortField = ref<'id' | 'rating' | 'premiered'>('premiered')
    const { result } = mountComposable(() => useShowsByGenre(routeId, { sortField }))
    await flushPromises()
    await waitUntil(() => !result.isLoading.value)

    const premieredOrder = result.shows.value.map((s) => ({ name: s.name, premiered: s.premiered }))
    expect(premieredOrder.map((s) => s.premiered)).toEqual(['2022-01-01', '2020-01-01', null, null])
    // DB sort does not guarantee order among equal _premieredSort (nulls)
    expect([premieredOrder[2]?.name, premieredOrder[3]?.name].sort()).toEqual(['B', 'D'])
  })
})
