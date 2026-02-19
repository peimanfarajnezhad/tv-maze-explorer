import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RateLimiter } from '../rate-limiter'

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('acquire()', () => {
    it('resolves immediately when under the limit', async () => {
      const limiter = new RateLimiter(2, 10_000)

      const p1 = limiter.acquire()
      await vi.runAllTimersAsync()

      await expect(p1).resolves.toBeUndefined()
    })

    it('allows up to maxRequests acquires within the window', async () => {
      const limiter = new RateLimiter(2, 10_000)

      const p1 = limiter.acquire()
      const p2 = limiter.acquire()
      await vi.runAllTimersAsync()

      await expect(p1).resolves.toBeUndefined()
      await expect(p2).resolves.toBeUndefined()
    })

    it('queues additional acquires when limit is reached and resolves after window passes', async () => {
      const limiter = new RateLimiter(2, 100)
      const p1 = limiter.acquire()
      const p2 = limiter.acquire()
      const p3 = limiter.acquire()

      await vi.runAllTimersAsync()
      await expect(p1).resolves.toBeUndefined()
      await expect(p2).resolves.toBeUndefined()
      // p3 is queued; advance past window so first 2 timestamps expire
      vi.advanceTimersByTime(150)
      await vi.runAllTimersAsync()

      await expect(p3).resolves.toBeUndefined()
    })

    it('rejects with "RateLimiter disposed" when disposed before acquire resolves', async () => {
      const limiter = new RateLimiter(1, 10_000)
      const p1 = limiter.acquire()
      await expect(p1).resolves.toBeUndefined()

      const p2 = limiter.acquire()
      limiter.dispose()

      await expect(p2).rejects.toThrow('RateLimiter disposed')
    })

    it('rejects immediately when acquire() is called after dispose()', async () => {
      const limiter = new RateLimiter(2, 10_000)
      limiter.dispose()

      await expect(limiter.acquire()).rejects.toThrow('RateLimiter disposed')
    })
  })

  describe('dispose()', () => {
    it('rejects all pending waiters in the queue', async () => {
      const limiter = new RateLimiter(1, 100_000)
      const p1 = limiter.acquire()
      await expect(p1).resolves.toBeUndefined()

      const p2 = limiter.acquire()
      const p3 = limiter.acquire()
      limiter.dispose()

      await expect(p2).rejects.toThrow('RateLimiter disposed')
      await expect(p3).rejects.toThrow('RateLimiter disposed')
    })
  })
})
