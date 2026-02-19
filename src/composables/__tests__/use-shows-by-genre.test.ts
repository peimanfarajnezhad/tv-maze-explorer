import { ref } from 'vue'
import { describe, it, expect, beforeEach } from 'vitest'

import { db } from '@/db'
import { genreNameToSlug } from '@/lib/slug'
import { clearDb, makeShow, mountComposable, flushPromises, waitUntil } from '@/test-utils'

import { useShowsByGenre } from '../use-shows-by-genre'

const PAGE_SIZE = 20

describe('useShowsByGenre', () => {
  beforeEach(async () => {
    await clearDb()
  })

  it('returns all expected refs and loadMore function', () => {
    const routeId = ref('drama')
    const { result } = mountComposable(() => useShowsByGenre(routeId))

    expect(result.genreName).toBeDefined()
    expect(result.genreSlug).toBeDefined()
    expect(result.shows).toBeDefined()
    expect(result.hasMore).toBeDefined()
    expect(result.isLoading).toBeDefined()
    expect(result.notFound).toBeDefined()
    expect(typeof result.loadMore).toBe('function')
  })

  it('resolves genre by slug and loads shows for that genre', async () => {
    await db.shows.bulkPut([
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
    expect(result.hasMore.value).toBe(false)
  })

  it('sets notFound and genreName from slug when genre does not exist', async () => {
    await db.shows.bulkPut([makeShow(1, 'Show', { genres: ['Drama'] })])

    const routeId = ref('non-existent-genre')
    const { result } = mountComposable(() => useShowsByGenre(routeId))
    await flushPromises()
    await waitUntil(() => !result.isLoading.value)

    expect(result.notFound.value).toBe(true)
    expect(result.genreName.value).toBe('Non Existent Genre')
    expect(result.shows.value).toEqual([])
    expect(result.hasMore.value).toBe(false)
  })

  it('treats empty routeId as "All" and returns all shows', async () => {
    await db.shows.bulkPut([
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

  it('paginates with PAGE_SIZE and hasMore', async () => {
    const shows = Array.from({ length: PAGE_SIZE + 5 }, (_, i) =>
      makeShow(i + 1, `Show ${i}`, { genres: ['Drama'] }),
    )
    await db.shows.bulkPut(shows)

    const routeId = ref(genreNameToSlug('Drama'))
    const { result } = mountComposable(() => useShowsByGenre(routeId))
    await flushPromises()
    await waitUntil(() => !result.isLoading.value)

    expect(result.shows.value).toHaveLength(PAGE_SIZE)
    expect(result.hasMore.value).toBe(true)

    await result.loadMore()
    await flushPromises()
    await waitUntil(() => !result.isLoading.value)

    expect(result.shows.value).toHaveLength(PAGE_SIZE + 5)
    expect(result.hasMore.value).toBe(false)
  })

  it('filters by searchQuery when provided', async () => {
    await db.shows.bulkPut([
      makeShow(1, 'Drama Alpha', { genres: ['Drama'] }),
      makeShow(2, 'Drama Beta', { genres: ['Drama'] }),
      makeShow(3, 'Drama Gamma', { genres: ['Drama'] }),
    ])

    const routeId = ref(genreNameToSlug('Drama'))
    const searchQuery = ref('')
    const { result } = mountComposable(() =>
      useShowsByGenre(routeId, { searchQuery }),
    )
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
    await db.shows.bulkPut([
      makeShow(1, 'A', { genres: ['Drama'], rating: { average: 5 }, premiered: '2022-01-01' }),
      makeShow(2, 'B', { genres: ['Drama'], rating: { average: 9 }, premiered: '2020-01-01' }),
      makeShow(3, 'C', { genres: ['Drama'], rating: { average: 7 }, premiered: '2021-01-01' }),
    ])

    const routeId = ref(genreNameToSlug('Drama'))
    const sortField = ref<'id' | 'rating' | 'premiered'>('id')
    const { result } = mountComposable(() =>
      useShowsByGenre(routeId, { sortField }),
    )
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

    expect(result.shows.value.map((s) => s.premiered)).toEqual(['2022-01-01', '2021-01-01', '2020-01-01'])
  })

  it('reloads when routeId changes', async () => {
    await db.shows.bulkPut([
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

  it('loadMore does nothing when hasMore is false or isLoading is true', async () => {
    await db.shows.bulkPut([makeShow(1, 'Only', { genres: ['Drama'] })])

    const routeId = ref(genreNameToSlug('Drama'))
    const { result } = mountComposable(() => useShowsByGenre(routeId))
    await flushPromises()
    await waitUntil(() => !result.isLoading.value)

    expect(result.hasMore.value).toBe(false)
    expect(result.shows.value).toHaveLength(1)

    await result.loadMore()
    await flushPromises()

    expect(result.shows.value).toHaveLength(1)
  })
})
