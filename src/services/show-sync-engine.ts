/**
 * Pure TypeScript show sync engine.
 * Paginates TVMaze /shows, respects rate limits, supports pause/resume, persists to IndexedDB.
 */

import { ApiError, ApiRateLimitError } from './api-client'
import { getShows } from './tvmaze'
import type { TvmazeShow } from '@/types'
import { getSyncMeta, updateSyncMeta, bulkPutShows, getShowCount, type SyncMeta } from '@/db'
import { RateLimiter } from './rate-limiter'

const RATE_LIMIT_MAX_REQUESTS = 20
const RATE_LIMIT_WINDOW_MS = 10_000
const PROBE_UPPER_OFFSET = 500
const ETA_WINDOW_SIZE = 20
const MAX_RETRIES_TRANSIENT = 5
const BACKOFF_429_INITIAL_MS = 2000
const BACKOFF_429_MAX_MS = 30_000
const BACKOFF_TRANSIENT_MS = [1000, 2000, 4000, 8000, 16_000]

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRateLimitError(err: unknown): err is ApiRateLimitError {
  return err instanceof ApiRateLimitError
}

function isRetryableStatus(status: number): boolean {
  return status >= 500 && status < 600
}

export interface ShowSyncProgress {
  currentPage: number
  lastCompletedPage: number
  totalShowsStored: number
  estimatedTotalPages: number | null
  pagesPerSecond: number
  estimatedTimeRemainingMs: number | null
}

export interface ShowSyncEngineCallbacks {
  onProgress: (p: ShowSyncProgress) => void
  onComplete: () => void
  onError: (message: string) => void
}

export class ShowSyncEngine {
  readonly #rateLimiter = new RateLimiter(RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS)
  readonly #callbacks: ShowSyncEngineCallbacks
  #paused = false
  #stopped = false
  #pageTimestamps: number[] = []

  constructor(callbacks: ShowSyncEngineCallbacks) {
    this.#callbacks = callbacks
  }

