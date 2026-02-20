import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

import type { ShowSyncProgress } from '@/services/show-sync-engine'

import { useShowSyncStore } from '../show-sync'

const mockGetSyncMeta = vi.fn()
const mockUpdateSyncMeta = vi.fn()

vi.mock('@/db', () => ({
  getSyncMeta: () => mockGetSyncMeta(),
  updateSyncMeta: (partial: unknown) => mockUpdateSyncMeta(partial),
}))

/** Captured callbacks passed to ShowSyncEngine constructor */
let engineCallbacks: {
  onProgress: (p: ShowSyncProgress) => void
  onComplete: () => void
  onError: (message: string) => void
} | null = null

const mockEngineStart = vi.fn()
const mockEnginePause = vi.fn()
const mockEngineResume = vi.fn()
const mockEngineDispose = vi.fn()

vi.mock('@/services/show-sync-engine', () => ({
  ShowSyncEngine: class MockShowSyncEngine {
    constructor(callbacks: typeof engineCallbacks) {
      engineCallbacks = callbacks
    }
    start = mockEngineStart
    pause = mockEnginePause
    resume = mockEngineResume
    dispose = mockEngineDispose
  },
}))

function getStore() {
  return useShowSyncStore()
}

function makeProgress(overrides: Partial<ShowSyncProgress> = {}): ShowSyncProgress {
  return {
    currentPage: 0,
    lastCompletedPage: -1,
    totalShowsStored: 0,
    estimatedTotalPages: null,
    pagesPerSecond: 0,
    estimatedTimeRemainingMs: null,
    ...overrides,
  }
}

