import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import type { ShowSyncProgress } from '@/features/show-sync/model/engine'
import { bulkPutShows } from '@/shared/db'
import {
  screen,
  renderWithProviders,
  waitFor,
  makeShow,
  clearDb,
  flushPromises,
  mockEmblaCarousel,
} from '@/test-utils'

import App from '@/app/App.vue'
import { CONFIG } from '@/shared/config'

const mockGetSyncMeta = vi.fn()
const mockUpdateSyncMeta = vi.fn()

vi.mock('@/shared/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/db')>()
  return {
    ...actual,
    getSyncMeta: () => mockGetSyncMeta(),
    updateSyncMeta: (partial: unknown) => mockUpdateSyncMeta(partial),
  }
})

let engineCallbacks: {
  onProgress: (p: ShowSyncProgress) => void
  onComplete: () => void
  onError: (message: string) => void
} | null = null

vi.mock('@/features/show-sync/model/engine', () => ({
  ShowSyncEngine: class {
    constructor(cb: typeof engineCallbacks) {
      engineCallbacks = cb
    }
    start() {}
    dispose() {}
  },
}))

vi.mock('@/shared/ui/carousel', () => mockEmblaCarousel())

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

describe('App readiness gate', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    mockUpdateSyncMeta.mockResolvedValue(undefined)
    engineCallbacks = null
  })

  afterEach(async () => {
    await clearDb()
  })

  it('shows loading screen when store is not ready', async () => {
    mockGetSyncMeta.mockResolvedValue(undefined)

    await renderWithProviders(App, {
      useRouter: true,
      initialRoute: '/',
    })
    await flushPromises()

    await waitFor(
      () => {
        expect(screen.getByText(/Preparing your catalog/)).toBeInTheDocument()
        expect(screen.getByText(/This only takes a moment on first visit/)).toBeInTheDocument()
      },
      { timeout: 3000 },
    )
  })

  it('shows RouterView when store is ready (completed sync)', async () => {
    await bulkPutShows([makeShow(1, 'Show A', { genres: ['Drama'] })])

    await renderWithProviders(App, {
      useRouter: true,
      initialRoute: '/',
      initialStoreState: {
        showSync: { isInitialized: true, status: 'completed', totalShowsStored: 2500 },
      },
    })
    await flushPromises()

    await waitFor(
      () => {
        const loading = screen.queryAllByText(/Preparing your catalog/)
        expect(loading.length).toBe(0)
        const mains = screen.getAllByRole('main')
        expect(mains.length).toBeGreaterThanOrEqual(1)
      },
      { timeout: 3000 },
    )
  })

  it('shows RouterView when store has data (syncing)', async () => {
    mockGetSyncMeta.mockResolvedValue(undefined)

    await renderWithProviders(App, {
      useRouter: true,
      initialRoute: '/',
    })
    await flushPromises()
    await flushPromises()

    expect(engineCallbacks).not.toBeNull()
    engineCallbacks!.onProgress(makeProgress({ totalShowsStored: 250 }))
    await flushPromises()

    await waitFor(
      () => {
        const loading = screen.queryAllByText(/Preparing your catalog/)
        expect(loading.length).toBe(0)
        const mains = screen.getAllByRole('main')
        expect(mains.length).toBeGreaterThanOrEqual(1)
      },
      { timeout: 3000 },
    )
  })

  it('shows RouterView when store is in error state', async () => {
    mockGetSyncMeta.mockResolvedValue(undefined)

    await renderWithProviders(App, {
      useRouter: true,
      initialRoute: '/',
    })
    await flushPromises()
    await flushPromises()

    expect(engineCallbacks).not.toBeNull()
    engineCallbacks!.onError('Network failed')
    await flushPromises()

    await waitFor(
      () => {
        const loading = screen.queryAllByText(/Preparing your catalog/)
        expect(loading.length).toBe(0)
        const mains = screen.getAllByRole('main')
        expect(mains.length).toBeGreaterThanOrEqual(1)
      },
      { timeout: 3000 },
    )
  })

  it('shows RouterView when store is paused', async () => {
    await renderWithProviders(App, {
      useRouter: true,
      initialRoute: '/',
      initialStoreState: {
        showSync: { isInitialized: true, status: 'paused', totalShowsStored: 500 },
      },
    })
    await flushPromises()

    await waitFor(
      () => {
        const loading = screen.queryAllByText(/Preparing your catalog/)
        expect(loading.length).toBe(0)
        const mains = screen.getAllByRole('main')
        expect(mains.length).toBeGreaterThanOrEqual(1)
      },
      { timeout: 3000 },
    )
  })

  it('timeout fallback unblocks rendering after max wait', async () => {
    mockGetSyncMeta.mockResolvedValue(undefined)

    vi.useFakeTimers()
    await renderWithProviders(App, {
      useRouter: true,
      initialRoute: '/',
    })
    await vi.advanceTimersByTimeAsync(0)

    expect(screen.getByText(/Preparing your catalog/)).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(CONFIG.INITIAL_MAX_WAIT_MS + 500)
    await vi.advanceTimersByTimeAsync(0)

    const loading = screen.queryAllByText(/Preparing your catalog/)
    expect(loading.length).toBe(0)
    const mains = screen.getAllByRole('main')
    expect(mains.length).toBeGreaterThanOrEqual(1)

    vi.useRealTimers()
  })
})
