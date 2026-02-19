import { describe, it, expect, beforeEach, vi } from 'vitest'

import { db } from '@/db'
import { useShowSyncStore } from '@/stores/show-sync'

import { useAllGenres } from '../use-all-genres'
import { clearDb, makeShow, mountComposable, flushPromises } from './test-utils'

describe('useAllGenres', () => {
  beforeEach(async () => {
    await clearDb()
  })

  it('returns refs genres and isLoading', () => {
    const { result } = mountComposable(() => useAllGenres())

    expect(result.genres).toBeDefined()
    expect(Array.isArray(result.genres.value)).toBe(true)
    expect(result.genres.value).toEqual([])
    expect(result.isLoading).toBeDefined()
    expect(typeof result.isLoading.value).toBe('boolean')
  })

  it('loads sorted unique genres from IndexedDB on mount', async () => {
    await db.shows.bulkPut([
      makeShow(1, 'Show A', { genres: ['Drama', 'Comedy'] }),
      makeShow(2, 'Show B', { genres: ['Comedy', 'Action'] }),
      makeShow(3, 'Show C', { genres: ['Drama'] }),
    ])

    const { result } = mountComposable(() => useAllGenres())
    await flushPromises()

    expect(result.genres.value).toEqual(['Action', 'Comedy', 'Drama'])
    expect(result.isLoading.value).toBe(false)
  })

  it('returns empty array when no shows in DB', async () => {
    const { result } = mountComposable(() => useAllGenres())
    await flushPromises()

    expect(result.genres.value).toEqual([])
    expect(result.isLoading.value).toBe(false)
  })

  it('re-loads when totalShowsStored changes', async () => {
    await db.shows.bulkPut([makeShow(1, 'First', { genres: ['Drama'] })])

    const { result } = mountComposable(() => useAllGenres())
    await flushPromises()

    expect(result.genres.value).toEqual(['Drama'])

    const store = useShowSyncStore()
    store.$patch({ totalShowsStored: 1 })
    await db.shows.bulkPut([
      makeShow(1, 'First', { genres: ['Drama'] }),
      makeShow(2, 'Second', { genres: ['Comedy'] }),
    ])
    store.$patch({ totalShowsStored: 2 })
    await flushPromises()

    expect(result.genres.value).toEqual(['Comedy', 'Drama'])
  })

  it('does not replace genres array when reload yields same list (avoids unnecessary re-renders)', async () => {
    await db.shows.bulkPut([
      makeShow(1, 'First', { genres: ['Drama'] }),
      makeShow(2, 'Second', { genres: ['Comedy'] }),
    ])

    const { result } = mountComposable(() => useAllGenres())
    await flushPromises()

    expect(result.genres.value).toEqual(['Comedy', 'Drama'])
    const refBefore = result.genres.value

    const store = useShowSyncStore()
    store.$patch({ totalShowsStored: 2 })
    await flushPromises()
    store.$patch({ totalShowsStored: 3 })
    await flushPromises()

    expect(result.genres.value).toEqual(['Comedy', 'Drama'])
    expect(result.genres.value).toBe(refBefore)
  })
})
