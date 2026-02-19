import { describe, it, expect, vi, beforeEach } from 'vitest'

import { makeShow } from '@/test-utils'
import type { TvmazeShow } from '@/types'

import { ApiError } from '../api-client'
import { ShowSyncEngine, type ShowSyncEngineCallbacks } from '../show-sync-engine'

const mockGetShows = vi.fn()
const mockGetSyncMeta = vi.fn()
const mockUpdateSyncMeta = vi.fn()
const mockBulkPutShows = vi.fn()
const mockGetShowCount = vi.fn()
const mockAcquire = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))

vi.mock('../tvmaze', () => ({
  getShows: (...args: unknown[]) => mockGetShows(...args),
}))

vi.mock('@/db', () => ({
  getSyncMeta: () => mockGetSyncMeta(),
  updateSyncMeta: (partial: unknown) => mockUpdateSyncMeta(partial),
  bulkPutShows: (shows: unknown) => mockBulkPutShows(shows),
  getShowCount: () => mockGetShowCount(),
}))

vi.mock('../rate-limiter', () => ({
  RateLimiter: class MockRateLimiter {
    acquire() {
      return mockAcquire()
    }
    dispose = vi.fn()
  },
}))

describe('ShowSyncEngine', () => {
  let callbacks: ShowSyncEngineCallbacks

  beforeEach(() => {
    vi.clearAllMocks()
    mockAcquire.mockResolvedValue(undefined)
    callbacks = {
      onProgress: vi.fn(),
      onComplete: vi.fn(),
      onError: vi.fn(),
    }
  })

  describe('start()', () => {
    it('initializes sync meta when none exists and completes when first page is empty', async () => {
      const initialMeta = {
        id: 'showSync',
        lastCompletedPage: -1,
        totalShowsStored: 0,
        estimatedTotalPages: null as number | null,
        isCompleted: false,
        isPaused: false,
      }
      mockGetSyncMeta
        .mockResolvedValueOnce(undefined)
        .mockResolvedValue(initialMeta)
      mockGetShowCount.mockResolvedValue(0)
      mockGetShows.mockResolvedValue([])

      const engine = new ShowSyncEngine(callbacks)
      await engine.start()

      expect(mockUpdateSyncMeta).toHaveBeenCalledWith(
        expect.objectContaining({
          lastCompletedPage: -1,
          totalShowsStored: 0,
          estimatedTotalPages: null,
          isCompleted: false,
        }),
      )
      expect(mockGetShows).toHaveBeenCalled()
      expect(callbacks.onComplete).toHaveBeenCalled()
      expect(callbacks.onError).not.toHaveBeenCalled()
    })

    it('fetches pages, stores shows, and calls onProgress then onComplete when empty page is reached', async () => {
      const page0Shows = [makeShow(1, 'Show 1'), makeShow(2, 'Show 2')]
      mockGetSyncMeta
        .mockResolvedValueOnce({
          id: 'showSync',
          lastCompletedPage: -1,
          totalShowsStored: 0,
          estimatedTotalPages: 2,
          isCompleted: false,
          isPaused: false,
        })
        .mockResolvedValueOnce({
          id: 'showSync',
          lastCompletedPage: -1,
          totalShowsStored: 0,
          estimatedTotalPages: 2,
          isCompleted: false,
          isPaused: false,
        })
      mockGetShows
        .mockResolvedValueOnce(page0Shows)
        .mockResolvedValueOnce([])

      const engine = new ShowSyncEngine(callbacks)
      await engine.start()

      expect(mockGetShows).toHaveBeenNthCalledWith(1, 0)
      expect(mockBulkPutShows).toHaveBeenCalledWith(page0Shows)
      expect(mockUpdateSyncMeta).toHaveBeenCalledWith(
        expect.objectContaining({
          lastCompletedPage: 0,
          totalShowsStored: 2,
        }),
      )
      expect(callbacks.onProgress).toHaveBeenCalled()
      expect(callbacks.onComplete).toHaveBeenCalled()
      expect(callbacks.onError).not.toHaveBeenCalled()
    })

    it('calls onError when getShows throws a non-retryable error', async () => {
      mockGetSyncMeta.mockResolvedValue({
        id: 'showSync',
        lastCompletedPage: -1,
        totalShowsStored: 0,
        estimatedTotalPages: 1,
        isCompleted: false,
        isPaused: false,
      })
      mockGetShows.mockRejectedValueOnce(new ApiError(403, 'Forbidden'))

      const engine = new ShowSyncEngine(callbacks)
      await engine.start()

      expect(callbacks.onError).toHaveBeenCalledWith('API error: 403 Forbidden')
      expect(callbacks.onComplete).not.toHaveBeenCalled()
    })

    it('calls onError when bulkPutShows throws', async () => {
      mockGetSyncMeta
        .mockResolvedValue({
          id: 'showSync',
          lastCompletedPage: -1,
          totalShowsStored: 0,
          estimatedTotalPages: 1,
          isCompleted: false,
          isPaused: false,
        })
      mockGetShows.mockResolvedValueOnce([makeShow(1, 'A')])
      mockBulkPutShows.mockRejectedValueOnce(new Error('IndexedDB failed'))

      const engine = new ShowSyncEngine(callbacks)
      await engine.start()

      expect(callbacks.onError).toHaveBeenCalledWith('IndexedDB write failed: IndexedDB failed')
      expect(callbacks.onComplete).not.toHaveBeenCalled()
    })

    it('returns 404 page as empty array and then completes', async () => {
      mockGetSyncMeta.mockResolvedValue({
        id: 'showSync',
        lastCompletedPage: -1,
        totalShowsStored: 0,
        estimatedTotalPages: 1,
        isCompleted: false,
        isPaused: false,
      })
      mockGetShows.mockRejectedValueOnce(new ApiError(404, 'Not Found'))

      const engine = new ShowSyncEngine(callbacks)
      await engine.start()

      expect(mockGetShows).toHaveBeenCalled()
      expect(callbacks.onComplete).toHaveBeenCalled()
      expect(callbacks.onError).not.toHaveBeenCalled()
    })
  })

  describe('pause() and resume()', () => {
    it('pause() and resume() do not throw', () => {
      const engine = new ShowSyncEngine(callbacks)
      expect(() => engine.pause()).not.toThrow()
      expect(() => engine.resume()).not.toThrow()
    })
  })

  describe('dispose()', () => {
    it('dispose() sets stopped flag so start() exits on next loop check without calling onComplete', async () => {
      mockGetSyncMeta.mockResolvedValue({
        id: 'showSync',
        lastCompletedPage: -1,
        totalShowsStored: 0,
        estimatedTotalPages: 2,
        isCompleted: false,
        isPaused: false,
      })
      mockGetShowCount.mockResolvedValue(0)
      let resolveFirstPage: (shows: TvmazeShow[]) => void
      const firstPagePromise = new Promise<TvmazeShow[]>((r) => {
        resolveFirstPage = r
      })
      mockGetShows.mockImplementationOnce(() => firstPagePromise)

      const engine = new ShowSyncEngine(callbacks)
      const startPromise = engine.start()

      resolveFirstPage!([makeShow(1, 'A')])
      await Promise.resolve()
      engine.dispose()
      await Promise.resolve()
      await startPromise

      expect(callbacks.onComplete).not.toHaveBeenCalled()
    })
  })
})