  async #waitIfPaused(): Promise<void> {
    while (this.#paused && !this.#stopped) {
      await sleep(100)
    }
  }

  #recordPageTime(): void {
    this.#pageTimestamps.push(Date.now())
    if (this.#pageTimestamps.length > ETA_WINDOW_SIZE) {
      this.#pageTimestamps.shift()
    }
  }

  #getPagesPerSecond(): number {
    if (this.#pageTimestamps.length < 2) return 0
    const span = this.#pageTimestamps[this.#pageTimestamps.length - 1]! - this.#pageTimestamps[0]!
    if (span <= 0) return 0
    return ((this.#pageTimestamps.length - 1) / span) * 1000
  }

  #getEstimatedTimeRemainingMs(remainingPages: number): number | null {
    if (this.#pageTimestamps.length < 2 || remainingPages <= 0) return null
    const span = this.#pageTimestamps[this.#pageTimestamps.length - 1]! - this.#pageTimestamps[0]!
    if (span <= 0) return null
    const msPerPage = span / (this.#pageTimestamps.length - 1)
    return Math.round(remainingPages * msPerPage)
  }

  #emitProgress(meta: SyncMeta, currentPage: number): void {
    const estimatedTotal = meta.estimatedTotalPages
    const remaining =
      estimatedTotal != null && meta.lastCompletedPage >= 0
        ? Math.max(0, estimatedTotal - (meta.lastCompletedPage + 1))
        : 0
    this.#callbacks.onProgress({
      currentPage,
      lastCompletedPage: meta.lastCompletedPage,
      totalShowsStored: meta.totalShowsStored,
      estimatedTotalPages: meta.estimatedTotalPages,
      pagesPerSecond: this.#getPagesPerSecond(),
      estimatedTimeRemainingMs: this.#getEstimatedTimeRemainingMs(remaining),
    })
  }

  async #fetchPageWithRetry(page: number): Promise<TvmazeShow[]> {
    let backoff429Ms = BACKOFF_429_INITIAL_MS

    for (;;) {
      if (this.#stopped) throw new Error('Stopped')
      await this.#rateLimiter.acquire()
      try {
        const shows = await getShows(page)
        return shows
      } catch (err) {
        if (isRateLimitError(err)) {
          await sleep(backoff429Ms)
          backoff429Ms = Math.min(backoff429Ms * 2, BACKOFF_429_MAX_MS)
          continue
        }
        if (err instanceof ApiError && err.status === 404) {
          return []
        }
        const status =
          err && typeof err === 'object' && 'status' in err ? (err as { status: number }).status : 0
        if (status >= 400 && status < 500) {
          throw err
        }
        const isTransient =
          status === 0 ||
          isRetryableStatus(status) ||
          (err instanceof TypeError &&
            (err.message.includes('fetch') || err.message.includes('network')))
        if (!isTransient) throw err
        let lastErr: unknown = err
        for (let i = 0; i < MAX_RETRIES_TRANSIENT; i++) {
          await sleep(BACKOFF_TRANSIENT_MS[i] ?? 16_000)
          try {
            await this.#rateLimiter.acquire()
            const shows = await getShows(page)
            return shows
          } catch (retryErr) {
            lastErr = retryErr
            if (retryErr instanceof ApiError && retryErr.status === 404) return []
            const retryStatus =
              retryErr && typeof retryErr === 'object' && 'status' in retryErr
                ? (retryErr as { status: number }).status
                : 0
            if (retryStatus >= 400 && retryStatus < 500) throw retryErr
          }
        }
        throw lastErr
      }
    }
  }

  async #probeTotalPages(lastCompleted: number): Promise<number> {
    let low = lastCompleted + 1
    let high = lastCompleted + PROBE_UPPER_OFFSET
    while (low < high && !this.#stopped) {
      await this.#waitIfPaused()
      if (this.#stopped) return low
      const mid = (low + high) >> 1
      await this.#rateLimiter.acquire()
      let arr: TvmazeShow[]
      try {
        arr = await getShows(mid)
      } catch (err) {
        if (isRateLimitError(err)) {
          await sleep(BACKOFF_429_INITIAL_MS)
          continue
        }
        // TVMaze returns 404 for out-of-range pages instead of empty array
        if (err instanceof ApiError && err.status === 404) {
          high = mid
          continue
        }
        throw err
      }
      if (arr.length === 0) high = mid
      else low = mid + 1
    }
    return low
  }

  async start(): Promise<void> {
    this.#stopped = false
    this.#pageTimestamps = []
    let meta = await getSyncMeta()
    const lastCompleted = meta?.lastCompletedPage ?? -1
    const totalStored = meta?.totalShowsStored ?? (await getShowCount())
    if (meta == null) {
      await updateSyncMeta({
        lastCompletedPage: lastCompleted,
        totalShowsStored: totalStored,
        estimatedTotalPages: null,
        isCompleted: false,
        isPaused: false,
      })
      meta = (await getSyncMeta())!
    }

    if (meta.estimatedTotalPages == null) {
      const estimatedTotal = await this.#probeTotalPages(lastCompleted)
      await updateSyncMeta({ estimatedTotalPages: estimatedTotal })
      meta = (await getSyncMeta())!
    }

    let page = lastCompleted + 1

    while (!this.#stopped) {
      await this.#waitIfPaused()
      if (this.#stopped) break
      let shows: TvmazeShow[]
      try {
        shows = await this.#fetchPageWithRetry(page)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        this.#callbacks.onError(message)
        return
      }
      if (shows.length === 0) {
        await updateSyncMeta({
          lastCompletedPage: page - 1,
          totalShowsStored: meta.totalShowsStored,
          estimatedTotalPages: page,
          isCompleted: true,
          isPaused: false,
        })
        this.#callbacks.onComplete()
        return
      }
      try {
        await bulkPutShows(shows)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        this.#callbacks.onError(`IndexedDB write failed: ${message}`)
        return
      }
      const newTotal: number = meta.totalShowsStored + shows.length
      await updateSyncMeta({
        lastCompletedPage: page,
        totalShowsStored: newTotal,
      })
      meta = { ...meta, lastCompletedPage: page, totalShowsStored: newTotal }
      this.#recordPageTime()
      this.#emitProgress(meta, page)
      page++
    }
  }

  pause(): void {
    this.#paused = true
  }

  resume(): void {
    this.#paused = false
  }

  dispose(): void {
    this.#stopped = true
    this.#paused = false
    this.#rateLimiter.dispose()
  }
}