describe('useShowSyncStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    engineCallbacks = null
  })

  describe('initial state', () => {
    it('has idle status and default ref values', () => {
      const store = getStore()
      expect(store.isInitialized).toBe(false)
      expect(store.status).toBe('idle')
      expect(store.currentPage).toBe(0)
      expect(store.totalShowsStored).toBe(0)
      expect(store.estimatedTotalPages).toBeNull()
      expect(store.lastCompletedPage).toBe(-1)
      expect(store.pagesPerSecond).toBe(0)
      expect(store.estimatedTimeRemainingMs).toBeNull()
      expect(store.errorMessage).toBeNull()
      expect(store.startedAt).toBeNull()
    })

    it('progressPercent is null when no progress data', () => {
      const store = getStore()
      expect(store.progressPercent).toBeNull()
    })

    it('formattedETA is em dash when no ETA', () => {
      const store = getStore()
      expect(store.formattedETA).toBe('—')
    })

    it('isReady is false when not initialized', () => {
      const store = getStore()
      expect(store.isReady).toBe(false)
    })
  })

  describe('isInitialized / isReady', () => {
    it('isInitialized is true after initialize() when getSyncMeta returns completed', async () => {
      mockGetSyncMeta.mockResolvedValue({
        id: 'showSync',
        lastCompletedPage: 99,
        totalShowsStored: 2500,
        estimatedTotalPages: 100,
        isCompleted: true,
        isPaused: false,
      })
      const store = getStore()
      await store.initialize()
      expect(store.isInitialized).toBe(true)
      expect(store.isReady).toBe(true)
    })

    it('isInitialized is true after initialize() when getSyncMeta returns paused', async () => {
      mockGetSyncMeta.mockResolvedValue({
        id: 'showSync',
        lastCompletedPage: 42,
        totalShowsStored: 1050,
        estimatedTotalPages: 100,
        isCompleted: false,
        isPaused: true,
      })
      const store = getStore()
      await store.initialize()
      expect(store.isInitialized).toBe(true)
      expect(store.isReady).toBe(true)
    })

    it('isInitialized is true after initialize() when engine is started', async () => {
      mockGetSyncMeta.mockResolvedValue(undefined)
      mockUpdateSyncMeta.mockResolvedValue(undefined)
      const store = getStore()
      await store.initialize()
      expect(store.isInitialized).toBe(true)
      expect(store.isReady).toBe(false)
    })

    it('isReady is false when syncing and totalShowsStored is 0', async () => {
      mockGetSyncMeta.mockResolvedValue(undefined)
      mockUpdateSyncMeta.mockResolvedValue(undefined)
      const store = getStore()
      await store.initialize()
      expect(store.status).toBe('probing')
      expect(store.totalShowsStored).toBe(0)
      expect(store.isReady).toBe(false)
    })

    it('isReady becomes true when totalShowsStored > 0 via onProgress', async () => {
      mockGetSyncMeta.mockResolvedValue(undefined)
      mockUpdateSyncMeta.mockResolvedValue(undefined)
      const store = getStore()
      await store.initialize()
      expect(store.isReady).toBe(false)
      engineCallbacks!.onProgress(makeProgress({ totalShowsStored: 250 }))
      expect(store.isReady).toBe(true)
    })

    it('isReady is true when status is error', async () => {
      mockGetSyncMeta.mockResolvedValue(undefined)
      mockUpdateSyncMeta.mockResolvedValue(undefined)
      const store = getStore()
      await store.initialize()
      engineCallbacks!.onError('Network failed')
      expect(store.status).toBe('error')
      expect(store.isReady).toBe(true)
    })
  })

  describe('progressPercent computed', () => {
    it('returns null when estimatedTotalPages is null', async () => {
      mockGetSyncMeta.mockResolvedValue(undefined)
      mockUpdateSyncMeta.mockResolvedValue(undefined)
      const store = getStore()
      await store.initialize()
      expect(engineCallbacks).not.toBeNull()
      engineCallbacks!.onProgress(makeProgress({ estimatedTotalPages: null, lastCompletedPage: 0 }))
      expect(store.progressPercent).toBeNull()
    })

    it('returns percentage from lastCompletedPage and estimatedTotalPages', async () => {
      mockGetSyncMeta.mockResolvedValue(undefined)
      mockUpdateSyncMeta.mockResolvedValue(undefined)
      const store = getStore()
      await store.initialize()
      engineCallbacks!.onProgress(
        makeProgress({ estimatedTotalPages: 10, lastCompletedPage: 2, totalShowsStored: 60 }),
      )
      expect(store.progressPercent).toBe(30) // (2+1)/10 * 100
    })

    it('caps at 100', async () => {
      mockGetSyncMeta.mockResolvedValue(undefined)
      mockUpdateSyncMeta.mockResolvedValue(undefined)
      const store = getStore()
      await store.initialize()
      engineCallbacks!.onProgress(
        makeProgress({ estimatedTotalPages: 5, lastCompletedPage: 10, totalShowsStored: 250 }),
      )
      expect(store.progressPercent).toBe(100)
    })
  })

  describe('formattedETA computed', () => {
    it('returns em dash when estimatedTimeRemainingMs is null or <= 0', async () => {
      mockGetSyncMeta.mockResolvedValue(undefined)
      mockUpdateSyncMeta.mockResolvedValue(undefined)
      const store = getStore()
      await store.initialize()
      engineCallbacks!.onProgress(makeProgress({ estimatedTimeRemainingMs: null }))
      expect(store.formattedETA).toBe('—')
      engineCallbacks!.onProgress(makeProgress({ estimatedTimeRemainingMs: 0 }))
      expect(store.formattedETA).toBe('—')
    })

    it('returns seconds when under 60 seconds', async () => {
      mockGetSyncMeta.mockResolvedValue(undefined)
      mockUpdateSyncMeta.mockResolvedValue(undefined)
      const store = getStore()
      await store.initialize()
      engineCallbacks!.onProgress(makeProgress({ estimatedTimeRemainingMs: 30_000 }))
      expect(store.formattedETA).toBe('~30 sec')
    })

    it('returns minutes and seconds when >= 60 seconds', async () => {
      mockGetSyncMeta.mockResolvedValue(undefined)
      mockUpdateSyncMeta.mockResolvedValue(undefined)
      const store = getStore()
      await store.initialize()
      engineCallbacks!.onProgress(makeProgress({ estimatedTimeRemainingMs: 125_000 }))
      expect(store.formattedETA).toBe('~2 min 5 sec')
    })

    it('returns minutes only when seconds are zero', async () => {
      mockGetSyncMeta.mockResolvedValue(undefined)
      mockUpdateSyncMeta.mockResolvedValue(undefined)
      const store = getStore()
      await store.initialize()
      engineCallbacks!.onProgress(makeProgress({ estimatedTimeRemainingMs: 120_000 }))
      expect(store.formattedETA).toBe('~2 min')
    })
  })

  describe('initialize', () => {
    it('sets status to completed and restores meta when getSyncMeta returns completed', async () => {
      mockGetSyncMeta.mockResolvedValue({
        id: 'showSync',
        lastCompletedPage: 99,
        totalShowsStored: 2500,
        estimatedTotalPages: 100,
        isCompleted: true,
        isPaused: false,
      })
      const store = getStore()
      await store.initialize()
      expect(store.status).toBe('completed')
      expect(store.lastCompletedPage).toBe(99)
      expect(store.totalShowsStored).toBe(2500)
      expect(store.estimatedTotalPages).toBe(100)
      expect(mockUpdateSyncMeta).not.toHaveBeenCalled()
      expect(mockEngineStart).not.toHaveBeenCalled()
    })

    it('sets status to paused and restores meta when getSyncMeta returns paused', async () => {
      mockGetSyncMeta.mockResolvedValue({
        id: 'showSync',
        lastCompletedPage: 42,
        totalShowsStored: 1050,
        estimatedTotalPages: 100,
        isCompleted: false,
        isPaused: true,
      })
      const store = getStore()
      await store.initialize()
      expect(store.status).toBe('paused')
      expect(store.lastCompletedPage).toBe(42)
      expect(store.totalShowsStored).toBe(1050)
      expect(store.estimatedTotalPages).toBe(100)
      expect(mockEngineStart).not.toHaveBeenCalled()
    })

    it('calls startEngine when getSyncMeta returns undefined or not completed/paused', async () => {
      mockGetSyncMeta.mockResolvedValue(undefined)
      mockUpdateSyncMeta.mockResolvedValue(undefined)
      const store = getStore()
      await store.initialize()
      expect(mockUpdateSyncMeta).toHaveBeenCalledWith({ isPaused: false })
      expect(mockEngineStart).toHaveBeenCalled()
      expect(store.status).toBe('probing')
      expect(store.startedAt).not.toBeNull()
    })

    it('calls startEngine when meta exists but not completed and not paused', async () => {
      mockGetSyncMeta.mockResolvedValue({
        id: 'showSync',
        lastCompletedPage: 10,
        totalShowsStored: 250,
        estimatedTotalPages: 100,
        isCompleted: false,
        isPaused: false,
      })
      mockUpdateSyncMeta.mockResolvedValue(undefined)
      const store = getStore()
      await store.initialize()
      expect(mockEngineStart).toHaveBeenCalled()
      expect(store.status).toBe('probing')
    })
  })

  describe('startEngine (via initialize)', () => {
    it('sets status to probing and creates engine with callbacks', async () => {
      mockGetSyncMeta.mockResolvedValue(undefined)
      mockUpdateSyncMeta.mockResolvedValue(undefined)
      const store = getStore()
      await store.initialize()
      expect(store.status).toBe('probing')
      expect(store.errorMessage).toBeNull()
      expect(store.startedAt).not.toBeNull()
      expect(mockUpdateSyncMeta).toHaveBeenCalledWith({ isPaused: false })
      expect(engineCallbacks).not.toBeNull()
      expect(mockEngineStart).toHaveBeenCalled()
    })

    it('transitions to syncing when onProgress is called', async () => {
      mockGetSyncMeta.mockResolvedValue(undefined)
      mockUpdateSyncMeta.mockResolvedValue(undefined)
      const store = getStore()
      await store.initialize()
      engineCallbacks!.onProgress(makeProgress({ currentPage: 1 }))
      expect(store.status).toBe('syncing')
    })

    it('updates progress state when onProgress is called', async () => {
      mockGetSyncMeta.mockResolvedValue(undefined)
      mockUpdateSyncMeta.mockResolvedValue(undefined)
      const store = getStore()
      await store.initialize()
      const p = makeProgress({
        currentPage: 3,
        lastCompletedPage: 2,
        totalShowsStored: 75,
        estimatedTotalPages: 100,
        pagesPerSecond: 2,
        estimatedTimeRemainingMs: 45_000,
      })
      engineCallbacks!.onProgress(p)
      expect(store.currentPage).toBe(3)
      expect(store.lastCompletedPage).toBe(2)
      expect(store.totalShowsStored).toBe(75)
      expect(store.estimatedTotalPages).toBe(100)
      expect(store.pagesPerSecond).toBe(2)
      expect(store.estimatedTimeRemainingMs).toBe(45_000)
    })

    it('sets status to completed and disposes engine when onComplete is called', async () => {
      mockGetSyncMeta.mockResolvedValue(undefined)
      mockUpdateSyncMeta.mockResolvedValue(undefined)
      const store = getStore()
      await store.initialize()
      engineCallbacks!.onComplete()
      expect(store.status).toBe('completed')
      expect(store.estimatedTimeRemainingMs).toBeNull()
      expect(mockEngineDispose).toHaveBeenCalled()
    })

    it('sets status to error and errorMessage when onError is called', async () => {
      mockGetSyncMeta.mockResolvedValue(undefined)
      mockUpdateSyncMeta.mockResolvedValue(undefined)
      const store = getStore()
      await store.initialize()
      engineCallbacks!.onError('Network failed')
      expect(store.status).toBe('error')
      expect(store.errorMessage).toBe('Network failed')
      expect(store.estimatedTimeRemainingMs).toBeNull()
      expect(mockEngineDispose).toHaveBeenCalled()
    })

    it('does not create a second engine if initialize is called again while engine exists', async () => {
      mockGetSyncMeta.mockResolvedValue(undefined)
      mockUpdateSyncMeta.mockResolvedValue(undefined)
      const store = getStore()
      await store.initialize()
      await store.initialize()
      expect(mockEngineStart).toHaveBeenCalledTimes(1)
    })
  })

  describe('pause', () => {
    it('calls engine.pause, sets status to paused, and updates sync meta when engine exists', async () => {
      mockGetSyncMeta.mockResolvedValue(undefined)
      mockUpdateSyncMeta.mockResolvedValue(undefined)
      const store = getStore()
      await store.initialize()
      store.pause()
      expect(mockEnginePause).toHaveBeenCalled()
      expect(store.status).toBe('paused')
      expect(mockUpdateSyncMeta).toHaveBeenLastCalledWith({ isPaused: true })
    })

    it('does nothing when no engine is running', () => {
      const store = getStore()
      store.pause()
      expect(mockEnginePause).not.toHaveBeenCalled()
      expect(mockUpdateSyncMeta).not.toHaveBeenCalled()
    })
  })

  describe('resume', () => {
    it('calls engine.resume and sets status to syncing when engine exists', async () => {
      mockGetSyncMeta.mockResolvedValue(undefined)
      mockUpdateSyncMeta.mockResolvedValue(undefined)
      const store = getStore()
      await store.initialize()
      store.pause()
      store.resume()
      expect(mockEngineResume).toHaveBeenCalled()
      expect(store.status).toBe('syncing')
      expect(mockUpdateSyncMeta).toHaveBeenLastCalledWith({ isPaused: false })
    })

    it('starts engine when status is paused but no engine (e.g. after page reload)', async () => {
      mockGetSyncMeta.mockResolvedValue({
        id: 'showSync',
        lastCompletedPage: 5,
        totalShowsStored: 125,
        estimatedTotalPages: 100,
        isCompleted: false,
        isPaused: true,
      })
      mockUpdateSyncMeta.mockResolvedValue(undefined)
      const store = getStore()
      await store.initialize()
      expect(store.status).toBe('paused')
      expect(mockEngineStart).not.toHaveBeenCalled()
      store.resume()
      expect(mockEngineStart).toHaveBeenCalled()
      expect(store.status).toBe('probing')
    })
  })

  describe('retry', () => {
    it('clears error and starts engine when status is error', async () => {
      mockGetSyncMeta.mockResolvedValue(undefined)
      mockUpdateSyncMeta.mockResolvedValue(undefined)
      const store = getStore()
      await store.initialize()
      engineCallbacks!.onError('Something went wrong')
      expect(store.status).toBe('error')
      expect(store.errorMessage).toBe('Something went wrong')
      store.retry()
      expect(store.errorMessage).toBeNull()
      expect(mockEngineStart).toHaveBeenCalledTimes(2)
    })

    it('does nothing when status is not error', async () => {
      mockGetSyncMeta.mockResolvedValue(undefined)
      mockUpdateSyncMeta.mockResolvedValue(undefined)
      const store = getStore()
      await store.initialize()
      const startCalls = mockEngineStart.mock.calls.length
      store.retry()
      expect(mockEngineStart).toHaveBeenCalledTimes(startCalls)
    })
  })
})
